'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

/**
 * Digest unsubscribe page
 *
 * This page is accessed via a link in the digest email.
 * It calls the backend API to unsubscribe the user from digest emails.
 */
export default function DigestUnsubscribePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid unsubscribe link');
      return;
    }

    // Call backend API to unsubscribe
    const unsubscribe = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const response = await fetch(`${apiUrl}/pm/notifications/digest/unsubscribe/${token}`, {
          method: 'GET',
        });

        if (response.ok) {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMessage('Invalid or expired unsubscribe link');
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage('Failed to unsubscribe. Please try again.');
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Processing...</h1>
            <p className="text-gray-600">Please wait while we unsubscribe you from digest emails.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Unsubscribed</h1>
            <p className="text-gray-600 mb-6">
              You&apos;ve been unsubscribed from digest emails.
            </p>
            <p className="text-gray-600 mb-6">
              You can re-enable digest notifications anytime in your settings.
            </p>
            <Button
              onClick={() => router.push('/settings/notifications')}
              className="w-full"
            >
              Go to Settings
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">Error</h1>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'An unexpected error occurred.'}
            </p>
            <p className="text-gray-600 mb-6">
              Please use the unsubscribe link from your most recent digest email, or update your
              preferences in settings.
            </p>
            <Button
              onClick={() => router.push('/settings/notifications')}
              variant="outline"
              className="w-full"
            >
              Go to Settings
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
