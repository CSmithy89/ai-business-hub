'use client';

import { PresenceAvatar } from './PresenceAvatar';
import { useProjectPresence } from '@/hooks/use-project-presence';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

/**
 * PresenceBar - Display active users in project
 *
 * Shows avatar stack of active users (max 5 visible + overflow).
 * Tooltip displays full list of users with their locations.
 *
 * @see Story PM-06.2: Presence Indicators
 */

export interface PresenceBarProps {
  projectId: string;
  className?: string;
  maxVisible?: number;
}

const PAGE_LABELS: Record<string, string> = {
  overview: 'Overview',
  tasks: 'Tasks',
  settings: 'Settings',
  docs: 'Docs',
};

export function PresenceBar({
  projectId,
  className,
  maxVisible = 5,
}: PresenceBarProps) {
  const { data, isLoading } = useProjectPresence({ projectId });

  // Don't render if loading or no users
  if (isLoading || !data || data.users.length === 0) {
    return null;
  }

  const users = data.users;
  const visibleUsers = users.slice(0, maxVisible);
  const overflowCount = users.length - maxVisible;
  const hasOverflow = overflowCount > 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center',
              className
            )}
            role="group"
            aria-label={`${users.length} user${users.length === 1 ? '' : 's'} currently online`}
          >
            {/* Avatar stack */}
            <div className="flex -space-x-2">
              {visibleUsers.map((user) => (
                <PresenceAvatar
                  key={user.userId}
                  user={user}
                  showTooltip={false}
                  className="ring-2 ring-background transition-transform hover:scale-110 hover:z-10"
                />
              ))}
              {hasOverflow && (
                <Avatar className="h-8 w-8 border-2 border-background bg-muted ring-2 ring-background">
                  <AvatarFallback className="text-xs font-medium">
                    +{overflowCount}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs p-3">
          <div className="space-y-3">
            <p className="font-semibold text-sm">
              Active users ({users.length})
            </p>
            <div className="space-y-2">
              {users.map((user) => {
                const pageLabel = PAGE_LABELS[user.location.page] || user.location.page;
                const initials = user.userName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={user.userId}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {pageLabel}
                      </p>
                    </div>
                    {/* Online indicator */}
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                  </div>
                );
              })}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
