import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

// Asset types and categories
const ASSET_CATEGORIES = [
  'logos',
  'favicons',
  'social_media',
  'business_collateral',
  'digital',
  'templates',
] as const

type AssetCategory = (typeof ASSET_CATEGORIES)[number]

interface AssetSpec {
  id: string
  name: string
  category: AssetCategory
  description: string
  formats: string[]
  sizes?: string[]
  required: boolean
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  generatedAt?: string
  url?: string
  variants?: string[]
}

interface AssetFolder {
  name: string
  description: string
  contents: string[]
}

interface GeneratedAssets {
  brandName: string
  checklist: AssetSpec[]
  folderStructure: AssetFolder[]
  namingConvention: string
  brandGuidelines: {
    sections: string[]
    generatedAt?: string
  }
  metadata: {
    createdAt: string
    lastUpdatedAt: string
    totalAssets: number
    completedAssets: number
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        brandingData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, data } = body

    switch (action) {
      case 'generate_checklist': {
        // Artisan generates asset checklist based on business type
        const checklist = generateAssetChecklist(business.name, data.businessType)
        const folderStructure = generateFolderStructure(business.name)

        return NextResponse.json({
          success: true,
          checklist,
          folderStructure,
          namingConvention: `${sanitizeName(business.name)}-[asset]-[variant]-[size].[format]`,
          message: 'Asset checklist generated. Review required assets.',
        })
      }

      case 'generate_logos': {
        // Generate logo package specifications
        const logoSpecs = generateLogoSpecs(business.name, data.visualIdentity)

        return NextResponse.json({
          success: true,
          logos: logoSpecs,
          message: 'Logo specifications generated. Ready for production.',
        })
      }

      case 'generate_favicons': {
        // Generate favicon set specifications
        const faviconSpecs = generateFaviconSpecs(business.name)

        return NextResponse.json({
          success: true,
          favicons: faviconSpecs,
          message: 'Favicon set specifications generated.',
        })
      }

      case 'generate_social': {
        // Generate social media asset specifications
        const socialSpecs = generateSocialMediaSpecs(business.name, data.visualIdentity)

        return NextResponse.json({
          success: true,
          socialMedia: socialSpecs,
          message: 'Social media assets specifications generated.',
        })
      }

      case 'generate_collateral': {
        // Generate business collateral specifications
        const collateralSpecs = generateCollateralSpecs(business.name, data.visualIdentity)

        return NextResponse.json({
          success: true,
          collateral: collateralSpecs,
          message: 'Business collateral specifications generated.',
        })
      }

      case 'generate_guidelines': {
        // Generate brand guidelines document
        const positioning = business.brandingData?.positioning as Record<string, unknown> | null
        const voiceGuidelines = business.brandingData?.voiceGuidelines as Record<string, unknown> | null
        const visualIdentity = business.brandingData?.visualIdentity as Record<string, unknown> | null

        const guidelines = generateBrandGuidelines(
          business.name,
          positioning,
          voiceGuidelines,
          visualIdentity
        )

        return NextResponse.json({
          success: true,
          guidelines,
          message: 'Brand guidelines document generated.',
        })
      }

      case 'update_asset_status': {
        // Update status of a specific asset
        const { assetId, status, url } = data
        const existingAssets = (business.brandingData?.generatedAssets as GeneratedAssets | null)

        if (!existingAssets) {
          return NextResponse.json(
            { error: 'Asset checklist not initialized' },
            { status: 400 }
          )
        }

        const updatedChecklist = existingAssets.checklist.map((asset) =>
          asset.id === assetId
            ? {
                ...asset,
                status,
                url: url || asset.url,
                generatedAt: status === 'completed' ? new Date().toISOString() : asset.generatedAt,
              }
            : asset
        )

        const completedCount = updatedChecklist.filter((a) => a.status === 'completed').length

        const updatedAssets: GeneratedAssets = {
          ...existingAssets,
          checklist: updatedChecklist,
          metadata: {
            ...existingAssets.metadata,
            lastUpdatedAt: new Date().toISOString(),
            completedAssets: completedCount,
          },
        }

        await updateBrandingSession(businessId, business.brandingData?.id, {
          generatedAssets: updatedAssets,
        })

        return NextResponse.json({
          success: true,
          asset: updatedChecklist.find((a) => a.id === assetId),
          message: `Asset ${assetId} updated to ${status}`,
        })
      }

      case 'finalize': {
        // Finalize asset generation
        const generatedAssets: GeneratedAssets = {
          ...data.assets,
          metadata: {
            ...data.assets.metadata,
            lastUpdatedAt: new Date().toISOString(),
          },
        }

        await updateBrandingSession(businessId, business.brandingData?.id, {
          generatedAssets,
          completedWorkflows: ['asset_generation'],
        })

        return NextResponse.json({
          success: true,
          generatedAssets,
          message: 'Asset generation complete! Branding workflow finished.',
          next_workflow: 'brand_audit',
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Asset generation error:', error)
    return NextResponse.json(
      { error: 'Failed to process asset generation request' },
      { status: 500 }
    )
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params
    const headersList = await headers()
    const session = await auth.api.getSession({ headers: headersList })

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        brandingData: true,
      },
    })

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    const brandingSession = business.brandingData
    const generatedAssets = brandingSession?.generatedAssets as GeneratedAssets | null

    return NextResponse.json({
      success: true,
      categories: ASSET_CATEGORIES,
      currentAssets: generatedAssets,
      isComplete: brandingSession?.completedWorkflows?.includes('asset_generation') ?? false,
    })
  } catch (error) {
    console.error('Get assets error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve assets' },
      { status: 500 }
    )
  }
}

