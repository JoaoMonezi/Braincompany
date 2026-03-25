import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExternalLinkIcon, EyeIcon, HeartIcon, MessageCircleIcon } from 'lucide-react'
import { DeletePostButton } from './delete-btn'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export default async function ProjectPostsPage({
  params,
  searchParams,
}: Context & { searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()

  // Filtros
  const filterPlatform = sp.platform || ''
  const filterHandle = sp.handle || ''
  const filterFrom = sp.from || ''
  const filterTo = sp.to || ''

  // Buscar perfis para dropdown de filtro
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, platform, handle')
    .eq('project_id', id)
    .order('handle')

  // Query posts com filtros
  let query = supabase
    .from('active_posts')
    .select('*')
    .eq('project_id', id)
    .order('published_at', { ascending: false })
    .limit(200)

  if (filterPlatform) {
    query = query.eq('platform', filterPlatform)
  }
  if (filterHandle) {
    query = query.eq('handle', filterHandle)
  }
  if (filterFrom) {
    query = query.gte('published_at', new Date(filterFrom).toISOString())
  }
  if (filterTo) {
    const to = new Date(filterTo)
    to.setDate(to.getDate() + 1)
    query = query.lt('published_at', to.toISOString())
  }

  const { data: posts } = await query

  if (!posts) {
    return <div className="p-8">Erro ao carregar posts.</div>
  }

  // Plataformas únicas para filtro
  const platforms = [...new Set(profiles?.map(p => p.platform) ?? [])]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Posts Coletados</h2>
          <p className="text-sm text-neutral-400">{posts.length} posts encontrados</p>
        </div>
      </div>

      {/* Filtros */}
      <form method="GET" className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-neutral-950 border border-neutral-800 rounded-lg">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Plataforma</label>
          <select
            name="platform"
            defaultValue={filterPlatform}
            className="bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white focus:border-pink-500 focus:outline-none min-w-[130px]"
          >
            <option value="">Todas</option>
            {platforms.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Perfil</label>
          <select
            name="handle"
            defaultValue={filterHandle}
            className="bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white focus:border-pink-500 focus:outline-none min-w-[160px]"
          >
            <option value="">Todos</option>
            {profiles?.map(p => (
              <option key={p.id} value={p.handle}>@{p.handle} ({p.platform})</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">De</label>
          <input
            type="date"
            name="from"
            defaultValue={filterFrom}
            className="bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white focus:border-pink-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wider text-neutral-500 font-medium">Até</label>
          <input
            type="date"
            name="to"
            defaultValue={filterTo}
            className="bg-neutral-900 border border-neutral-700 rounded-md px-3 py-1.5 text-sm text-white focus:border-pink-500 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-1.5 rounded-md bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium transition-colors"
        >
          Filtrar
        </button>

        {(filterPlatform || filterHandle || filterFrom || filterTo) && (
          <a
            href={`/dashboard/projects/${id}/posts`}
            className="px-3 py-1.5 rounded-md text-sm text-neutral-400 hover:text-white transition-colors"
          >
            Limpar
          </a>
        )}
      </form>

      {posts.length === 0 ? (
        <div className="text-center py-20 border border-neutral-800 border-dashed rounded-xl bg-neutral-950/50">
          <p className="text-neutral-500">Nenhum post encontrado com esses filtros.</p>
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
