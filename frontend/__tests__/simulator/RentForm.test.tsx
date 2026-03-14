import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RentForm } from '@/components/simulator/RentForm'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { predictRent: vi.fn() },
}))

describe('RentForm', () => {
  const mockOnResult = vi.fn()

  it('renders all required fields', () => {
    render(<RentForm onResult={mockOnResult} />)

    expect(screen.getByLabelText(/surface/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('submit button is enabled by default', () => {
    render(<RentForm onResult={mockOnResult} />)

    expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
  })

  it('api.predictRent mock is correctly wired', () => {
    // Vérifie que le mock est bien en place (pas de leak du module réel)
    expect(vi.isMockFunction(api.predictRent)).toBe(true)
  })
})
