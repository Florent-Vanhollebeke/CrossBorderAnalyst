import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'

describe('LanguageSwitcher', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as ReturnType<typeof vi.fn>).mockReturnValue({ push: mockPush })
    ;(usePathname as ReturnType<typeof vi.fn>).mockReturnValue('/fr/simulator')
  })

  it('renders FR, EN and DE buttons', () => {
    ;(useParams as ReturnType<typeof vi.fn>).mockReturnValue({ locale: 'fr' })
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: 'FR' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'EN' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'DE' })).toBeInTheDocument()
  })

  it('marks current locale as active (aria-current)', () => {
    ;(useParams as ReturnType<typeof vi.fn>).mockReturnValue({ locale: 'fr' })
    render(<LanguageSwitcher />)
    expect(screen.getByRole('button', { name: 'FR' })).toHaveAttribute('aria-current', 'true')
    expect(screen.getByRole('button', { name: 'EN' })).not.toHaveAttribute('aria-current')
  })

  it('navigates to EN path when EN button clicked', () => {
    ;(useParams as ReturnType<typeof vi.fn>).mockReturnValue({ locale: 'fr' })
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'EN' }))
    expect(mockPush).toHaveBeenCalledWith('/en/simulator')
  })

  it('navigates to DE path when DE button clicked', () => {
    ;(useParams as ReturnType<typeof vi.fn>).mockReturnValue({ locale: 'fr' })
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'DE' }))
    expect(mockPush).toHaveBeenCalledWith('/de/simulator')
  })

  it('does not navigate when clicking the already active locale', () => {
    ;(useParams as ReturnType<typeof vi.fn>).mockReturnValue({ locale: 'fr' })
    render(<LanguageSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: 'FR' }))
    expect(mockPush).toHaveBeenCalledWith('/fr/simulator')
  })
})
