'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // espaços para -
    .replace(/[^\w-]+/g, '')     // remove caracteres não-word
    .replace(/--+/g, '-')        // remove múltiplos -
}

export async function createProjectAction(formData: FormData) {
  const name = formData.get('name') as string
  const brand_color = formData.get('brand_color') as string
  const logo_url = formData.get('logo_url') as string
  const operator_id = formData.get('operator_id') as string

  if (!name || !operator_id || !brand_color) {
    return { error: 'Campos obrigatórios faltando.' }
  }

  const slug = slugify(name)
  const supabase = await createClient()

  // O RLS (operator cria) já garante que o operator_id enviado deve ser igual ao auth.uid(),
  // Mas para seguranca extra vamos validar aqui no server:
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== operator_id) {
    return { error: 'Não autorizado.' }
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      name,
      slug,
      brand_color,
      logo_url: logo_url || null,
      operator_id,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createProjectAction]', error)
    if (error.code === '23505') { // unique violation
      return { error: 'Já existe um projeto com este slug/nome.' }
    }
    return { error: 'Erro ao criar projeto no banco de dados.' }
  }

  revalidatePath('/dashboard')
  return { id: data.id }
}
