'use client'

import { useState } from 'react'
import { PlayIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

export function TriggerScrapeButton({ profileId }: { profileId: string }) {
  const [isPending, setIsPending] = useState(false)

  async function handleTrigger() {
    setIsPending(true)
    try {
      const res = await fetch(`/api/profiles/${profileId}/scrape`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Erro ao iniciar scraping')
      }
      toast.success('Coleta iniciada! Os posts aparecerão em breve.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro interno')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleTrigger}
      disabled={isPending}
      title="Forçar coleta agora"
      className="p-1.5 rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <Loader2Icon className="w-4 h-4 animate-spin" />
      ) : (
        <PlayIcon className="w-4 h-4" />
      )}
    </button>
  )
}
