import '@testing-library/jest-dom'
import { vi } from 'vitest'

const mockPush = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: vi.fn().mockImplementation(() => ({
    push: mockPush,
    refresh: mockRefresh,
  })),
  useSearchParams: vi.fn().mockImplementation(() => new URLSearchParams()),
}))

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))
