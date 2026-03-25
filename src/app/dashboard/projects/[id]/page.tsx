import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EyeIcon, HeartIcon, FileTextIcon, UsersIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export default async function ProjectOverviewPage({ params }: Context) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('created_at')
    .eq('id', id)
    .single()

  if (!project) redirect('/dashboard')

  // Buscar stats agregados
  const { count: profilesCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id)

  // Buscar posts reais da view active_posts
  const { data: posts } = await supabase
    .from('active_posts')
    .select('metrics')
    .eq('project_id', id)

  const postsCount = posts?.length ?? 0

  let totalViews = 0
  let totalLikes = 0
  let totalComments = 0

  for (const p of posts ?? []) {
    const m = (p.metrics as Record<string, number> | null) ?? {}
    totalViews += m.views ?? 0
    totalLikes += m.likes ?? 0
    totalComments += m.comments ?? 0
  }

  const totalEngagement = totalLikes + totalComments
  const fmt = (n: number) => new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(n)

  const cards = [
    { label: 'Perfis Monitorados', value: profilesCount ?? 0, icon: UsersIcon, color: 'text-blue-400' },
    { label: 'Posts Cadastrados', value: postsCount, icon: FileTextIcon, color: 'text-pink-400' },
    { label: 'Total de Views', value: fmt(totalViews), icon: EyeIcon, color: 'text-emerald-400' },
    { label: 'Engajamento Total', value: fmt(totalEngagement), icon: HeartIcon, color: 'text-amber-400' },
  ]

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-6">Visão Geral</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-neutral-950 border border-neutral-800 rounded-lg p-5 flex flex-col gap-3 group hover:border-neutral-700 transition-colors">
            <div className="flex items-center justify-between">
              <p className="text-sm text-neutral-400">{c.label}</p>
              <c.icon className={`w-4 h-4 ${c.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
            <p className="text-3xl font-bold tracking-tighter">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Top 5 posts by views */}
      {postsCount > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Top Posts por Views</h3>
          <div className="space-y-2">
            {(posts ?? [])
              .sort((a, b) => {
                const va = ((a.metrics as Record<string, number> | null) ?? {}).views ?? 0
                const vb = ((b.metrics as Record<string, number> | null) ?? {}).views ?? 0
                return vb - va
              })
              .slice(0, 5)
              .map((p, i) => {
                const m = (p.metrics as Record<string, number> | null) ?? {}
                return (
                  <div key={i} className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3">
                    <span className="text-neutral-400 text-sm">#{i + 1}</span>
                    <span className="flex-1 ml-3 truncate text-sm text-neutral-200">
                      {fmt(m.views ?? 0)} views • {fmt(m.likes ?? 0)} likes
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {postsCount === 0 && (
        <div className="mt-12 text-center py-20 border border-neutral-800 border-dashed rounded-xl bg-neutral-950/50">
          <p className="text-neutral-500">Nenhum post coletado ainda. Vá em Perfis Monitorados e dispare uma coleta.</p>
        </div>
      )}
    </div>
  )
}
