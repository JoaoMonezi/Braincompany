import { createClient } from '@/lib/supabase/server'
import { PlayIcon } from 'lucide-react'
import { AddProfileModal } from './add-modal'
import { TriggerScrapeButton } from './trigger-btn'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export default async function ProjectProfilesPage({ params }: Context) {
  const { id } = await params
  const supabase = await createClient()

  // Usar a view profile_summary que tem as estatísticas agregadas
  const { data: profiles } = await supabase
    .from('profile_summary')
    .select('*')
    .eq('project_id', id)
    .order('total_views', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold mb-1">Perfis Monitorados</h2>
          <p className="text-sm text-neutral-400">Contas do Instagram, TikTok e YouTube configuradas para scraping.</p>
        </div>
        
        <AddProfileModal projectId={id} />
      </div>

      {!profiles || profiles.length === 0 ? (
        <div className="text-center py-20 border border-neutral-800 border-dashed rounded-xl bg-neutral-950/50">
          <p className="text-neutral-500 mb-4">Nenhum perfil cadastrado neste projeto.</p>
          <div className="flex justify-center">
            <AddProfileModal projectId={id} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-medium">
              <tr>
                <th className="px-4 py-3 font-medium">Plataforma</th>
                <th className="px-4 py-3 font-medium">Handle</th>
                <th className="px-4 py-3 font-medium text-right">Posts</th>
                <th className="px-4 py-3 font-medium text-right">Views Totais</th>
                <th className="px-4 py-3 font-medium text-right">Engajamento</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-900">
              {profiles.map((p) => (
                <tr key={p.profile_id} className="hover:bg-neutral-800/50 transition-colors">
                  <td className="px-4 py-3 capitalize">{p.platform}</td>
                  <td className="px-4 py-3 font-medium">@{p.handle}</td>
                  <td className="px-4 py-3 text-right font-mono">{p.total_posts || 0}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {p.total_views ? new Intl.NumberFormat('pt-BR').format(p.total_views) : 0}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-pink-500">
                    {((p.total_likes || 0) + (p.total_comments || 0)).toLocaleString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        p.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        p.status === 'paused' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        p.status === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        'bg-neutral-800 text-neutral-400 border border-neutral-700'
                      }`}>
                        {p.status}
                      </span>
                      {p.status !== 'paused' && (
                        <TriggerScrapeButton profileId={p.profile_id!} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
