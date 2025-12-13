'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRealtime, useRealtimeAvailable } from '@/lib/realtime';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * ConnectionStatus - Real-time connection indicator
 *
 * Displays the current WebSocket connection status with visual feedback:
 * - Connected: Green indicator
 * - Reconnecting: Amber indicator with spinner
 * - Disconnected/Error: Red indicator with retry button
 *
 * @see Story 16-15: Implement WebSocket Real-Time Updates
 */
export function ConnectionStatus({ className }: { className?: string }) {
  const isAvailable = useRealtimeAvailable();
  const { connectionState, isConnected, isReconnecting, reconnect } = useRealtime();
  const [showToast, setShowToast] = useState(false);

  // Show toast on connection status changes
  useEffect(() => {
    if (!isAvailable) return;

    if (connectionState.status === 'connected' && showToast) {
      toast.success('Real-time connection restored');
      setShowToast(false);
    } else if (connectionState.status === 'reconnecting' && !showToast) {
      setShowToast(true);
      toast.loading('Reconnecting to real-time updates...', {
        id: 'realtime-reconnecting',
        duration: Infinity,
      });
    } else if (connectionState.status === 'error') {
      toast.dismiss('realtime-reconnecting');
      toast.error('Connection lost', {
        description: connectionState.error || 'Unable to connect to real-time updates',
        action: {
          label: 'Retry',
          onClick: reconnect,
        },
      });
    } else if (connectionState.status === 'connected') {
      toast.dismiss('realtime-reconnecting');
    }
  }, [connectionState.status, connectionState.error, isAvailable, reconnect, showToast]);

  // Don't render if realtime provider is not available
  if (!isAvailable) {
    return null;
  }

  const getStatusIcon = () => {
    if (isConnected) {
      return <Wifi className="h-4 w-4 text-green-500" />;
    }
    if (isReconnecting) {
      return <RefreshCw className="h-4 w-4 text-amber-500 animate-spin" />;
    }
    if (connectionState.status === 'error') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <WifiOff className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isConnected) {
      return 'Real-time updates active';
    }
    if (isReconnecting) {
      return `Reconnecting... (${connectionState.reconnectAttempt}/${connectionState.maxReconnectAttempts})`;
    }
    if (connectionState.status === 'error') {
      return connectionState.error || 'Connection failed';
    }
    return 'Real-time updates unavailable';
  };

  const getStatusColor = () => {
    if (isConnected) return 'bg-green-500';
    if (isReconnecting) return 'bg-amber-500';
    if (connectionState.status === 'error') return 'bg-red-500';
    return 'bg-muted-foreground';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative h-8 w-8', className)}
          onClick={connectionState.status === 'error' ? reconnect : undefined}
          disabled={isReconnecting}
        >
          {getStatusIcon()}
          {/* Status dot indicator */}
          <span
            className={cn(
              'absolute bottom-1 right-1 h-2 w-2 rounded-full',
              getStatusColor(),
              isReconnecting && 'animate-pulse'
            )}
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{getStatusText()}</span>
          {connectionState.lastConnectedAt && (
            <span className="text-xs text-muted-foreground">
              Last connected: {connectionState.lastConnectedAt.toLocaleTimeString()}
            </span>
          )}
          {connectionState.status === 'error' && (
            <span className="text-xs text-muted-foreground">Click to retry</span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * ConnectionBanner - Full-width connection status banner
 *
 * Shows a banner at the top of the page when connection is lost
 */
export function ConnectionBanner({ className }: { className?: string }) {
  const isAvailable = useRealtimeAvailable();
  const { connectionState, isReconnecting, reconnect } = useRealtime();

  // Only show when not connected
  if (!isAvailable || connectionState.status === 'connected' || connectionState.status === 'connecting') {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 px-4 py-2 text-sm',
        isReconnecting && 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
        connectionState.status === 'error' && 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200',
        connectionState.status === 'disconnected' && 'bg-muted text-muted-foreground',
        className
      )}
    >
      {isReconnecting && (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>
            Reconnecting to real-time updates... ({connectionState.reconnectAttempt}/
            {connectionState.maxReconnectAttempts})
          </span>
        </>
      )}
      {connectionState.status === 'error' && (
        <>
          <AlertCircle className="h-4 w-4" />
          <span>{connectionState.error || 'Unable to connect to real-time updates'}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={reconnect}
            className="ml-2 h-7 border-red-300 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900"
          >
            Retry
          </Button>
        </>
      )}
      {connectionState.status === 'disconnected' && (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Real-time updates unavailable</span>
          <Button variant="outline" size="sm" onClick={reconnect} className="ml-2 h-7">
            Connect
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * Minimal status indicator for headers/toolbars
 */
export function ConnectionDot({ className }: { className?: string }) {
  const isAvailable = useRealtimeAvailable();
  const { isConnected, isReconnecting, connectionState } = useRealtime();

  if (!isAvailable) return null;

  const getColor = () => {
    if (isConnected) return 'bg-green-500';
    if (isReconnecting) return 'bg-amber-500 animate-pulse';
    if (connectionState.status === 'error') return 'bg-red-500';
    return 'bg-muted-foreground';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-block h-2 w-2 rounded-full', getColor(), className)} />
      </TooltipTrigger>
      <TooltipContent>
        {isConnected && 'Real-time: Connected'}
        {isReconnecting && 'Real-time: Reconnecting...'}
        {connectionState.status === 'error' && 'Real-time: Disconnected'}
        {connectionState.status === 'disconnected' && 'Real-time: Offline'}
      </TooltipContent>
    </Tooltip>
  );
}
