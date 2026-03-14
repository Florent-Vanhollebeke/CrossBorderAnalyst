import '@testing-library/jest-dom'
import { vi } from 'vitest'

// ============================================
// next/navigation
// ============================================
vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockReturnValue({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: vi.fn().mockReturnValue(new URLSearchParams()),
  useParams: vi.fn().mockReturnValue({ locale: 'fr' }),
  usePathname: vi.fn().mockReturnValue('/fr'),
  redirect: vi.fn(),
}))

// ============================================
// next-intl (client)
// ============================================
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fr',
}))

// ============================================
// next-intl/server
// ============================================
vi.mock('next-intl/server', () => ({
  getTranslations: () => async (key: string) => key,
  getMessages: async () => ({}),
  unstable_setRequestLocale: vi.fn(),
}))

// ============================================
// @/lib/supabase/client  (utilisé dans les pages auth)
// ============================================
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  })),
}))
