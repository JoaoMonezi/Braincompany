import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Inicializar cliente service role apenas no server-side para notificações background
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function notifyScrapingError(profileId: string, errorMsg: string) {
  // 1. Marcar perfil com erro
  await supabase
    .from('profiles')
    .update({ 
      status: 'error',
      last_error: errorMsg
    })
    .eq('id', profileId)

  // 2. Buscar dados do perfil (pra saber de qual projeto é)
  const { data: profile } = await supabase
    .from('profiles')
    .select('project_id, platform, handle, projects ( name )')
    .eq('id', profileId)
    .single()

  if (!profile) return

  // 3. Buscar os operadores do projeto (pra quem a gente vai notificar)
  // Assumimos que o campo operator_id do projeto aponta pro criador.
  // Em uma estrutura real, talvez tivéssemos uma tabela de notificações no DB pra exibir no painel
  
  // TODO: Integrar com API de e-mail (Resend/SendGrid) e enviar para o Operator
  // await sendEmail({
  //   to: "operator@agencia.com",
  //   subject: `Erro de Coleta: @${profile.handle} no projeto ${profile.projects.name}`,
  //   body: `A coleta falhou com a mensagem: ${errorMsg}`
  // })
  
  console.log(`[NOTIFY ERRO] -> Operador. Perfil @${profile.handle} falhou: ${errorMsg}`)
}

export async function notifyScrapingSuccess(profileId: string, itemsFound: number) {
  // Atualiza o perfil para ativo e limpa os erros
  await supabase
    .from('profiles')
    .update({ 
      status: 'active',
      last_error: null
    })
    .eq('id', profileId)
    
  console.log(`[NOTIFY SUCESSO] Perfil ${profileId} coletou ${itemsFound} posts válidos.`)
}
