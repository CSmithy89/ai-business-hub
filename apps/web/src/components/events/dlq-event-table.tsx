'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { DLQEvent } from '@/hooks/use-event-stats';

interface DLQEventTableProps {
  events: DLQEvent[];
  isLoading?: boolean;
  onRetry: (eventId: string) => void;
  onDelete: (eventId: string) => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
}

/**
 * DLQEventTable component for displaying dead letter queue events
 *
 * Story: 05-7 - Event Monitoring Dashboard
 */
export function DLQEventTable({
  events,
  isLoading = false,
  onRetry,
  onDelete,
  isRetrying = false,
  isDeleting = false,
}: DLQEventTableProps) {
  const [selectedEvent, setSelectedEvent] = useState<DLQEvent | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No events in the dead letter queue
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const truncateError = (error: string, maxLength: number = 50) => {
    if (error.length <= maxLength) return error;
    return `${error.substring(0, maxLength)}...`;
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Type</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Attempts</TableHead>
            <TableHead>Moved At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((dlqEvent) => (
            <TableRow key={dlqEvent.streamId}>
              <TableCell>
                <Badge variant="outline">{dlqEvent.event.type}</Badge>
              </TableCell>
              <TableCell className="max-w-[200px]">
                <span
                  className="text-red-600 cursor-pointer hover:underline"
                  onClick={() => setSelectedEvent(dlqEvent)}
                >
                  {truncateError(dlqEvent.error)}
                </span>
              </TableCell>
              <TableCell>{dlqEvent.attempts}</TableCell>
              <TableCell>{formatDate(dlqEvent.movedAt)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedEvent(dlqEvent)}
                >
                  Inspect
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onRetry(dlqEvent.event.id)}
                  disabled={isRetrying}
                >
                  {isRetrying ? 'Retrying...' : 'Retry'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(dlqEvent.event.id)}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              Failed event from the dead letter queue
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Event ID</h4>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {selectedEvent.event.id}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Type</h4>
                <Badge variant="outline">{selectedEvent.event.type}</Badge>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Source</h4>
                <p className="text-sm">{selectedEvent.event.source}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Timestamp</h4>
                <p className="text-sm">{formatDate(selectedEvent.event.timestamp)}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Tenant ID</h4>
                <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                  {selectedEvent.event.tenantId}
                </p>
              </div>
              {selectedEvent.event.correlationId && (
                <div>
                  <h4 className="font-semibold mb-1">Correlation ID</h4>
                  <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                    {selectedEvent.event.correlationId}
                  </p>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-1">Error Message</h4>
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {selectedEvent.error}
                </p>
              </div>
              {selectedEvent.errorStack && (
                <div>
                  <h4 className="font-semibold mb-1">Stack Trace</h4>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                    {selectedEvent.errorStack}
                  </pre>
                </div>
              )}
              <div>
                <h4 className="font-semibold mb-1">Event Data</h4>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(selectedEvent.event.data, null, 2)}
                </pre>
              </div>
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    onRetry(selectedEvent.event.id);
                    setSelectedEvent(null);
                  }}
                  disabled={isRetrying}
                >
                  Retry Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
