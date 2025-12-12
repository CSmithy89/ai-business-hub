'use client';

import Link from 'next/link';

/**
 * CRM Module Placeholder
 *
 * Coming soon page for the CRM module.
 * This module will be implemented in a future epic.
 */
export default function CRMPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        CRM Module Coming Soon
      </h1>

      {/* Description */}
      <p className="text-gray-600 max-w-md mb-8">
        The AI-powered Customer Relationship Management module is currently in
        development. It will help you manage contacts, track interactions, and
        automate customer communications.
      </p>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-4 max-w-2xl mb-8">
        <FeaturePreview
          title="Contact Management"
          description="Organize and track all your customer relationships"
        />
        <FeaturePreview
          title="AI Insights"
          description="Get intelligent recommendations for engagement"
        />
        <FeaturePreview
          title="Automation"
          description="Automate follow-ups and routine communications"
        />
      </div>

      {/* CTA */}
      <Link
        href="/dashboard"
        className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
      >
        Return to Dashboard
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
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
