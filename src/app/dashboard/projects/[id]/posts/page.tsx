import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TrashIcon, ExternalLinkIcon, EyeIcon, HeartIcon, MessageCircleIcon } from 'lucide-react'
import { DeletePostButton } from './delete-btn'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export default async function ProjectPostsPage({ params }: Context) {
  const { id } = await params
  const supabase = await createClient()

  // Buscar posts da view "active_posts" apenas para este projeto
  const { data: posts } = await supabase
    .from('active_posts')
    .select('*')
    .eq('project_id', id)
    .order('published_at', { ascending: false })
    .limit(100)

  if (!posts) {
    return <div className="p-8">Erro ao carregar posts.</div>
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold mb-1">Posts Coletados</h2>
          <p className="text-sm text-neutral-400">Últimos 100 posts ativos monitorados em todas as plataformas.</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 border border-neutral-800 border-dashed rounded-xl bg-neutral-950/50">
          <p className="text-neutral-500">Nenhum post coletado ainda.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-medium">
              <tr>
                <th className="px-4 py-3 font-medium w-16">Mídia</th>
                <th className="px-4 py-3 font-medium">Post & Caption</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3 font-medium text-right">Data</th>
                <th className="px-4 py-3 font-medium text-right">Views</th>
                <th className="px-4 py-3 font-medium text-right">Engajamento</th>
                <th className="px-4 py-3 font-medium w-16 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-900">
              {posts.map((post) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const metrics = (post.metrics as any) || {}
                const views = metrics.views || 0
                const likes = metrics.likes || 0
                const comments = metrics.comments || 0

                return (
                  <tr key={post.id} className="hover:bg-neutral-800/50 transition-colors group">
                    <td className="px-4 py-3">
                      {post.thumbnail_url ? (
                        <a href={post.content_url || '#'} target="_blank" rel="noreferrer">
                          <img 
                            src={post.thumbnail_url} 
                            alt="" 
                            className="w-12 h-12 object-cover rounded bg-neutral-800"
                            loading="lazy"
                          />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded border border-neutral-800 bg-neutral-950 flex items-center justify-center text-xs text-neutral-500 uppercase">
                          {post.platform}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="text-neutral-200 line-clamp-2 leading-relaxed" title={post.caption || ''}>
                          {post.caption || <span className="text-neutral-500 italic">Sem legenda</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-800 text-neutral-400 uppercase tracking-wider">
                            {post.post_type || 'post'}
                          </span>
                          {post.content_url && (
                            <a 
                              href={post.content_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xs text-pink-500 hover:text-pink-400 inline-flex items-center gap-1"
                            >
                              Ver Original <ExternalLinkIcon className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white mb-0.5">@{post.handle}</div>
                      <div className="text-xs text-neutral-500 capitalize">{post.platform}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-neutral-400 whitespace-nowrap">
                      {post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5 font-mono text-neutral-200">
                        {new Intl.NumberFormat('pt-BR').format(views)}
                        <EyeIcon className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1 font-mono text-xs">
                        <div className="inline-flex items-center gap-1.5 text-pink-500">
                          {new Intl.NumberFormat('pt-BR').format(likes)}
                          <HeartIcon className="w-3 h-3" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-neutral-400">
                          {new Intl.NumberFormat('pt-BR').format(comments)}
                          <MessageCircleIcon className="w-3 h-3" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DeletePostButton postId={post.id!} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
