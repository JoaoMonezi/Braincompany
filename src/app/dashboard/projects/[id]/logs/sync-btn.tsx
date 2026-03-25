'use client'

import { useState } from 'react'
import { RefreshCwIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { syncJobAction } from './actions'

export function SyncJobButton({ jobId, providerJobId }: { jobId: string, providerJobId: string }) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  async function handleSync() {
    setIsPending(true)
    try {
      const res = await syncJobAction(jobId, providerJobId)
      if (res.error) {
        toast.error(res.error)
      } else {
        toast.success(res.message || 'Sincronizado com sucesso!')
        router.refresh()
      }
    } catch (err) {
      toast.error('Erro ao sincronizar')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={isPending}
      title="Sincronizar manualmente com Apify"
      className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors disabled:opacity-50 inline-flex"
    >
      <RefreshCwIcon className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
    </button>
  )
}
