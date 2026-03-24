import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/** Lista todos os profiles de um projeto */
export async function getProfilesByProject(projectId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`getProfilesByProject: ${error.message}`)
  return data
}

/** Cria um perfil (usa admin para bypassar RLS — a validação de autorização fica na API Route) */
export async function createProfile(profile: ProfileInsert) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()

  if (error) throw new Error(`createProfile: ${error.message}`)
  return data
}

/** Atualiza regras ou status de um perfil */
export async function updateProfile(id: string, update: ProfileUpdate) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`updateProfile: ${error.message}`)
  return data
}

/** Remove um perfil (e todos os posts via cascade) */
export async function deleteProfile(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw new Error(`deleteProfile: ${error.message}`)
}

/** Busca um perfil pelo ID */
export async function getProfileById(id: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`getProfileById: ${error.message}`)
  return data
}
