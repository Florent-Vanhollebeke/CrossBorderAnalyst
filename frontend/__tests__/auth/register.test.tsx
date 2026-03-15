import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RegisterPage from '@/app/[locale]/auth/register/page'

const mockSignUp = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { signUp: mockSignUp },
  })),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))

describe('RegisterPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the registration form correctly', () => {
    render(<RegisterPage params={{ locale: 'fr' }} />)

    expect(screen.getByRole('heading', { name: /Créer un compte/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^Mot de passe/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirmer le mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Créer mon compte/i })).toBeInTheDocument()
  })

  it('shows error when passwords do not match — without calling Supabase', async () => {
    render(<RegisterPage params={{ locale: 'fr' }} />)

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Mot de passe/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }))

    await waitFor(() => {
      expect(screen.getByText(/Les mots de passe ne correspondent pas/i)).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows error when password is too short — without calling Supabase', async () => {
    render(<RegisterPage params={{ locale: 'fr' }} />)

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Mot de passe/i), { target: { value: 'short' } })
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }))

    await waitFor(() => {
      expect(screen.getByText(/au moins 8 caractères/i)).toBeInTheDocument()
    })

    expect(mockSignUp).not.toHaveBeenCalled()
  })

  it('shows confirmation message on successful registration', async () => {
    mockSignUp.mockResolvedValueOnce({ error: null })

    render(<RegisterPage params={{ locale: 'fr' }} />)

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Mot de passe/i), { target: { value: 'securepass' } })
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), { target: { value: 'securepass' } })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }))

    await waitFor(() => {
      expect(screen.getByText(/Vérifiez vos e-mails/i)).toBeInTheDocument()
    })

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'new@example.com',
      password: 'securepass',
      options: expect.objectContaining({
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      }),
    })
  })

  it('shows error message on Supabase failure', async () => {
    mockSignUp.mockResolvedValueOnce({ error: { message: 'User already registered' } })

    render(<RegisterPage params={{ locale: 'fr' }} />)

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'existing@example.com' } })
    fireEvent.change(screen.getByLabelText(/^Mot de passe/i), { target: { value: 'pass12345' } })
    fireEvent.change(screen.getByLabelText(/Confirmer le mot de passe/i), { target: { value: 'pass12345' } })
    fireEvent.click(screen.getByRole('button', { name: /Créer mon compte/i }))

    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument()
    })
  })
})
