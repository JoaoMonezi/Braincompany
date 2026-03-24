import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PlusIcon, LibraryIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: role } = await supabase.rpc('get_my_role')
  
  if (role !== 'operator' && role !== 'super_admin') {
    // Clients deveriam ir para /report/[slug] (a fazer)
    // Se não tiver role, ou logado sem permissao
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-semibold mb-2">Acesso Restrito</h2>
        <p className="text-neutral-400">Você não tem permissão para acessar o painel de operador.</p>
      </div>
    )
  }

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Meus Projetos</h1>
          <p className="text-neutral-400">Gerencie todos os projetos da agência e monitore contas.</p>
        </div>
        <Link 
          href="/dashboard/projects/new" 
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-pink-600 text-white hover:bg-pink-600/90 h-10 px-4 py-2 gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Novo Projeto
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 border-dashed bg-neutral-900/50 flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center mb-4 text-neutral-400">
            <LibraryIcon className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum projeto ainda</h3>
          <p className="text-neutral-400 max-w-sm mx-auto mb-6">
            Crie seu primeiro projeto para começar a monitorar contas nas redes sociais.
          </p>
          <Link 
            href="/dashboard/projects/new" 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-neutral-950 hover:bg-neutral-200 h-10 px-4 py-2 gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            Criar Primeiro Projeto
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <Link 
              key={p.id} 
              href={`/dashboard/projects/${p.id}`}
              className="group block rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden hover:border-neutral-700 transition-colors"
            >
              <div 
                className="h-2 w-full transition-opacity group-hover:opacity-90" 
                style={{ backgroundColor: p.brand_color }} 
              />
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={p.name} className="w-12 h-12 rounded-lg bg-neutral-800 object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center font-bold text-lg text-neutral-300">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg line-clamp-1">{p.name}</h3>
                    <p className="text-xs text-neutral-500 font-mono">/{p.slug}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-neutral-400 border-t border-neutral-800 pt-4 mt-2">
                  <span>Abrir painel</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
