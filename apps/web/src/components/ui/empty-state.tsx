/**
 * Empty State Component
 *
 * Displays friendly empty states with character illustrations
 * for a warm and encouraging user experience.
 *
 * Epic: 16 - Premium Polish
 * Story: 16-18 - Character-Driven Empty States
 */

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  CheckCircle2,
  FolderOpen,
  Bot,
  MessageSquare,
  Bell,
  Sparkles,
  Rocket,
  type LucideIcon,
} from 'lucide-react';

export type EmptyStateVariant =
  | 'approvals'
  | 'businesses'
  | 'agents'
  | 'chat'
  | 'notifications'
  | 'default';

interface EmptyStateContent {
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  headline: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  celebration?: boolean;
}

const VARIANT_CONTENT: Record<EmptyStateVariant, EmptyStateContent> = {
  approvals: {
    icon: CheckCircle2,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    headline: 'All clear!',
    description:
      'Your approval queue is empty. All agent actions have been reviewed. Nice work!',
    ctaText: 'Back to Dashboard',
    ctaHref: '/dashboard',
    celebration: true,
  },
  businesses: {
    icon: Rocket,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10',
    headline: 'Ready to start your journey?',
    description:
      "Let's validate your first business idea together. Our AI team is here to help you succeed.",
    ctaText: 'Add Your First Business',
    ctaHref: '/businesses/new',
  },
  agents: {
    icon: Bot,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-100',
    headline: 'Meet your AI team',
    description:
      'Your AI agents are ready to help! Configure them to start automating your business tasks.',
    ctaText: 'Configure Agents',
    ctaHref: '/agents/configure',
  },
  chat: {
    icon: MessageSquare,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    headline: 'Start a conversation',
    description:
      'Chat with your AI team to get insights, ask questions, or request actions.',
    ctaText: 'Start Chatting',
  },
  notifications: {
    icon: Bell,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    headline: "You're all caught up!",
    description:
      "No new notifications right now. We'll let you know when something needs your attention.",
    celebration: true,
  },
  default: {
    icon: FolderOpen,
    iconColor: 'text-gray-500',
    iconBg: 'bg-gray-100',
    headline: 'Nothing here yet',
    description:
      'This area is empty. Add some content to get started.',
  },
};

interface EmptyStateProps {
  /** Pre-defined variant with content */
  variant?: EmptyStateVariant;
  /** Custom icon (overrides variant icon) */
  icon?: LucideIcon;
  /** Custom headline (overrides variant) */
  headline?: string;
  /** Custom description (overrides variant) */
  description?: string;
  /** CTA button text (overrides variant) */
  ctaText?: string;
  /** CTA button href (overrides variant) */
  ctaHref?: string;
  /** CTA button click handler */
  onCtaClick?: () => void;
  /** Show celebration animation */
  celebration?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Empty State Component
 *
 * Displays a friendly empty state with character illustration,
 * headline, description, and optional CTA button.
 */
export function EmptyState({
  variant = 'default',
  icon: customIcon,
  headline: customHeadline,
  description: customDescription,
  ctaText: customCtaText,
  ctaHref: customCtaHref,
  onCtaClick,
  celebration: customCelebration,
  className,
}: EmptyStateProps) {
  const content = VARIANT_CONTENT[variant];
  const Icon = customIcon || content.icon;
  const headline = customHeadline || content.headline;
  const description = customDescription || content.description;
  const ctaText = customCtaText || content.ctaText;
  const ctaHref = customCtaHref || content.ctaHref;
  const showCelebration = customCelebration ?? content.celebration;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-6 text-center',
        className
      )}
    >
      {/* Character/Icon */}
      <div
        className={cn(
          'relative mb-6 flex h-20 w-20 items-center justify-center rounded-full',
          content.iconBg
        )}
      >
        <Icon className={cn('h-10 w-10', content.iconColor)} />
        {showCelebration && (
          <Sparkles
            className="absolute -right-1 -top-1 h-6 w-6 text-amber-400 animate-pulse"
            aria-hidden="true"
          />
        )}
      </div>

      {/* Headline */}
      <h3 className="mb-2 text-xl font-semibold text-[rgb(var(--color-text-primary))]">
        {headline}
      </h3>

      {/* Description */}
      <p className="mb-6 max-w-md text-[rgb(var(--color-text-secondary))]">
        {description}
      </p>

      {/* CTA Button */}
      {(ctaText || onCtaClick) && (
        <>
          {ctaHref ? (
            <Button asChild>
              <Link href={ctaHref as Parameters<typeof Link>[0]['href']}>{ctaText}</Link>
            </Button>
          ) : (
            <Button onClick={onCtaClick}>{ctaText || 'Get Started'}</Button>
          )}
        </>
      )}
    </div>
  );
}
