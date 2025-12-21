'use client';

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PresenceUser } from '@hyvve/shared';
import { cn } from '@/lib/utils';

/**
 * PresenceAvatar - Avatar with online indicator and tooltip
 *
 * Shows user avatar with green online indicator and tooltip
 * displaying user name and current location.
 *
 * @see Story PM-06.2: Presence Indicators
 */

export interface PresenceAvatarProps {
  user: PresenceUser;
  className?: string;
  showTooltip?: boolean;
}

const PAGE_LABELS: Record<string, string> = {
  overview: 'Overview',
  tasks: 'Tasks',
  settings: 'Settings',
  docs: 'Docs',
};

export function PresenceAvatar({
  user,
  className,
  showTooltip = true,
}: PresenceAvatarProps) {
  const initials = user.userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const pageLabel = PAGE_LABELS[user.location.page] || user.location.page;

  const avatar = (
    <div
      className={cn('relative', className)}
      role="img"
      aria-label={`${user.userName} is online, viewing ${pageLabel}`}
    >
      <Avatar className="h-8 w-8 border-2 border-background">
        <AvatarImage src={user.userAvatar || undefined} alt={user.userName} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      {/* Online indicator */}
      <div
        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500"
        aria-hidden="true"
      />
    </div>
  );

  if (!showTooltip) {
    return avatar;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{avatar}</TooltipTrigger>
        <TooltipContent side="bottom" className="text-sm">
          <div className="space-y-1">
            <p className="font-medium">{user.userName}</p>
            <p className="text-xs text-muted-foreground">
              Viewing: {pageLabel}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
