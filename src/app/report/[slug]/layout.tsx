import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ slug: string }> }

export default async function ClientReportLayout({
  children,
  params,
}: {
  children: React.ReactNode
} & Context) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar o projeto pelo slug para pegar as cores e logo
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, brand_color, logo_url')
    .eq('slug', slug)
    .single()

  if (!project) redirect('/login')

  // Verifica se o usuário tem permissão para ver este projeto (Operator/Admin sempre tem, CLient tem RLS)
  const { data: hasAccess } = await supabase.rpc('has_project_access', { p_project_id: project.id })
  
  if (!hasAccess) {
    // Se não tiver acesso, volta pro login
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 flex flex-col font-sans">
      {/* Header com a cor tema do projeto */}
      <header 
        className="border-b border-neutral-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 w-full"
        style={{ backgroundColor: 'var(--brand, #171717)' }}
      >
        <style dangerouslySetInnerHTML={{ __html: `:root { --brand: ${project.brand_color || '#171717'} }` }} />
        
        <div className="flex items-center gap-3">
          {project.logo_url ? (
            <img src={project.logo_url} alt={project.name} className="h-8 w-auto rounded object-contain" />
          ) : (
            <div className="h-8 w-8 rounded bg-black/20 flex items-center justify-center font-bold text-white shadow-sm">
              {project.name.charAt(0)}
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight text-white">{project.name}</h1>
        </div>
        
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href={`/report/${slug}`} className="text-white/80 hover:text-white transition-colors drop-shadow-sm">
            Relatório
          </Link>
          <div className="w-px h-4 bg-white/20" />
          <form action="/auth/signout" method="post">
            <button className="text-white/80 hover:text-white transition-colors drop-shadow-sm">
              Sair
            </button>
          </form>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
        {children}
      </main>
    </div>
  )
}
