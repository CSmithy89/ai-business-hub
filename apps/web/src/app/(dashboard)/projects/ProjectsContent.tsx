'use client';

import Link from 'next/link';

/**
 * Projects Module Content (Client Component)
 *
 * Coming soon page for the Projects module.
 * This module will be implemented in a future epic.
 */
export function ProjectsContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-primary"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
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
      <h1 className="text-3xl font-bold text-gray-900 mb-4">
        Projects Module Coming Soon
      </h1>

      {/* Description */}
      <p className="text-gray-600 max-w-md mb-8">
        The AI-powered Project Management module is currently in development. It
        will help you plan, track, and manage projects with intelligent
        automation and insights.
      </p>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-4 max-w-2xl mb-8">
        <FeaturePreview
          title="Task Management"
          description="Organize tasks with AI-suggested priorities"
        />
        <FeaturePreview
          title="Timeline Planning"
          description="Smart scheduling and deadline management"
        />
        <FeaturePreview
          title="Team Collaboration"
          description="Coordinate work with AI-assisted communication"
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
