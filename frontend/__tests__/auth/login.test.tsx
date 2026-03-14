import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/[locale]/auth/login/page'
import { createClient } from '@/lib/supabase/client'

describe('LoginPage', () => {
  const mockPush = vi.fn()
  const mockSignInWithPassword = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush, refresh: vi.fn() })
    ;(createClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { signInWithPassword: mockSignInWithPassword },
    })
  })

  it('renders login form with email, password and submit button', () => {
    render(<LoginPage params={{ locale: 'fr' }} />)
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('redirects to /fr/simulator on successful login', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: null })
    render(<LoginPage params={{ locale: 'fr' }} />)

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'user@test.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'user@test.com', password: 'pass123' })
      expect(mockPush).toHaveBeenCalledWith('/fr/simulator')
    })
  })

  it('shows error on failed login and does not redirect', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } })
    render(<LoginPage params={{ locale: 'fr' }} />)

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'bad@test.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('disables submit button while loading', async () => {
    mockSignInWithPassword.mockReturnValueOnce(new Promise(() => {}))
    render(<LoginPage params={{ locale: 'fr' }} />)

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Signing in/i })).toBeDisabled()
    })
  })
})
