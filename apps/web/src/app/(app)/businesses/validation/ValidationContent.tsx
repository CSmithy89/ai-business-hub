'use client';

import Link from 'next/link';

/**
 * Business Validation Content (Client Component)
 *
 * Coming soon page for the Business Validation module.
 */
export function ValidationContent() {
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-4">
        Business Validation Coming Soon
      </h1>

      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-8">
        The AI-powered Business Validation module is currently in development.
        It will help you validate your business ideas, test assumptions, and reduce risk.
      </p>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-4 max-w-2xl mb-8">
        <FeaturePreview
          title="Idea Scoring"
          description="Get AI-powered assessment of your business concept"
        />
        <FeaturePreview
          title="Market Validation"
          description="Test market demand and customer interest"
        />
        <FeaturePreview
          title="Risk Analysis"
          description="Identify and mitigate potential business risks"
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
