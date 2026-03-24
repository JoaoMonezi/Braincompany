'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusIcon, XIcon } from 'lucide-react'

export function AddProfileModal({ projectId }: { projectId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const payload = {
      project_id: projectId,
      platform: formData.get('platform'),
      handle: formData.get('handle'),
      rules: {
        min_views: Number(formData.get('min_views') || 0),
        include_hashtags: formData.get('include_hashtags') ? String(formData.get('include_hashtags')).split(',').map(s => s.trim()).filter(Boolean) : [],
        exclude_hashtags: formData.get('exclude_hashtags') ? String(formData.get('exclude_hashtags')).split(',').map(s => s.trim()).filter(Boolean) : [],
        caption_contains: formData.get('caption_contains') ? String(formData.get('caption_contains')).split(',').map(s => s.trim()).filter(Boolean) : [],
        caption_excludes: formData.get('caption_excludes') ? String(formData.get('caption_excludes')).split(',').map(s => s.trim()).filter(Boolean) : [],
      }
    }

    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao adicionar perfil')
      }

      setIsOpen(false)
      router.refresh() // Atualiza a lista na página
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsPending(false)
    }
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 hover:text-neutral-50 h-9 px-4 py-2"
      >
        <PlusIcon className="w-4 h-4 mr-2" />
        Adicionar Perfil
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold">Adicionar Perfil</h2>
          <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 text-sm bg-red-950/50 border border-red-900/50 text-red-400 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plataforma</label>
              <select 
                name="platform"
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Handle (@)</label>
              <input 
                name="handle"
                required
                placeholder="Ex: cocacola_br"
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <h3 className="text-sm font-semibold text-neutral-400">Regras de Captura (opcional)</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300">Mínimo de Views</label>
              <input 
                type="number"
                name="min_views"
                placeholder="0"
                className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Incluir Hashtags <span className="text-xs font-normal text-neutral-500">(separadas por ,)</span></label>
                <input 
                  name="include_hashtags"
                  placeholder="#verao, #festa"
                  className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300">Excluir Hashtags</label>
                <input 
                  name="exclude_hashtags"
                  placeholder="#inverno"
                  className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-800">
            <button 
              type="button" 
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-neutral-800 bg-transparent hover:bg-neutral-800 h-10 px-4 py-2"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-pink-600 text-white hover:bg-pink-600/90 h-10 px-4 py-2"
            >
              {isPending ? 'Adicionando...' : 'Adicionar Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
