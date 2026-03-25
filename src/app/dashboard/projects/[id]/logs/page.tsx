import { createClient } from '@/lib/supabase/server'
import { SyncJobButton } from './sync-btn'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export default async function LogsPage({ params }: Context) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, platform, handle')
    .eq('project_id', id)

  const profileIds = profiles?.map(p => p.id) || []
  const profileMap = new Map(profiles?.map(p => [p.id, p]))

  const { data: jobs } = await supabase
    .from('scraping_jobs')
    .select('*')
    .in('profile_id', profileIds)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Histórico de Coletas</h2>
          <p className="text-sm text-neutral-400 mt-1">
            Veja todas as extrações de dados realizadas para os perfis deste projeto.
          </p>
        </div>
      </div>

      <div className="border border-neutral-800 rounded-lg overflow-hidden bg-neutral-900/50">
        <table className="w-full text-sm text-left">
          <thead className="bg-neutral-800/50 text-neutral-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Data / Hora</th>
              <th className="px-4 py-3 font-medium">Perfil</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Itens</th>
              <th className="px-4 py-3 font-medium">Erro</th>
              <th className="px-4 py-3 font-medium text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
            {jobs?.map((job) => {
              const profile = profileMap.get(job.profile_id)
              const statusColor = 
                job.status === 'done' ? 'text-green-400 bg-green-400/10' :
                job.status === 'failed' ? 'text-red-400 bg-red-400/10' :
                'text-pink-400 bg-pink-400/10 animate-pulse'

              return (
                <tr key={job.id} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    {format(new Date(job.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3">
                    {profile ? (
                      <span className="capitalize">{profile.platform} (@{profile.handle})</span>
                    ) : (
                      <span className="text-neutral-500">Perfil Excluído</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider ${statusColor}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {job.posts_collected > 0 ? (
                      <span className="text-white font-medium">{job.posts_collected}</span>
                    ) : (
                      <span className="text-neutral-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[200px] truncate" title={job.error_msg || ''}>
                    {job.error_msg ? (
                      <span className="text-red-400/80 text-xs">{job.error_msg}</span>
                    ) : (
                      <span className="text-neutral-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {job.status === 'running' && profile && (
                      <SyncJobButton 
                        jobId={job.id} 
                        providerJobId={job.provider_job_id} 
                      />
                    )}
                  </td>
                </tr>
              )
            })}

            {(!jobs || jobs.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  Nenhuma extração registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
