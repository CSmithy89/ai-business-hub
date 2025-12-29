'use client';

import Link from 'next/link';

/**
 * Business Planning Content (Client Component)
 *
 * Coming soon page for the Business Planning module.
 */
export function PlanningContent() {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-4">
        Business Planning Coming Soon
      </h1>

      {/* Description */}
      <p className="text-muted-foreground max-w-md mb-8">
        The AI-powered Business Planning module is currently in development.
        It will help you create business plans, set goals, and track your strategic initiatives.
      </p>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-4 max-w-2xl mb-8">
        <FeaturePreview
          title="Strategic Planning"
          description="Create comprehensive business strategies with AI assistance"
        />
        <FeaturePreview
          title="Goal Tracking"
          description="Set, monitor, and achieve your business objectives"
        />
        <FeaturePreview
          title="Market Analysis"
          description="AI-driven insights into market trends and opportunities"
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
