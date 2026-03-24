'use client'

import { useState } from 'react'
import { PlusIcon, CopyIcon, CheckIcon, Loader2Icon } from 'lucide-react'
import { inviteClientAction } from './actions'

export function InviteClientSection({ projectId }: { projectId: string }) {
  const [email, setEmail] = useState('')
  const [isPending, setIsPending] = useState(false)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleInvite() {
    if (!email) return
    setIsPending(true)
    setError(null)
    setCopiedLink(null)

    try {
      const res = await inviteClientAction(projectId, email)
      if (res.error) throw new Error(res.error)
      if (res.link) {
        setCopiedLink(res.link)
        setEmail('')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro interno')
    } finally {
      setIsPending(false)
    }
  }

  function handleCopy() {
    if (copiedLink) {
      navigator.clipboard.writeText(copiedLink)
      // Feedback opcional com timeout se quisesse
    }
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 mt-6">
      <h3 className="text-lg font-bold mb-2">Convidar Cliente</h3>
      <p className="text-sm text-neutral-400 mb-6">
        Gere um link mágico de acesso para o seu cliente visualizar o relatório.
      </p>

      {error && (
        <div className="p-3 mb-4 text-sm bg-red-950/50 border border-red-900/50 text-red-400 rounded-md">
          {error}
        </div>
      )}

      {copiedLink ? (
        <div className="space-y-3 animate-in fade-in zoom-in-95">
          <p className="text-sm text-green-400 font-medium tracking-tight">Convite gerado com sucesso!</p>
          <div className="flex gap-2">
            <input 
              readOnly 
              value={copiedLink} 
              className="flex h-10 w-full rounded-md border border-green-900/50 bg-green-950/20 px-3 py-2 text-sm text-green-100 font-mono" 
            />
            <button 
              onClick={handleCopy}
              title="Copiar link"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 border border-green-900/50 hover:bg-green-900/50 text-green-400 h-10 w-10 shrink-0"
            >
              <CopyIcon className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-neutral-500">Envie este link para o cliente. Ele fará login magicamente ao clicar.</p>
          <button 
            onClick={() => setCopiedLink(null)}
            className="text-sm text-neutral-400 hover:text-white mt-2 inline-block transition-colors"
          >
            Gerar outro convite
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <input 
            type="email"
            placeholder="email.do.cliente@empresa.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={isPending}
            className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button 
            onClick={handleInvite}
            disabled={!email || isPending}
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 bg-white text-neutral-950 hover:bg-neutral-200 h-10 px-4 shrink-0"
          >
            {isPending ? <Loader2Icon className="w-4 h-4 animate-spin mr-2" /> : <PlusIcon className="w-4 h-4 mr-2" />}
            Gerar Link
          </button>
        </div>
      )}
    </div>
  )
}