// Helper functions

async function updateBrandingSession(
  businessId: string,
  sessionId: string | undefined,
  data: {
    generatedAssets?: GeneratedAssets
    completedWorkflows?: string[]
  }
) {
  if (sessionId) {
    const existing = await prisma.brandingSession.findUnique({
      where: { id: sessionId },
    })

    const existingWorkflows = (existing?.completedWorkflows as string[]) || []
    const newWorkflows = data.completedWorkflows || []
    const mergedWorkflows = [...new Set([...existingWorkflows, ...newWorkflows])]

    await prisma.brandingSession.update({
      where: { id: sessionId },
      data: {
        generatedAssets: data.generatedAssets ? (data.generatedAssets as object) : undefined,
        completedWorkflows: mergedWorkflows,
        updatedAt: new Date(),
      },
    })
  } else {
    await prisma.brandingSession.create({
      data: {
        businessId,
        generatedAssets: data.generatedAssets ? (data.generatedAssets as object) : undefined,
        completedWorkflows: data.completedWorkflows || [],
      },
    })
  }
}

function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function generateAssetChecklist(
  businessName: string,
  _businessType?: string
): AssetSpec[] {
  const brandSlug = sanitizeName(businessName)

  return [
    // Logos
    {
      id: 'logo-primary-full',
      name: 'Primary Logo (Full Color)',
      category: 'logos',
      description: 'Main logo with full brand colors',
      formats: ['svg', 'png'],
      sizes: ['@1x', '@2x', '@3x'],
      required: true,
      status: 'pending',
      variants: ['full-color', 'reversed', 'monochrome'],
    },
    {
      id: 'logo-icon',
      name: 'Logo Icon',
      category: 'logos',
      description: 'Standalone icon/symbol version',
      formats: ['svg', 'png'],
      sizes: ['@1x', '@2x', '@3x'],
      required: true,
      status: 'pending',
    },
    {
      id: 'logo-wordmark',
      name: 'Wordmark',
      category: 'logos',
      description: 'Text-only logo version',
      formats: ['svg', 'png'],
      sizes: ['@1x', '@2x', '@3x'],
      required: false,
      status: 'pending',
    },

    // Favicons
    {
      id: 'favicon-set',
      name: 'Favicon Set',
      category: 'favicons',
      description: 'Complete favicon set for all devices',
      formats: ['ico', 'png', 'svg'],
      sizes: ['16x16', '32x32', '48x48', '180x180', '192x192', '512x512'],
      required: true,
      status: 'pending',
    },

    // Social Media
    {
      id: 'social-profile',
      name: 'Social Profile Images',
      category: 'social_media',
      description: 'Profile pictures for social platforms',
      formats: ['png', 'jpg'],
      sizes: ['400x400', '800x800'],
      required: true,
      status: 'pending',
      variants: ['facebook', 'instagram', 'linkedin', 'twitter', 'youtube'],
    },
    {
      id: 'social-cover',
      name: 'Social Cover Images',
      category: 'social_media',
      description: 'Cover/banner images for social platforms',
      formats: ['png', 'jpg'],
      required: true,
      status: 'pending',
      variants: ['facebook', 'linkedin', 'twitter', 'youtube'],
    },
    {
      id: 'og-image',
      name: 'Open Graph Image',
      category: 'social_media',
      description: 'Default sharing image for links',
      formats: ['png', 'jpg'],
      sizes: ['1200x630'],
      required: true,
      status: 'pending',
    },

    // Business Collateral
    {
      id: 'business-card',
      name: 'Business Card Template',
      category: 'business_collateral',
      description: 'Print-ready business card design',
      formats: ['pdf', 'ai', 'psd'],
      sizes: ['3.5x2in'],
      required: true,
      status: 'pending',
      variants: ['front', 'back'],
    },
    {
      id: 'letterhead',
      name: 'Letterhead Template',
      category: 'business_collateral',
      description: 'Official letterhead design',
      formats: ['pdf', 'docx'],
      sizes: ['letter', 'a4'],
      required: true,
      status: 'pending',
    },
    {
      id: 'email-signature',
      name: 'Email Signature',
      category: 'business_collateral',
      description: 'HTML email signature template',
      formats: ['html'],
      required: true,
      status: 'pending',
    },

    // Digital
    {
      id: 'presentation-template',
      name: 'Presentation Template',
      category: 'digital',
      description: 'Branded slide deck template',
      formats: ['pptx', 'key', 'pdf'],
      required: false,
      status: 'pending',
    },

    // Brand Guidelines
    {
      id: `${brandSlug}-brand-guidelines`,
      name: 'Brand Guidelines Document',
      category: 'templates',
      description: 'Comprehensive brand usage guide',
      formats: ['pdf'],
      required: true,
      status: 'pending',
    },
  ]
}

