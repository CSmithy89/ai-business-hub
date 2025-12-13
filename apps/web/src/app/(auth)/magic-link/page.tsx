import { MagicLinkForm } from '@/components/auth/magic-link-form'

export const metadata = {
  title: 'Magic Link Sign In',
  description: 'Sign in to your HYVVE account with a magic link',
}

export default function MagicLinkPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white shadow-lg rounded-lg px-8 py-10">
          <MagicLinkForm />
        </div>
      </div>
    </div>
  )
}
