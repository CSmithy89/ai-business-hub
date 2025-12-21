import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import KBChatPage from './page'

const mocks = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: () => ({ data: { workspaceId: 'workspace-1' } }),
}))

vi.mock('@/hooks/use-kb-pages', () => ({
  useKBAsk: () => ({ mutateAsync: mocks.mutateAsync, isPending: false }),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: { children: ReactNode }) => <button {...props}>{children}</button>,
}))

vi.mock('@/components/ui/input', () => ({
  Input: (props: React.ComponentProps<'input'>) => <input {...props} />, 
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

vi.mock('next/link', () => ({
  default: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils')>('@/lib/utils')
  return {
    ...actual,
    cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  }
})

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}))

describe('KBChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('crypto', { randomUUID: () => 'uuid-1' })
  })

  it('renders answer with citations', async () => {
    mocks.mutateAsync.mockResolvedValue({
      answer: 'Use JWT for auth.',
      sources: [{ pageId: 'page-1', title: 'Auth Guide', slug: 'auth-guide' }],
      confidence: 'medium',
    })

    render(<KBChatPage />)

    fireEvent.change(screen.getByPlaceholderText('Ask a question about your KB...'), {
      target: { value: 'How do we authenticate?' },
    })
    fireEvent.click(screen.getByText('Send'))

    await waitFor(() => {
      expect(screen.getByText('Use JWT for auth.')).toBeInTheDocument()
      expect(screen.getByText('Auth Guide')).toBeInTheDocument()
    })
  })
})
