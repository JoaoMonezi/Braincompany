import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { softDeletePost } from '@/lib/db/posts'
import { createAdminClient } from '@/lib/supabase/admin'

type Context = { params: Promise<{ id: string }> }

/** DELETE /api/posts/[id] — soft delete (mantém no DB, some da UI) */
export async function DELETE(_req: NextRequest, { params }: Context) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Verificar se o post pertence a um projeto do operator
    const admin = createAdminClient()
    const { data: post } = await admin
      .from('post_metrics')
      .select('profile_id, profiles!inner(project_id)')
      .eq('id', id)
      .single()

    if (!post) return Response.json({ error: 'Post não encontrado' }, { status: 404 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectId = (post.profiles as any).project_id
    const { data: isOperator } = await supabase.rpc('is_project_operator', { p_project_id: projectId })
    if (!isOperator) return Response.json({ error: 'Forbidden' }, { status: 403 })

    await softDeletePost(id)
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[posts DELETE]', error)
    return Response.json({ error: 'Erro ao deletar post' }, { status: 500 })
  }
}
