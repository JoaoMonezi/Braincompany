import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/lib/types/database'

type PostInsert = Database['public']['Tables']['post_metrics']['Insert']

/**
 * Upsert de um post (insert ou update baseado em profile_id + external_id).
 * Ignora posts com deleted_at preenchido (soft delete).
 */
export async function upsertPost(post: PostInsert) {
  const supabase = createAdminClient()

  // Checa soft delete antes de upsert
  const { data: existing } = await supabase
    .from('post_metrics')
    .select('id, deleted_at')
    .eq('profile_id', post.profile_id!)
    .eq('external_id', post.external_id!)
    .maybeSingle()

  if (existing?.deleted_at) {
    // Post foi soft-deleted pelo operador → nunca re-inserir
    return null
  }

  const { data, error } = await supabase
    .from('post_metrics')
    .upsert(post, { onConflict: 'profile_id,external_id' })
    .select()
    .single()

  if (error) throw new Error(`upsertPost: ${error.message}`)
  return data
}

/** Soft delete de um post */
export async function softDeletePost(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('post_metrics')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error(`softDeletePost: ${error.message}`)
}

/** Salva o payload bruto do scraper para reprocessamento futuro */
export async function saveRawResponse(
  profileId: string,
  source: string,
  payload: unknown
) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('raw_responses').insert({
    profile_id: profileId,
    source,
    payload: payload as Record<string, unknown>,
    processed: true,
  })

  if (error) throw new Error(`saveRawResponse: ${error.message}`)
}
