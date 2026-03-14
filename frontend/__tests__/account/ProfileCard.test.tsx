import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ProfileCard } from '@/components/account/ProfileCard'

describe('ProfileCard', () => {
  it('renders user email', () => {
    render(<ProfileCard email="alice@example.com" createdAt="2024-01-15T00:00:00Z" locale="fr" />)
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
  })

  it('renders initials from email prefix (2 chars)', () => {
    render(<ProfileCard email="florent@test.com" createdAt="2024-01-15T00:00:00Z" locale="fr" />)
    expect(screen.getByText('FL')).toBeInTheDocument()
  })

  it('renders member_since label', () => {
    render(<ProfileCard email="alice@example.com" createdAt="2024-01-15T00:00:00Z" locale="fr" />)
    // useTranslations('account.profile') mock returns key segment: t('member_since') => 'member_since'
    expect(screen.getByText(/member_since/)).toBeInTheDocument()
  })

  it('renders profile title card', () => {
    render(<ProfileCard email="alice@example.com" createdAt="2024-01-15T00:00:00Z" locale="fr" />)
    expect(screen.getByText('title')).toBeInTheDocument()
  })
})
