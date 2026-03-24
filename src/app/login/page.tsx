'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  // msgType controls the visual feedback below the form
  const [msgType, setMsgType] = useState<'magiclink' | 'reset_password' | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMsgType(null)

    if (!password) {
      setError('Por favor, digite sua senha.')
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError('E-mail ou senha incorretos.')
    } else {
      router.push('/')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleMagicLink() {
    if (!email) {
      setError('Por favor, insira o e-mail antes de pedir o Magic Link.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: mlError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (mlError) {
      setError(mlError.message)
    } else {
      setMsgType('magiclink')
    }
    setLoading(false)
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Insira seu e-mail acima para redefinirmos sua senha.')
      return
    }
    setLoading(true)
    setError(null)

    const { error: fpError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })

    if (fpError) {
      setError(fpError.message)
    } else {
      setMsgType('reset_password')
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
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Brain Company
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
            Acesso ao Painel
          </p>
        </div>

        {msgType === 'magiclink' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              ✉️ Link enviado para <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
              Verifique sua caixa de entrada.
            </p>
          </div>
        )}
        
        {msgType === 'reset_password' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              🔑 E-mail de redefinição enviado para <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            </p>
          </div>
        )}

        {!msgType && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                className="input cursor-text"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 }}>
                <label
                  htmlFor="password"
                  style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}
                >
                  Senha
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 11, cursor: 'pointer', padding: 0 }}
                >
                  Esqueci minha senha
                </button>
              </div>
              <input
                id="password"
                type="password"
                className="input cursor-text"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: 'var(--error)', margin: 0 }}>{error}</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              
              <button
                type="button"
                className="btn-secondary"
                disabled={loading}
                onClick={handleMagicLink}
                style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Entrar com link no e-mail
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
