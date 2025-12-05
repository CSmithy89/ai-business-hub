import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@hyvve/db'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

interface ColorValue {
  hex: string
  rgb: { r: number; g: number; b: number }
  cmyk: { c: number; m: number; y: number; k: number }
  name: string
  usage?: string
}

interface TypographySpec {
  family: string
  weights: string[]
  fallback: string
  usage?: string
}

interface LogoConcept {
  concept: string
  variations: string[]
  guidelines: {
    clearSpace: string
    minimumSize: string
    backgrounds: string[]
    prohibitions: string[]
  }
}

interface SpacingScale {
  unit: number
  scale: Record<string, number>
}

interface VisualIdentity {
  colors: {
    primary: ColorValue
    secondary: ColorValue[]
    accent: ColorValue[]
    neutrals: ColorValue[]
  }
  typography: {
    headings: TypographySpec
    body: TypographySpec
    accent: TypographySpec
    scale: {
      name: string
      size: string
      lineHeight: string
      usage: string
    }[]
  }
  logo: LogoConcept
  spacing: SpacingScale
  accessibility: {
    contrastRatios: {
      combination: string
      ratio: string
      wcagLevel: string
    }[]
  }
  metadata: {
    generatedAt: string
    version: string
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
      case 'analyze': {
        // Iris analyzes brand strategy to recommend visual identity
        const positioning = business.brandingData?.positioning as Record<string, unknown> | null
        const analysis = generateVisualAnalysis(business.name, positioning, data)

        return NextResponse.json({
          success: true,
          analysis,
          message: 'Visual identity analysis complete. Review the color and typography recommendations.',
        })
      }

      case 'generate_palette': {
        // Generate color palette based on archetype and preferences
        const positioning = business.brandingData?.positioning as Record<string, unknown> | null
        const palette = generateColorPalette(positioning, data.preferences)

        return NextResponse.json({
          success: true,
          palette,
          message: 'Color palette generated. Adjust colors as needed.',
        })
      }

      case 'generate_typography': {
        // Generate typography specifications
        const positioning = business.brandingData?.positioning as Record<string, unknown> | null
        const typography = generateTypography(positioning, data.preferences)

        return NextResponse.json({
          success: true,
          typography,
          message: 'Typography specifications created. Review font pairings.',
        })
      }

      case 'generate_logo_concept': {
        // Generate logo concept and guidelines
        const positioning = business.brandingData?.positioning as Record<string, unknown> | null
        const logo = generateLogoConcept(business.name, positioning)

        return NextResponse.json({
          success: true,
          logo,
          message: 'Logo concept and guidelines created.',
        })
      }

      case 'check_accessibility': {
        // Check color contrast ratios
        const { colors } = data
        const accessibility = checkAccessibility(colors)

        return NextResponse.json({
          success: true,
          accessibility,
          message: 'Accessibility check complete.',
        })
      }

      case 'finalize': {
        // Finalize visual identity
        const visualIdentity: VisualIdentity = {
          ...data.visualIdentity,
          metadata: {
            generatedAt: new Date().toISOString(),
            version: '1.0',
          },
        }

        await updateBrandingSession(businessId, business.brandingData?.id, {
          visualIdentity,
          completedWorkflows: ['visual_identity'],
        })

        return NextResponse.json({
          success: true,
          visualIdentity,
          message: 'Visual identity finalized! Ready to proceed with Asset Generation.',
          next_workflow: 'asset_generation',
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Visual identity error:', error)
    return NextResponse.json(
      { error: 'Failed to process visual identity request' },
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
    const visualIdentity = brandingSession?.visualIdentity as VisualIdentity | null

    return NextResponse.json({
      success: true,
      currentVisualIdentity: visualIdentity,
      isComplete: brandingSession?.completedWorkflows?.includes('visual_identity') ?? false,
    })
  } catch (error) {
    console.error('Get visual identity error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve visual identity' },
      { status: 500 }
    )
  }
}

// Helper functions

async function updateBrandingSession(
  businessId: string,
  sessionId: string | undefined,
  data: {
    visualIdentity?: VisualIdentity
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
        visualIdentity: data.visualIdentity ? (data.visualIdentity as object) : undefined,
        completedWorkflows: mergedWorkflows,
        updatedAt: new Date(),
      },
    })
  } else {
    await prisma.brandingSession.create({
      data: {
        businessId,
        visualIdentity: data.visualIdentity ? (data.visualIdentity as object) : undefined,
        completedWorkflows: data.completedWorkflows || [],
      },
    })
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function rgbToCmyk(
  r: number,
  g: number,
  b: number
): { c: number; m: number; y: number; k: number } {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255

  const k = 1 - Math.max(rNorm, gNorm, bNorm)
  if (k === 1) return { c: 0, m: 0, y: 0, k: 100 }

  const c = Math.round(((1 - rNorm - k) / (1 - k)) * 100)
  const m = Math.round(((1 - gNorm - k) / (1 - k)) * 100)
  const y = Math.round(((1 - bNorm - k) / (1 - k)) * 100)

  return { c, m, y, k: Math.round(k * 100) }
}

function createColorValue(hex: string, name: string, usage?: string): ColorValue {
  const rgb = hexToRgb(hex)
  const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b)
  return { hex, rgb, cmyk, name, usage }
}

function generateVisualAnalysis(
  businessName: string,
  positioning: Record<string, unknown> | null,
  _preferences: Record<string, unknown>
) {
  const archetype = (positioning?.archetype as string) || 'The Creator'

  // Color psychology recommendations based on archetype
  const archetypeColorPsychology: Record<string, { primary: string; mood: string; colors: string[] }> = {
    'The Creator': {
      primary: 'Indigo',
      mood: 'Innovative, imaginative, inspired',
      colors: ['Deep Purple', 'Electric Blue', 'Creative Orange'],
    },
    'The Sage': {
      primary: 'Navy Blue',
      mood: 'Trustworthy, wise, knowledgeable',
      colors: ['Deep Blue', 'Forest Green', 'Gold'],
    },
    'The Hero': {
      primary: 'Bold Red',
      mood: 'Courageous, bold, determined',
      colors: ['Crimson', 'Steel Gray', 'Gold'],
    },
    'The Explorer': {
      primary: 'Earth Green',
      mood: 'Adventurous, free, authentic',
      colors: ['Forest Green', 'Sand', 'Sky Blue'],
    },
    'The Magician': {
      primary: 'Royal Purple',
      mood: 'Transformative, visionary, mystical',
      colors: ['Deep Purple', 'Midnight Blue', 'Gold'],
    },
  }

  const colorRecommendation = archetypeColorPsychology[archetype] || archetypeColorPsychology['The Creator']

  return {
    businessName,
    archetype,
    colorPsychology: colorRecommendation,
    typographyRecommendation: {
      style: 'Modern Sans-Serif',
      rationale: 'Clean, professional fonts that convey innovation and clarity',
      suggestions: ['Inter', 'Outfit', 'Plus Jakarta Sans'],
    },
    spacingRecommendation: {
      style: 'Generous whitespace',
      baseUnit: 8,
      rationale: 'Ample spacing creates a premium, sophisticated feel',
    },
  }
}

function generateColorPalette(
  positioning: Record<string, unknown> | null,
  _preferences: Record<string, unknown> | undefined
): VisualIdentity['colors'] {
  const archetype = (positioning?.archetype as string) || 'The Creator'

  // Define color palettes for different archetypes
  const palettes: Record<string, { primary: string; secondary: string[]; accent: string[] }> = {
    'The Creator': {
      primary: '#6366F1',
      secondary: ['#818CF8', '#4F46E5'],
      accent: ['#F59E0B', '#10B981'],
    },
    'The Sage': {
      primary: '#1E40AF',
      secondary: ['#3B82F6', '#1E3A8A'],
      accent: ['#D97706', '#059669'],
    },
    'The Hero': {
      primary: '#DC2626',
      secondary: ['#EF4444', '#B91C1C'],
      accent: ['#F59E0B', '#6B7280'],
    },
    'The Explorer': {
      primary: '#059669',
      secondary: ['#10B981', '#047857'],
      accent: ['#0EA5E9', '#D97706'],
    },
    'The Magician': {
      primary: '#7C3AED',
      secondary: ['#8B5CF6', '#6D28D9'],
      accent: ['#F59E0B', '#EC4899'],
    },
  }

  const palette = palettes[archetype] || palettes['The Creator']

  return {
    primary: createColorValue(palette.primary, 'Primary', 'Main brand color, CTAs, key elements'),
    secondary: palette.secondary.map((hex, i) =>
      createColorValue(hex, `Secondary ${i + 1}`, 'Supporting elements, backgrounds')
    ),
    accent: palette.accent.map((hex, i) =>
      createColorValue(hex, `Accent ${i + 1}`, 'Highlights, notifications, emphasis')
    ),
    neutrals: [
      createColorValue('#FFFFFF', 'White', 'Backgrounds, cards'),
      createColorValue('#F9FAFB', 'Gray 50', 'Light backgrounds'),
      createColorValue('#F3F4F6', 'Gray 100', 'Borders, dividers'),
      createColorValue('#9CA3AF', 'Gray 400', 'Placeholder text'),
      createColorValue('#4B5563', 'Gray 600', 'Secondary text'),
      createColorValue('#1F2937', 'Gray 800', 'Primary text'),
      createColorValue('#111827', 'Gray 900', 'Headings'),
    ],
  }
}

function generateTypography(
  positioning: Record<string, unknown> | null,
  _preferences: Record<string, unknown> | undefined
): VisualIdentity['typography'] {
  const archetype = (positioning?.archetype as string) || 'The Creator'

  // Typography recommendations based on archetype
  const typeRecommendations: Record<string, { headings: string; body: string; accent: string }> = {
    'The Creator': { headings: 'Plus Jakarta Sans', body: 'Inter', accent: 'JetBrains Mono' },
    'The Sage': { headings: 'Merriweather', body: 'Source Sans Pro', accent: 'Fira Code' },
    'The Hero': { headings: 'Montserrat', body: 'Open Sans', accent: 'Roboto Mono' },
    'The Explorer': { headings: 'Outfit', body: 'Nunito', accent: 'Space Mono' },
    'The Magician': { headings: 'Poppins', body: 'DM Sans', accent: 'IBM Plex Mono' },
  }

  const fonts = typeRecommendations[archetype] || typeRecommendations['The Creator']

  return {
    headings: {
      family: fonts.headings,
      weights: ['600', '700', '800'],
      fallback: 'system-ui, sans-serif',
      usage: 'Page titles, section headers, prominent labels',
    },
    body: {
      family: fonts.body,
      weights: ['400', '500', '600'],
      fallback: 'system-ui, sans-serif',
      usage: 'Body text, descriptions, form labels',
    },
    accent: {
      family: fonts.accent,
      weights: ['400', '500'],
      fallback: 'monospace',
      usage: 'Code snippets, data values, technical content',
    },
    scale: [
      { name: 'Display', size: '48px', lineHeight: '1.1', usage: 'Hero headlines' },
      { name: 'H1', size: '36px', lineHeight: '1.2', usage: 'Page titles' },
      { name: 'H2', size: '30px', lineHeight: '1.25', usage: 'Section headers' },
      { name: 'H3', size: '24px', lineHeight: '1.3', usage: 'Subsection headers' },
      { name: 'H4', size: '20px', lineHeight: '1.35', usage: 'Card titles' },
      { name: 'Body Large', size: '18px', lineHeight: '1.5', usage: 'Lead paragraphs' },
      { name: 'Body', size: '16px', lineHeight: '1.5', usage: 'Default body text' },
      { name: 'Body Small', size: '14px', lineHeight: '1.5', usage: 'Captions, metadata' },
      { name: 'Caption', size: '12px', lineHeight: '1.4', usage: 'Labels, footnotes' },
    ],
  }
}

function generateLogoConcept(
  businessName: string,
  positioning: Record<string, unknown> | null
): LogoConcept {
  const archetype = (positioning?.archetype as string) || 'The Creator'
  const coreValues = (positioning?.coreValues as string[]) || ['Innovation', 'Excellence']

  const archetypeLogoStyles: Record<string, string> = {
    'The Creator': 'An abstract mark that suggests creation and innovation, with flowing geometric shapes',
    'The Sage': 'A sophisticated wordmark with a distinctive typographic treatment, conveying wisdom',
    'The Hero': 'A bold shield or emblem symbol representing strength and achievement',
    'The Explorer': 'A dynamic mark suggesting movement and discovery, with organic elements',
    'The Magician': 'An enigmatic symbol combining geometric precision with a sense of transformation',
  }

  const conceptStyle = archetypeLogoStyles[archetype] || archetypeLogoStyles['The Creator']

  return {
    concept: `${conceptStyle}. The design for ${businessName} should embody ${coreValues.join(' and ')}, creating a memorable and distinctive brand mark that works across all applications.`,
    variations: [
      'Primary Logo (Full color)',
      'Icon/Logomark (Symbol only)',
      'Wordmark (Typography only)',
      'Reversed (White on dark)',
      'Monochrome (Single color)',
    ],
    guidelines: {
      clearSpace: 'Minimum clear space equal to the height of the logomark on all sides',
      minimumSize: 'Print: 24mm width, Digital: 80px width',
      backgrounds: [
        'White or light neutral backgrounds',
        'Brand primary color backgrounds (use reversed version)',
        'Photography with sufficient contrast',
      ],
      prohibitions: [
        'Do not stretch or distort the logo',
        'Do not rotate the logo',
        'Do not change the logo colors outside brand palette',
        'Do not add effects like shadows or gradients',
        'Do not place on busy backgrounds without contrast',
      ],
    },
  }
}

function calculateContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1)
  const rgb2 = hexToRgb(hex2)

  const luminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const normalized = c / 255
      return normalized <= 0.03928
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const l1 = luminance(rgb1.r, rgb1.g, rgb1.b)
  const l2 = luminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)

  return (lighter + 0.05) / (darker + 0.05)
}