function generateFolderStructure(businessName: string): AssetFolder[] {
  const brandSlug = sanitizeName(businessName)

  return [
    {
      name: `${brandSlug}-brand-assets/01-logos/`,
      description: 'Logo files in all variations and formats',
      contents: [
        'primary/',
        'primary/vector/',
        'primary/png/',
        'primary/reversed/',
        'secondary/',
        'icon/',
        'wordmark/',
      ],
    },
    {
      name: `${brandSlug}-brand-assets/02-favicons/`,
      description: 'Favicon files for web and apps',
      contents: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png'],
    },
    {
      name: `${brandSlug}-brand-assets/03-colors/`,
      description: 'Color swatches and palette files',
      contents: ['palette.ase', 'palette.css', 'palette.json'],
    },
    {
      name: `${brandSlug}-brand-assets/04-typography/`,
      description: 'Font files and specimens',
      contents: ['fonts/', 'type-specimen.pdf'],
    },
    {
      name: `${brandSlug}-brand-assets/05-social-media/`,
      description: 'Social media graphics',
      contents: ['profiles/', 'covers/', 'posts/', 'stories/'],
    },
    {
      name: `${brandSlug}-brand-assets/06-business-collateral/`,
      description: 'Print materials',
      contents: ['business-cards/', 'letterhead/', 'envelope/', 'email-signature/'],
    },
    {
      name: `${brandSlug}-brand-assets/07-templates/`,
      description: 'Editable templates',
      contents: ['presentation/', 'document/', 'social/'],
    },
    {
      name: `${brandSlug}-brand-assets/`,
      description: 'Root files',
      contents: ['README.txt', 'brand-guidelines.pdf'],
    },
  ]
}

