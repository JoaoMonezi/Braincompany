'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
        // Envia para o localhost ou pra vercel dependendo de onde o user estiver
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`,
      }
    })

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      
      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <div className="w-full max-w-[400px] p-8 z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <span className="text-xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">BC</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Crie sua conta</h1>
          <p className="text-sm text-neutral-400">Comece a monitorar suas redes de forma inteligente.</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111]/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl p-8 rounded-2xl relative overflow-hidden">
          
          {/* Subtle top glare */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Quase lá!</h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Enviamos um link de confirmação para <strong className="text-white font-medium">{email}</strong>. 
                Clique nele para ativar sua conta.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-5">
              
              <div className="space-y-2">
                <label htmlFor="name" className="text-[13px] font-medium text-neutral-300">
                  Nome da Empresa / Agência
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="Sua Agência"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-[13px] font-medium text-neutral-300">
                  E-mail corporativo
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="voce@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-[13px] font-medium text-neutral-300">
                  Defina uma Senha
                </label>
                <input
                  id="password"
                  type="password"
                  className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-[13px] text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-sm font-medium rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {loading ? 'Criando conta...' : 'Criar Conta Grátis'}
              </button>
            </form>
          )}

        </div>

        {/* Footer Link */}
        <p className="text-center text-[13px] text-neutral-500 mt-8">
          Já possui uma conta?{' '}
          <Link href="/login" className="text-white hover:text-purple-400 transition-colors font-medium">
            Fazer login
          </Link>
        </p>

      </div>
    </div>
  )
}
