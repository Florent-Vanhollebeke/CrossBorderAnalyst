import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { RentResults } from '@/components/results/RentResults'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

const mockResult = {
  predicted_rent_chf: 4250,
  predicted_rent_eur: 3910,
  price_per_m2_chf: 28.3,
  confidence_range: { min_chf: 2825, max_chf: 5675, mae_chf: 1425 },
  city: 'Geneve',
  surface: 150,
  model_info: {
    model_type: 'XGBoost Regressor',
    r2_score: 0.763,
    training_data: 'ImmoScout24 Suisse',
    last_updated: '2025-12',
  },
}

describe('RentResults', () => {
  const mockOnBack = vi.fn()

  it('renders predicted rent in CHF', () => {
    render(<RentResults result={mockResult} onBack={mockOnBack} />)
    expect(screen.getByText(/4.?250/)).toBeInTheDocument()
  })

  it('renders price per m2', () => {
    render(<RentResults result={mockResult} onBack={mockOnBack} />)
    expect(screen.getByText(/28/)).toBeInTheDocument()
  })

  it('renders confidence range min and max', () => {
    render(<RentResults result={mockResult} onBack={mockOnBack} />)
    expect(screen.getAllByText(/2.?825/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/5.?675/).length).toBeGreaterThan(0)
  })

  it('renders model info fields', () => {
    render(<RentResults result={mockResult} onBack={mockOnBack} />)
    expect(screen.getByText('XGBoost Regressor')).toBeInTheDocument()
    expect(screen.getByText('76.3%')).toBeInTheDocument()
    expect(screen.getByText('ImmoScout24 Suisse')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', () => {
    render(<RentResults result={mockResult} onBack={mockOnBack} />)
    screen.getByText('back').click()
    expect(mockOnBack).toHaveBeenCalledOnce()
  })
})
