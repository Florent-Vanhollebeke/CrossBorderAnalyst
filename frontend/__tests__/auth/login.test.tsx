import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginPage from '@/app/[locale]/auth/login/page'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

// Mock the Supabase client
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(),
}))

describe('LoginPage', () => {
  const mockSignInWithPassword = vi.fn()
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup generic mock return for createBrowserClient
    ;(createBrowserClient as any).mockReturnValue({
      auth: {
        signInWithPassword: mockSignInWithPassword,
      },
    })

    // Setup router mock
    ;(useRouter as any).mockReturnValue({
      push: mockPush,
      refresh: vi.fn(),
    })
  })

  it('renders login form correctly', () => {
    render(<LoginPage params={{ locale: 'fr' }}/>)
    
    expect(screen.getByRole('heading', { name: /Login/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument()
  })

  it('submits credentials to supabase and redirects on success', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ data: { user: { id: 1 } }, error: null })
    
    render(<LoginPage params={{ locale: 'fr' }}/>)
    
    // Fill out form
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } })
    
    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))
    
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/fr/dashboard') // Ensure redirect happens on success
    })
  })

  it('displays error message on failed login', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({ data: null, error: { message: 'Invalid login credentials' } })
    
    render(<LoginPage params={{ locale: 'fr' }}/>)
    
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'wrong@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
    
    // Should NOT redirect
    expect(mockPush).not.toHaveBeenCalled()
  })
})
