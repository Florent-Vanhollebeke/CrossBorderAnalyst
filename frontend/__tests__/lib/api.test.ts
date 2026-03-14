import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api, formatCHF, formatEUR, normalizeCity } from '@/lib/api'

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('predictRent', () => {
    it('calls /api/v1/predict-rent with POST', async () => {
      const mockResponse = {
        predicted_rent_chf: 4250, predicted_rent_eur: 3910,
        price_per_m2_chf: 28.3,
        confidence_range: { min_chf: 2825, max_chf: 5675, mae_chf: 1425 },
        city: 'Geneve', surface: 150,
        model_info: { model_type: 'XGBoost', r2_score: 0.763, training_data: 'ImmoScout24', last_updated: '2025-12' },
      }
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as any)

      const result = await api.predictRent({ city: 'Geneve', surface: 150 })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/predict-rent'),
        expect.objectContaining({ method: 'POST' })
      )
      expect(result.predicted_rent_chf).toBe(4250)
    })

    it('throws ApiError with user-friendly message on 500', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 500 } as any)
      await expect(api.predictRent({ city: 'Geneve', surface: 50 })).rejects.toMatchObject({
        status: 500,
        detail: 'Erreur serveur temporaire.',
      })
    })

    it('throws timeout ApiError when request is aborted', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(
        Object.assign(new Error('Aborted'), { name: 'AbortError' })
      )
      await expect(api.predictRent({ city: 'Geneve', surface: 50 })).rejects.toMatchObject({
        status: 408,
        detail: expect.stringContaining('expir'),
      })
    })

    it('throws 429 rate limit error with correct message', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 429 } as any)
      await expect(api.predictRent({ city: 'Geneve', surface: 50 })).rejects.toMatchObject({
        status: 429,
        detail: expect.stringContaining('Trop de'),
      })
    })
  })

  describe('compareFiscal', () => {
    it('calls /api/v1/compare-fiscal with POST body', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ city: 'Geneve', net_result: 250000 }),
      } as any)

      await api.compareFiscal({ revenue_annual: 500000, salary_director: 80000, num_employees: 5, city: 'Geneve' })

      const call = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(call[0]).toContain('/api/v1/compare-fiscal')
      expect(JSON.parse(call[1].body)).toMatchObject({ city: 'Geneve' })
    })
  })
})

describe('normalizeCity', () => {
  it.each([
    ['geneve', 'Geneve'],
    ['genève', 'Geneve'],
    ['Genf', 'Geneve'],
    ['Lausanne', 'Lausanne'],
    ['ZURICH', 'Zurich'],
    ['zürich', 'Zurich'],
    ['Basel', 'Basel'],
    ['bâle', 'Basel'],
  ])('normalizes %s → %s', (input, expected) => {
    expect(normalizeCity(input)).toBe(expected)
  })

  it('returns Geneve for unknown city', () => {
    expect(normalizeCity('unknown-city')).toBe('Geneve')
  })
})

describe('formatCHF', () => {
  it('formats number as CHF currency', () => {
    const result = formatCHF(4250)
    expect(result).toContain('4')
    expect(result).toContain('250')
    expect(result).toContain('CHF')
  })
})

describe('formatEUR', () => {
  it('formats number as EUR currency', () => {
    const result = formatEUR(3910)
    expect(result).toContain('3')
    expect(result).toContain('910')
    expect(result).toContain('€')
  })
})