function generateLogoSpecs(
  businessName: string,
  visualIdentity?: Record<string, unknown>
) {
  const brandSlug = sanitizeName(businessName)
  const colors = (visualIdentity?.colors as Record<string, unknown>) || {}
  const primaryColor = (colors.primary as { hex?: string })?.hex || '#6366F1'

  return {
    primary: {
      name: `${brandSlug}-logo-primary`,
      description: 'Full color primary logo',
      colors: [primaryColor, '#FFFFFF', '#1F2937'],
      formats: [
        { format: 'svg', usage: 'Web, scalable applications' },
        { format: 'png', sizes: ['@1x (300px)', '@2x (600px)', '@3x (900px)'] },
        { format: 'eps', usage: 'Print production' },
      ],
      variants: ['full-color', 'reversed', 'monochrome-dark', 'monochrome-light'],
    },
    icon: {
      name: `${brandSlug}-icon`,
      description: 'Standalone symbol/icon',
      minSize: '24px',
      formats: ['svg', 'png'],
      usage: 'App icons, favicons, small applications',
    },
    wordmark: {
      name: `${brandSlug}-wordmark`,
      description: 'Typography-only logo',
      formats: ['svg', 'png'],
      usage: 'When space is limited or logo recognition is established',
    },
  }
}

function generateFaviconSpecs(businessName: string) {
  const brandSlug = sanitizeName(businessName)

  return {
    name: `${brandSlug}-favicon`,
    sizes: [
      { size: '16x16', format: 'png', usage: 'Browser tabs' },
      { size: '32x32', format: 'png', usage: 'Browser tabs (Retina)' },
      { size: '48x48', format: 'png', usage: 'Windows site icons' },
      { size: '180x180', format: 'png', name: 'apple-touch-icon', usage: 'iOS home screen' },
      { size: '192x192', format: 'png', name: 'android-chrome', usage: 'Android home screen' },
      { size: '512x512', format: 'png', name: 'android-chrome', usage: 'Android splash screen' },
    ],
    ico: {
      sizes: ['16x16', '32x32', '48x48'],
      usage: 'Legacy browser support',
    },
    svg: {
      usage: 'Modern browsers with scalable favicon support',
    },
    manifest: {
      name: 'site.webmanifest',
      usage: 'PWA configuration',
    },
  }
}

function generateSocialMediaSpecs(
  businessName: string,
  _visualIdentity?: Record<string, unknown>
) {
  const brandSlug = sanitizeName(businessName)

  return {
    profile: {
      name: `${brandSlug}-profile`,
      platforms: [
        { platform: 'Facebook', size: '180x180', format: 'png' },
        { platform: 'Instagram', size: '110x110', format: 'png' },
        { platform: 'LinkedIn', size: '400x400', format: 'png' },
        { platform: 'Twitter/X', size: '400x400', format: 'png' },
        { platform: 'YouTube', size: '800x800', format: 'png' },
      ],
    },
    cover: {
      name: `${brandSlug}-cover`,
      platforms: [
        { platform: 'Facebook', size: '820x312', format: 'png' },
        { platform: 'LinkedIn (Company)', size: '1128x191', format: 'png' },
        { platform: 'LinkedIn (Personal)', size: '1584x396', format: 'png' },
        { platform: 'Twitter/X', size: '1500x500', format: 'png' },
        { platform: 'YouTube', size: '2560x1440', format: 'png' },
      ],
    },
    openGraph: {
      name: `${brandSlug}-og-image`,
      size: '1200x630',
      format: 'png',
      usage: 'Default sharing image for website links',
    },
    postTemplates: {
      square: { size: '1080x1080', usage: 'Instagram, Facebook posts' },
      portrait: { size: '1080x1350', usage: 'Instagram portrait posts' },
      story: { size: '1080x1920', usage: 'Instagram/Facebook Stories' },
      landscape: { size: '1200x628', usage: 'Twitter/Facebook link previews' },
    },
  }
}

