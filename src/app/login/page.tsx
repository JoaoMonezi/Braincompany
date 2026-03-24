'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
      router.push('/dashboard')
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
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback` },
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
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/update-password`,
    })

    if (fpError) {
      setError(fpError.message)
    } else {
      setMsgType('reset_password')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      
      {/* Ambient Glows */}
      <div className="absolute top-[10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[0%] right-[-5%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <div className="w-full max-w-[400px] p-8 z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
           <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <span className="text-xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">BC</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Bem-vindo(a)</h1>
          <p className="text-sm text-neutral-400">Acesse o painel da sua agência.</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111]/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl p-8 rounded-2xl relative overflow-hidden">
          
          {/* Subtle top glare */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {msgType === 'magiclink' && (
            <div className="text-center py-6 animation-fade-in">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">✉️</span>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                Link enviado para <strong className="text-white">{email}</strong>.<br/>
                Verifique sua caixa de entrada.
              </p>
            </div>
          )}
          
          {msgType === 'reset_password' && (
            <div className="text-center py-6 animation-fade-in">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🔑</span>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                E-mail de redefinição enviado para <strong className="text-white">{email}</strong>.
              </p>
            </div>
          )}

          {!msgType && (
            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-[13px] font-medium text-neutral-300">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-[13px] font-medium text-neutral-300">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[12px] text-purple-400 hover:text-purple-300 transition-colors font-medium cursor-pointer bg-transparent border-none p-0"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
                <input
                  id="password"
                  type="password"
                  className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[13px] text-red-400">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </button>
                
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-white/[0.08]"></div>
                  <span className="flex-shrink-0 mx-4 text-neutral-500 text-xs uppercase tracking-wider">ou</span>
                  <div className="flex-grow border-t border-white/[0.08]"></div>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleMagicLink}
                  className="w-full h-11 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-neutral-300 hover:text-white text-sm font-medium rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none"
                >
                  Entrar sem senha (Link no e-mail)
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer Link */}
        <p className="text-center text-[13px] text-neutral-500 mt-8">
          Ainda não tem conta?{' '}
          <Link href="/signup" className="text-white hover:text-purple-400 transition-colors font-medium">
            Criar conta grátis
          </Link>
        </p>

      </div>
    </div>
  )
}
