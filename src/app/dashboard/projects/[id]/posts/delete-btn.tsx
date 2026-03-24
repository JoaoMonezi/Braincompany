'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrashIcon, Loader2Icon } from 'lucide-react'
import { toast } from 'sonner'

export function DeletePostButton({ postId }: { postId: string }) {
  const [isPending, setIsPending] = useState(false)
  const router = useRouter()

  function handleDeleteRequest() {
    toast('Ignorar Postagem?', {
      description: 'Ele sumirá desta lista e do relatório do cliente.',
      action: {
        label: 'Ignorar',
        onClick: () => executeDelete()
      },
      cancel: {
        label: 'Cancelar',
        onClick: () => {}
      }
    })
  }

  async function executeDelete() {
    setIsPending(true)
    try {
      const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error('Erro ao deletar post')
      }
      toast.success('Post ignorado com sucesso')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro interno')
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleDeleteRequest}
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
