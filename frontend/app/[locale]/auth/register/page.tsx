'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?locale=${locale}`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
    } else {
      setMessage("Veuillez vérifier vos e-mails pour confirmer votre compte.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-center">Inscription</h1>
        
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 rounded bg-green-50 p-3 text-sm text-green-600 border border-green-200">
            {message}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border p-2 bg-transparent"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border p-2 bg-transparent"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border p-2 bg-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </button>
        </form>
      </div>
    </div>
  )
}
