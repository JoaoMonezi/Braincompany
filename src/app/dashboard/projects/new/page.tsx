import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeftIcon } from 'lucide-react'
import { ProjectForm } from './form'

export default async function NewProjectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: role } = await supabase.rpc('get_my_role')
  if (role !== 'operator' && role !== 'super_admin') {
    redirect('/dashboard')
  }

  return (
    <div className="max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <Link 
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Voltar para projetos
        </Link>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Novo Projeto</h1>
        <p className="text-neutral-400">
          Crie um novo projeto para começar a monitorar perfis nas redes sociais e analisar os dados.
        </p>
      </div>

      <ProjectForm operatorId={user.id} />
    </div>
  )
}
