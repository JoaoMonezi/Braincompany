'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon, Loader2Icon } from 'lucide-react'

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('Deseja realmente ignorar este post? Ele sumirá desta lista e do relatório do cliente.')) return
    
    setIsPending(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error('Erro ao deletar post')
      }
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro interno')
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      title="Excluir Post (Soft Delete)"
      className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
    >
      {isPending ? (
        <Loader2Icon className="w-4 h-4 animate-spin" />
      ) : (
        <TrashIcon className="w-4 h-4" />
      )}
    </button>
  )
}
