import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // TODO: detectar role e redirecionar
  // operator → /dashboard
  // client   → /c/[projectSlug]
  redirect('/dashboard')
}
