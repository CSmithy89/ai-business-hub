import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Get help with using the HYVVE platform',
};

/**
 * Help Center Page (Dashboard Version)
 *
 * Shows help resources within the authenticated dashboard layout.
 * Users who are logged in will see this version with the proper header.
 */
export default function HelpPage() {
  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[rgb(var(--color-text-primary))]">
          Help Center
        </h1>
        <p className="mt-4 text-lg text-[rgb(var(--color-text-secondary))]">
          Find answers to common questions and learn how to get the most out of
          HYVVE.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-6">
        <HelpCard
          title="Getting Started"
          description="New to HYVVE? Learn the basics and set up your first workspace."
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
          href="#getting-started"
        />
        <HelpCard
          title="AI Configuration"
          description="Learn how to configure AI providers and optimize agent performance."
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          }
          href="#ai-configuration"
        />
        <HelpCard
          title="Approvals & Workflows"
          description="Understand how the approval system and confidence scoring works."
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          href="#approvals"
        />
      </div>

      {/* FAQ Section */}
      <section id="faq">
        <h2 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <FAQItem
            question="What is HYVVE?"
            answer="HYVVE is an AI-powered business orchestration platform designed to achieve 90% automation with approximately 5 hours per week of human involvement. It uses intelligent AI agents to handle routine operations while humans focus on strategic decisions."
          />
          <FAQItem
            question="What is BYOAI (Bring Your Own AI)?"
            answer="BYOAI means you use your own API keys from AI providers like OpenAI, Anthropic (Claude), Google (Gemini), DeepSeek, or OpenRouter. This gives you full control over costs and ensures your data stays within your chosen provider's terms."
          />
          <FAQItem
            question="How does the confidence-based approval system work?"
            answer="AI agents calculate a confidence score for each action. Actions with >85% confidence execute automatically, 60-85% require quick approval, and <60% require full review. This ensures human oversight where it matters most."
          />
          <FAQItem
            question="How is my data protected?"
            answer="HYVVE uses AES-256-GCM encryption for sensitive data like API keys, Argon2id password hashing, HTTP-only secure cookies, and role-based access controls. All data is isolated per workspace (multi-tenancy)."
          />
          <FAQItem
            question="Can I use multiple AI providers?"
            answer="Yes! You can configure multiple AI providers and choose which one to use for different tasks. HYVVE supports Claude, OpenAI, Gemini, DeepSeek, and OpenRouter (which provides access to 100+ models)."
          />
        </div>
      </section>

      {/* Getting Started Section */}
      <section id="getting-started">
        <h2 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-6">
          Getting Started
        </h2>
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <ol className="space-y-2 text-[rgb(var(--color-text-secondary))]">
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">Create an account</strong> - Sign up with your email or
              use Google authentication.
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">Complete onboarding</strong> - Tell us about your business
              and goals.
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">Configure AI providers</strong> - Add your API keys in
              Settings → AI Configuration.
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">Set up your workspace</strong> - Invite team members and
              configure roles.
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">Start automating</strong> - Enable AI agents and let them
              handle routine tasks.
            </li>
          </ol>
        </div>
      </section>

      {/* AI Configuration Section */}
      <section id="ai-configuration">
        <h2 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-6">
          AI Configuration
        </h2>
        <div className="prose prose-gray dark:prose-invert max-w-none text-[rgb(var(--color-text-secondary))]">
          <p>
            HYVVE supports multiple AI providers. Here&apos;s how to configure
            them:
          </p>
          <h3 className="text-[rgb(var(--color-text-primary))]">Supported Providers</h3>
          <ul className="space-y-1">
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">Claude (Anthropic)</strong> - Best for strategic analysis
              and content creation
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">OpenAI (GPT-4)</strong> - Versatile for various tasks
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">Gemini (Google)</strong> - Great for research and analysis
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">DeepSeek</strong> - Cost-effective option
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">OpenRouter</strong> - Access to 100+ models
            </li>
          </ul>
          <p>
            Navigate to{' '}
            <Link
              href="/settings/ai-config"
              className="text-[rgb(var(--color-primary-500))] hover:underline"
            >
              Settings → AI Configuration
            </Link>{' '}
            to add your API keys.
          </p>
        </div>
      </section>

      {/* Approvals Section */}
      <section id="approvals">
        <h2 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-6">
          Approvals & Workflows
        </h2>
        <div className="prose prose-gray dark:prose-invert max-w-none text-[rgb(var(--color-text-secondary))]">
          <p>
            The approval system ensures humans stay in control of important
            decisions:
          </p>
          <h3 className="text-[rgb(var(--color-text-primary))]">Confidence Levels</h3>
          <ul className="space-y-1">
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">High Confidence (&gt;85%)</strong> - Auto-executed without
              human intervention
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">Medium Confidence (60-85%)</strong> - Quick approval
              needed (one-click)
            </li>
            <li>
              <strong className="text-[rgb(var(--color-text-primary))]">Low Confidence (&lt;60%)</strong> - Full review required
              before execution
            </li>
          </ul>
          <p>
            View pending approvals in the{' '}
            <Link
              href="/approvals"
              className="text-[rgb(var(--color-primary-500))] hover:underline"
            >
              Approvals Dashboard
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Contact Support */}
      <section className="bg-[rgb(var(--color-bg-secondary))] rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-[rgb(var(--color-text-primary))] mb-4">
          Need More Help?
        </h2>
        <p className="text-[rgb(var(--color-text-secondary))] mb-6">
          Can&apos;t find what you&apos;re looking for? Our support team is here to
          help.
        </p>
        <a
          href="mailto:support@hyvve.io"
          className="inline-flex items-center px-6 py-3 bg-[rgb(var(--color-primary-500))] text-white rounded-lg hover:bg-[rgb(var(--color-primary-600))] transition-colors"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          Contact Support
        </a>
      </section>
    </div>
  );
}

function HelpCard({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className="block p-6 bg-[rgb(var(--color-bg-surface))] border border-[rgb(var(--color-border-default))] rounded-lg hover:border-[rgb(var(--color-primary-500))] hover:shadow-md transition-all"
    >
      <div className="w-12 h-12 bg-[rgb(var(--color-primary-500))]/10 text-[rgb(var(--color-primary-500))] rounded-lg flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[rgb(var(--color-text-primary))] mb-2">
        {title}
      </h3>
      <p className="text-[rgb(var(--color-text-secondary))] text-sm">{description}</p>
    </a>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border border-[rgb(var(--color-border-default))] rounded-lg bg-[rgb(var(--color-bg-surface))]">
      <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
        <span className="font-medium text-[rgb(var(--color-text-primary))]">
          {question}
        </span>
        <svg
          className="w-5 h-5 text-[rgb(var(--color-text-tertiary))] group-open:rotate-180 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>
      <div className="px-4 pb-4 text-[rgb(var(--color-text-secondary))]">
        {answer}
      </div>
    </details>
  );
}