function getWcagLevel(ratio: number): string {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'AA Large'
  return 'Fail'
}

function checkAccessibility(colors: VisualIdentity['colors']): VisualIdentity['accessibility'] {
  const combinations: { combination: string; ratio: string; wcagLevel: string }[] = []

  // Check primary against white and dark backgrounds
  const primaryHex = colors.primary.hex
  const white = '#FFFFFF'
  const dark = '#111827'

  const primaryOnWhite = calculateContrastRatio(primaryHex, white)
  combinations.push({
    combination: `Primary (${primaryHex}) on White`,
    ratio: primaryOnWhite.toFixed(2),
    wcagLevel: getWcagLevel(primaryOnWhite),
  })

  const whiteOnPrimary = calculateContrastRatio(white, primaryHex)
  combinations.push({
    combination: `White on Primary (${primaryHex})`,
    ratio: whiteOnPrimary.toFixed(2),
    wcagLevel: getWcagLevel(whiteOnPrimary),
  })

  // Check dark text on white
  const darkOnWhite = calculateContrastRatio(dark, white)
  combinations.push({
    combination: `Dark Text (${dark}) on White`,
    ratio: darkOnWhite.toFixed(2),
    wcagLevel: getWcagLevel(darkOnWhite),
  })

  // Check secondary colors
  colors.secondary.forEach((color, i) => {
    const ratio = calculateContrastRatio(color.hex, white)
    combinations.push({
      combination: `Secondary ${i + 1} (${color.hex}) on White`,
      ratio: ratio.toFixed(2),
      wcagLevel: getWcagLevel(ratio),
    })
  })

  // Check accent colors
  colors.accent.forEach((color, i) => {
    const ratio = calculateContrastRatio(color.hex, white)
    combinations.push({
      combination: `Accent ${i + 1} (${color.hex}) on White`,
      ratio: ratio.toFixed(2),
      wcagLevel: getWcagLevel(ratio),
    })
  })

  return { contrastRatios: combinations }
}
