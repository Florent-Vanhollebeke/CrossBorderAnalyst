import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { FiscalResults } from '@/components/results/FiscalResults'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock Recharts to avoid canvas issues in test env
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const lyon = {
  city: 'Lyon', country: 'FR', currency: 'EUR',
  corporate_tax_rate: 0.25, corporate_tax_amount: 60000,
  employer_social_charges_rate: 0.45, employer_social_charges_amount: 40000,
  employee_social_charges_rate: 0.22, employee_social_charges_amount: 19600,
  total_employer_cost: 129000, net_result: 111000,
  input: { revenue_annual: 500000, salary_director: 80000, num_employees: 5, average_employee_salary: 9000, total_gross_salaries: 125000, original_currency: 'EUR', local_currency: 'EUR', eur_to_chf_rate: null },
}

const geneve = {
  city: 'Geneve', country: 'CH', currency: 'CHF',
  corporate_tax_rate: 0.1398, corporate_tax_amount: 42000,
  employer_social_charges_rate: 0.1435, employer_social_charges_amount: 16000,
  employee_social_charges_rate: 0.127, employee_social_charges_amount: 14000,
  total_employer_cost: 128000, net_result: 260000,
  input: { revenue_annual: 470000, salary_director: 75200, num_employees: 5, average_employee_salary: 8460, total_gross_salaries: 117500, original_currency: 'EUR', local_currency: 'CHF', eur_to_chf_rate: 0.94 },
}

describe('FiscalResults', () => {
  const mockOnBack = vi.fn()

  it('renders city names in the table', () => {
    render(<FiscalResults results={[lyon, geneve]} onBack={mockOnBack} />)
    expect(screen.getAllByText(/Lyon/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Geneve/).length).toBeGreaterThan(0)
  })

  it('shows savings KPI when Swiss result is better', () => {
    render(<FiscalResults results={[lyon, geneve]} onBack={mockOnBack} />)
    // savings > 0 → should show "fiscal.savings" key
    expect(screen.getByText('fiscal.savings')).toBeInTheDocument()
  })

  it('renders net result row', () => {
    render(<FiscalResults results={[lyon, geneve]} onBack={mockOnBack} />)
    expect(screen.getByText('fiscal.net_result')).toBeInTheDocument()
  })
})
