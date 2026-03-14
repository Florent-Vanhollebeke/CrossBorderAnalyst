import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FiscalForm } from '@/components/simulator/FiscalForm'
import { api } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  api: { compareFiscal: vi.fn() },
}))

const FISCAL_RESULT = {
  city: 'Geneve', country: 'CH', currency: 'CHF',
  corporate_tax_rate: 0.1398, corporate_tax_amount: 42000,
  employer_social_charges_rate: 0.1435, employer_social_charges_amount: 16000,
  employee_social_charges_rate: 0.127, employee_social_charges_amount: 14000,
  total_employer_cost: 128000, net_result: 260000,
  input: { revenue_annual: 470000, salary_director: 75200, num_employees: 5,
    average_employee_salary: 8460, total_gross_salaries: 117500,
    original_currency: 'EUR', local_currency: 'CHF', eur_to_chf_rate: 0.94 },
}

describe('FiscalForm', () => {
  const mockOnResult = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.compareFiscal as ReturnType<typeof vi.fn>).mockResolvedValue(FISCAL_RESULT)
  })

  it('renders revenue and salary director fields', () => {
    render(<FiscalForm onResult={mockOnResult} />)
    // useTranslations mock returns key segment: t('revenue') => 'revenue'
    expect(screen.getByLabelText('revenue')).toBeInTheDocument()
    expect(screen.getByLabelText('salary_director')).toBeInTheDocument()
  })

  it('renders submit button', () => {
    render(<FiscalForm onResult={mockOnResult} />)
    expect(screen.getByRole('button', { name: 'submit' })).toBeInTheDocument()
  })

  it('calls api.compareFiscal for all 5 cities on submit', async () => {
    render(<FiscalForm onResult={mockOnResult} />)
    fireEvent.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(api.compareFiscal).toHaveBeenCalledTimes(5)
    })
    const cities = (api.compareFiscal as ReturnType<typeof vi.fn>).mock.calls.map((c: any[]) => c[0].city)
    expect(cities).toContain('Lyon')
    expect(cities).toContain('Geneve')
    expect(cities).toContain('Zurich')
    expect(cities).toContain('Basel')
    expect(cities).toContain('Lausanne')
  })

  it('calls onResult with array of 5 results on success', async () => {
    render(<FiscalForm onResult={mockOnResult} />)
    fireEvent.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(mockOnResult).toHaveBeenCalledOnce()
      expect(mockOnResult.mock.calls[0][0]).toHaveLength(5)
    })
  })

  it('shows error message on API failure', async () => {
    ;(api.compareFiscal as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      detail: 'Erreur serveur temporaire.', status: 500,
    })
    render(<FiscalForm onResult={mockOnResult} />)
    fireEvent.click(screen.getByRole('button', { name: 'submit' }))

    await waitFor(() => {
      expect(screen.getByText('Erreur serveur temporaire.')).toBeInTheDocument()
    })
    expect(mockOnResult).not.toHaveBeenCalled()
  })

  it('api mock is correctly wired', () => {
    expect(vi.isMockFunction(api.compareFiscal)).toBe(true)
  })
})
