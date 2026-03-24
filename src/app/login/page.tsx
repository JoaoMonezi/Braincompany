'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
      }}
    >
      <div className="card" style={{ width: 360 }}>
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Brain Company
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Social analytics para agências
          </p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              ✉️ Link enviado para <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              Verifique sua caixa de entrada.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label
                htmlFor="email"
                style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}
              >
                E-mail
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? 'Enviando...' : 'Entrar com magic link'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
