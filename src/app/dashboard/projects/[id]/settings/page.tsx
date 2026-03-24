import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteClientSection } from './invite-form'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export default async function ProjectSettingsPage({ params }: Context) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) redirect('/dashboard')

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-xl font-bold mb-6">Configurações do Projeto</h2>
      
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Nome do Projeto</label>
          <input 
            disabled 
            value={project.name} 
            className="flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-400 opacity-50 cursor-not-allowed" 
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Dashboard do Cliente URL</label>
          <div className="flex">
            <span className="flex items-center px-3 rounded-l-md border border-r-0 border-neutral-800 bg-neutral-900 text-neutral-500 text-sm">
              braincompany.app/report/
            </span>
            <input 
              readOnly 
              value={project.slug} 
              className="flex h-10 w-full rounded-r-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-400" 
            />
          </div>
          <p className="text-xs text-neutral-500 mt-1">Este é o link que você pode compartilhar com o cliente final.</p>
        </div>

        <div className="space-y-2 pt-6 border-t border-neutral-800">
          <button className="text-sm text-red-400 hover:text-red-300 font-medium">
            Excluir Projeto Permanentemente
          </button>
          <p className="text-xs text-neutral-500 max-w-md">
            Esta ação é irreversível. Todos os dados, perfis e posts coletados para este projeto serão apagados.
          </p>
        </div>
      </div>
      
      <InviteClientSection projectId={project.id} />
    </div>
  )
}