function generateCollateralSpecs(
  businessName: string,
  _visualIdentity?: Record<string, unknown>
) {
  const brandSlug = sanitizeName(businessName)

  return {
    businessCard: {
      name: `${brandSlug}-business-card`,
      size: '3.5 x 2 inches (US standard)',
      bleed: '0.125 inches',
      safeZone: '0.125 inches from trim',
      format: ['PDF (print-ready)', 'AI', 'PSD'],
      sides: ['front', 'back'],
      elements: [
        'Logo',
        'Name',
        'Title',
        'Phone',
        'Email',
        'Website',
        'Address (optional)',
        'Social handles (optional)',
      ],
    },
    letterhead: {
      name: `${brandSlug}-letterhead`,
      sizes: ['US Letter (8.5 x 11")', 'A4 (210 x 297mm)'],
      margins: '0.75 inches',
      format: ['PDF', 'DOCX'],
      elements: ['Logo (header)', 'Company info (footer)', 'Contact details'],
    },
    emailSignature: {
      name: `${brandSlug}-email-signature`,
      format: 'HTML',
      maxWidth: '600px',
      elements: [
        'Name',
        'Title',
        'Company',
        'Phone',
        'Email',
        'Website',
        'Logo (optional)',
        'Social icons',
      ],
      notes: 'Optimized for major email clients (Gmail, Outlook, Apple Mail)',
    },
    envelope: {
      name: `${brandSlug}-envelope`,
      sizes: ['#10 (4.125 x 9.5")', 'DL (110 x 220mm)'],
      format: ['PDF'],
      elements: ['Logo', 'Return address'],
    },
  }
}

function generateBrandGuidelines(
  businessName: string,
  positioning: Record<string, unknown> | null,
  voiceGuidelines: Record<string, unknown> | null,
  visualIdentity: Record<string, unknown> | null
) {
  const brandSlug = sanitizeName(businessName)

  return {
    name: `${brandSlug}-brand-guidelines`,
    format: 'PDF',
    sections: [
      {
        title: 'Introduction',
        content: ['Brand Story', 'Mission & Vision', 'Brand Values'],
      },
      {
        title: 'Brand Strategy',
        content: [
          `Brand Archetype: ${(positioning?.archetype as string) || 'Not defined'}`,
          'Core Values',
          'Positioning Statement',
          'Brand Promise',
        ],
      },
      {
        title: 'Logo Guidelines',
        content: [
          'Primary Logo',
          'Logo Variations',
          'Clear Space Requirements',
          'Minimum Size',
          'Incorrect Usage',
        ],
      },
      {
        title: 'Color Palette',
        content: [
          'Primary Colors',
          'Secondary Colors',
          'Accent Colors',
          'Neutral Colors',
          'Color Specifications (HEX, RGB, CMYK)',
        ],
      },
      {
        title: 'Typography',
        content: [
          'Primary Typeface',
          'Secondary Typeface',
          'Type Scale',
          'Typography Guidelines',
        ],
      },
      {
        title: 'Brand Voice',
        content: [
          `Tone: ${(voiceGuidelines?.toneOfVoice as Record<string, unknown>)?.description || 'Not defined'}`,
          'Vocabulary Guidelines',
          'Messaging Templates',
          'Content Pillars',
        ],
      },
      {
        title: 'Visual Elements',
        content: [
          'Photography Style',
          'Iconography',
          'Patterns & Textures',
          'Spacing & Layout',
        ],
      },
      {
        title: 'Applications',
        content: [
          'Digital Applications',
          'Print Applications',
          'Social Media',
          'Environmental',
        ],
      },
    ],
    hasVisualIdentity: !!visualIdentity,
    hasVoiceGuidelines: !!voiceGuidelines,
    hasPositioning: !!positioning,
  }
}
