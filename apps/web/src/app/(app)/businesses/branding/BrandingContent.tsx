'use client';

import Link from 'next/link';

/**
 * Business Branding Content (Client Component)
 *
 * Coming soon page for the Business Branding module.
 */
export function BrandingContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      {/* Icon */}
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
          focusable="false"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-4">
        Business Branding Coming Soon
      </h1>

      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-8">
        The AI-powered Business Branding module is currently in development.
        It will help you develop your brand identity, messaging, and visual assets.
      </p>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-4 max-w-2xl mb-8">
        <FeaturePreview
          title="Brand Identity"
          description="Develop logos, colors, and visual guidelines with AI"
        />
        <FeaturePreview
          title="Voice & Messaging"
          description="Create consistent brand voice and key messages"
        />
        <FeaturePreview
          title="Asset Generation"
          description="Generate marketing materials and brand assets"
        />
      </div>

      {/* CTA */}
      <Link
        href="/businesses"
        className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Return to Businesses
      </Link>
    </div>
  );
}

function FeaturePreview({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
