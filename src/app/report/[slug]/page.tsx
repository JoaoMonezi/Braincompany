import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EyeIcon, HeartIcon, MessageCircleIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ slug: string }> }

export default async function ClientReportPage({ params }: Context) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!project) redirect('/login')

  // Busca resumo dos perfis
  const { data: profiles } = await supabase
    .from('profile_summary')
    .select('*')
    .eq('project_id', project.id)

  // Busca ultimos posts ativos
  const { data: posts } = await supabase
    .from('active_posts')
    .select('*')
    .eq('project_id', project.id)
    .order('published_at', { ascending: false })
    .limit(50)

  // Agrega stats globais
  const totalViews = profiles?.reduce((sum, p) => sum + (p.total_views || 0), 0) || 0
  const totalEngagements = profiles?.reduce((sum, p) => sum + (p.total_likes || 0) + (p.total_comments || 0), 0) || 0

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-400 mb-2">Total de Visualizações</p>
          <p className="text-4xl font-bold tracking-tighter text-white">
            {new Intl.NumberFormat('pt-BR').format(totalViews)}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-400 mb-2">Engajamento Total</p>
          <p className="text-4xl font-bold tracking-tighter text-pink-500">
            {new Intl.NumberFormat('pt-BR').format(totalEngagements)}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-400 mb-2">Perfis Monitorados</p>
          <p className="text-4xl font-bold tracking-tighter text-white">
            {profiles?.length || 0}
          </p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-400 mb-2">Posts Identificados</p>
          <p className="text-4xl font-bold tracking-tighter text-white">
            {posts?.length || 0}
          </p>
        </div>
      </div>

      {/* Tabela de Posts */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-white">Últimos Posts Relacionados</h2>
        
        {!posts || posts.length === 0 ? (
          <div className="text-center py-20 border border-neutral-800 border-dashed rounded-xl bg-neutral-900/50">
            <p className="text-neutral-500">Ainda não encontramos posts compatíveis com suas regras.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {posts.map((post) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const metrics = (post.metrics as any) || {}
              return (
                <a 
                  key={post.id}
                  href={post.content_url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="group block bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors"
                >
                  {/* Imagem (16:9 approx) */}
                  <div className="aspect-video w-full bg-neutral-950 relative overflow-hidden">
                    {post.thumbnail_url ? (
                      <img 
                        src={post.thumbnail_url} 
                        alt="" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700 font-bold uppercase tracking-widest">
                        {post.platform}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 flex items-center gap-1.5 rounded text-xs font-medium text-white shadow-sm border border-white/10">
                      <EyeIcon className="w-3 h-3" />
                      {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(metrics.views || 0)}
                    </div>
                  </div>
                  
                  {/* Conteúdo */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white truncate max-w-[120px]">
                          @{post.handle}
                        </span>
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider bg-neutral-950 px-1 rounded border border-neutral-800">
                          {post.platform}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500">
                        {post.published_at ? new Date(post.published_at).toLocaleDateString('pt-BR') : ''}
                      </span>
                    </div>
                    
                    <p className="text-sm text-neutral-300 line-clamp-2 leading-relaxed mb-4 min-h-[40px]" title={post.caption || ''}>
                      {post.caption || <span className="text-neutral-500 italic">Sem legenda</span>}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 pt-3 border-t border-neutral-800">
                      <div className="flex items-center gap-1.5 text-pink-500">
                        <HeartIcon className="w-3.5 h-3.5" />
                        {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(metrics.likes || 0)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MessageCircleIcon className="w-3.5 h-3.5" />
                        {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(metrics.comments || 0)}
                      </div>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
