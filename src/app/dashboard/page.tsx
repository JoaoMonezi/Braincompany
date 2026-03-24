import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div style={{ padding: 32, color: 'var(--text-primary)' }}>
      <h1 style={{ fontSize: 22, fontWeight: 600 }}>Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
        Bem-vindo, {user.email}
      </p>
    </div>
  )
}
