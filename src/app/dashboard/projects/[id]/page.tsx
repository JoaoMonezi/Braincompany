import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export default async function ProjectOverviewPage({ params }: Context) {
  const { id } = await params
  const supabase = await createClient()

  // O dashboard layout já verificou auth e acesso
  const { data: project } = await supabase
    .from('projects')
    .select('created_at')
    .eq('id', id)
    .single()

  if (!project) redirect('/dashboard')

  // Buscar stats agregados dos perfis deste projeto
  const { count: profilesCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id)
    
  // TODO: Buscar active_posts nas ultimas 24h, total de views coletados, etc.
  
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-6">Visão Geral</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
          <p className="text-sm text-neutral-400 mb-1">Perfis Monitorados</p>
          <p className="text-3xl font-bold tracking-tighter">{profilesCount || 0}</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
          <p className="text-sm text-neutral-400 mb-1">Posts Cadastrados</p>
          <p className="text-3xl font-bold tracking-tighter">0</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
          <p className="text-sm text-neutral-400 mb-1">Total de Views</p>
          <p className="text-3xl font-bold tracking-tighter">0</p>
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-5">
          <p className="text-sm text-neutral-400 mb-1">Engajamento Total</p>
          <p className="text-3xl font-bold tracking-tighter">0</p>
        </div>
      </div>

      <div className="mt-12 text-center py-20 border border-neutral-800 border-dashed rounded-xl bg-neutral-950/50">
        <p className="text-neutral-500">Gráficos de evolução serão exibidos aqui em breve.</p>
      </div>
    </div>
  )
}
