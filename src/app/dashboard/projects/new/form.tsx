'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProjectAction } from './actions'

export function ProjectForm({ operatorId }: { operatorId: string }) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    formData.append('operator_id', operatorId)
    
    const result = await createProjectAction(formData)
    
    if (result.error) {
      setError(result.error)
      setIsPending(false)
    } else if (result.id) {
      router.push(`/dashboard/projects/${result.id}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      {error && (
        <div className="p-3 text-sm bg-red-950/50 border border-red-900/50 text-red-400 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium">
          Nome do Projeto
        </label>
        <input
          id="name"
          name="name"
          required
          autoFocus
          className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Ex: Coca-Cola Brasil"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="brand_color" className="text-sm font-medium">
          Cor da Marca
        </label>
        <div className="flex gap-3">
          <input
            id="brand_color"
            name="brand_color"
            type="color"
            defaultValue="#e11d48"
            className="h-10 w-14 rounded-md border border-neutral-800 bg-neutral-950 p-1 cursor-pointer shrink-0"
          />
          <input
            type="text"
            className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-400 font-mono disabled:cursor-not-allowed disabled:opacity-50"
            value="Escolha uma cor para identificar o projeto"
            readOnly
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="logo_url" className="text-sm font-medium">
          URL da Logo <span className="text-neutral-500 font-normal">(opcional)</span>
        </label>
        <input
          id="logo_url"
          name="logo_url"
          type="url"
          className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="https://..."
        />
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-pink-600 text-white hover:bg-pink-600/90 h-10 px-6"
        >
          {isPending ? 'Criando...' : 'Criar Projeto'}
        </button>
      </div>
    </form>
  )
}
