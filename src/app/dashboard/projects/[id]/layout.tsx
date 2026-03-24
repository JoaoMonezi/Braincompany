import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

type Context = { params: Promise<{ id: string }> }

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
} & Context) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Verifica se é um operator e se tem acesso ao projeto especificamente
  const { data: hasAccess } = await supabase.rpc('has_project_access', { p_project_id: id })
  if (!hasAccess) redirect('/dashboard')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) redirect('/dashboard')

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard"
            className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </Link>
          
          <div className="flex items-center gap-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: project.brand_color }} 
            />
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          </div>
        </div>

        <nav className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-lg text-sm">
          <Link 
            href={`/dashboard/projects/${id}`}
            className="px-3 py-1.5 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Visão Geral
          </Link>
          <Link 
            href={`/dashboard/projects/${id}/profiles`}
            className="px-3 py-1.5 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Perfis Monitorados
          </Link>
          <Link 
            href={`/dashboard/projects/${id}/posts`}
            className="px-3 py-1.5 rounded-md hover:bg-neutral-800 transition-colors"
          >
            Posts
          </Link>
          <Link 
            href={`/dashboard/projects/${id}/settings`}
            className="px-3 py-1.5 rounded-md hover:bg-neutral-800 transition-colors text-neutral-400"
          >
            Configurações
          </Link>
        </nav>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl min-h-[500px] overflow-hidden">
        {children}
      </div>
    </div>
  )
}
