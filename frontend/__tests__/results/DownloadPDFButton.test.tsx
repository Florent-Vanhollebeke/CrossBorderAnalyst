import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { DownloadPDFButton } from '@/components/results/DownloadPDFButton'

const RESULTS = [
  { city: 'Lyon', country: 'FR', currency: 'EUR',
    corporate_tax_rate: 0.25, corporate_tax_amount: 60000,
    employer_social_charges_rate: 0.45, employer_social_charges_amount: 40000,
    employee_social_charges_rate: 0.22, employee_social_charges_amount: 19600,
    total_employer_cost: 129000, net_result: 111000,
    input: { revenue_annual: 500000, salary_director: 80000, num_employees: 5,
      average_employee_salary: 9000, total_gross_salaries: 125000,
      original_currency: 'EUR', local_currency: 'EUR', eur_to_chf_rate: null } },
]

describe('DownloadPDFButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('renders download button with label', () => {
    render(<DownloadPDFButton results={RESULTS} />)
    expect(screen.getByRole('button', { name: /Télécharger le rapport PDF/i })).toBeInTheDocument()
  })

  it('calls the PDF endpoint and creates object URL on success', async () => {
    const mockBlob = new Blob(['%PDF-mock'], { type: 'application/pdf' })
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as any)

    render(<DownloadPDFButton results={RESULTS} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/generate-pdf/fiscal'),
        expect.objectContaining({ method: 'POST' })
      )
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
    })
  })

  it('shows error when PDF endpoint returns 500', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 } as any)
    render(<DownloadPDFButton results={RESULTS} />)
    fireEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText(/Impossible de générer le PDF/i)).toBeInTheDocument()
    })
  })

  it('is disabled when results array is empty', () => {
    render(<DownloadPDFButton results={[]} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
