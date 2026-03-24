'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] relative overflow-hidden font-sans">
      
      {/* Ambient Glows */}
      <div className="absolute top-[20%] right-[-5%] w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-[0%] left-[-5%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <div className="w-full max-w-[400px] p-8 z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
            <span className="text-xl font-bold bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">BC</span>
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">Redefinir Senha</h1>
          <p className="text-sm text-neutral-400">Escolha uma senha forte para sua conta.</p>
        </div>

        {/* Card */}
        <div className="bg-[#111111]/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl p-8 rounded-2xl relative overflow-hidden">
          
          {/* Subtle top glare */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5">
            
            <div className="space-y-2">
              <label htmlFor="password" className="text-[13px] font-medium text-neutral-300">
                Nova Senha
              </label>
              <input
                id="password"
                type="password"
                className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-[13px] font-medium text-neutral-300">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="w-full h-11 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Salvando...' : 'Salvar e Entrar'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}
