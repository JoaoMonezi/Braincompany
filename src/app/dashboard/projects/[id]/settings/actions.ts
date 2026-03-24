'use server'

import { createClient } from '@/lib/supabase/server'

export async function inviteClientAction(projectId: string, email: string) {
  if (!email || !projectId) {
    return { error: 'Email e projeto são obrigatórios.' }
  }

  const supabase = await createClient()

  // Verifica se quem está convidando tem permissão no projeto
  const { data: hasAccess } = await supabase.rpc('has_project_access', { p_project_id: projectId })
  if (!hasAccess) {
    return { error: 'Não autorizado.' }
  }

  // Obter o slug do projeto para formar a URL local (ou de produção) de destino.
  const { data: project } = await supabase
    .from('projects')
    .select('slug')
    .eq('id', projectId)
    .single()

  if (!project) {
    return { error: 'Projeto não encontrado.' }
  }

  // Gera um Magic Link via Admin API do Supabase Auth para enviar por e-mail,
  // E já cria o usuário se ele não existir
  const appUrl = process.env.NEXT_PUBLIC_APP_URL 
    || (process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : 'http://localhost:3000')

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      redirectTo: `${appUrl}/report/${project.slug}`
    }
  })

  if (linkError) {
    console.error('[inviteClientAction] generateLink error:', linkError)
    return { error: 'Não foi possível gerar um link neste momento.' }
  }

  if (!linkData?.properties?.action_link) {
    return { error: 'Link não retornado pela API.' }
  }

  // O Auth Link foi gerado. Agora precisamos garantir que esse e-mail 
  // tenha o "client" role e seja associado a este projeto
  
  // Pegamos o ID do usuário (o generateLink retorna o user)
  const userId = linkData.user.id

  // 1. Inserir ou ignorar na tabela user_roles (role: client)
  // Nota: o trigger no DB já deve ter criado o usuário, mas o upsert garante caso a role seja diferente
  const { error: insertUserError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, role: 'client' }, { onConflict: 'user_id' })

  if (insertUserError) {
    console.error('[inviteClientAction] upsert user_roles error:', insertUserError)
  }

  // 2. Criar a relação na client_users
  const { error: insertProjectUserError } = await supabase
    .from('client_users')
    .upsert({ user_id: userId, project_id: projectId }, { onConflict: 'user_id,project_id' })

  if (insertProjectUserError) {
    console.error('[inviteClientAction] upsert client_users error:', insertProjectUserError)
    return { error: 'Erro ao associar usuário ao projeto.' }
  }

  // Retornamos a URL gerada para que o operador/vendedor envie via WhatsApp
  return { link: linkData.properties.action_link }
}
