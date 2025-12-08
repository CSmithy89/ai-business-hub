import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Root route
 * - If authenticated, send to dashboard shell
 * - Otherwise, send to sign-in
 */
export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('hyvve.session_token');

  if (sessionToken) {
    redirect('/dashboard');
  }

  redirect('/sign-in');
}
