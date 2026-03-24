import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerScrape } from '@/lib/scraping'

export const dynamic = 'force-dynamic'

// Essa rota deve ser chamada pro um CRON (ex: GitHub Actions, Vercel Cron, ou externa)
// Deve ser protegida por um secret via header
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Busca todos os perfis ativos
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, platform, handle, rules')
    .eq('status', 'active')

  if (error || !profiles) {
    return NextResponse.json({ error: 'Erro ao buscar perfis' }, { status: 500 })
  }

  const results = []

  // Inicia o scraping de todos os perfis em paralelo (ou em batches dependendo do limite do Apify)
  // Como o triggerScrape não bloqueia (apenas agenda), podemos chamar em loop:
  for (const profile of profiles) {
    try {
      await triggerScrape(profile.id, profile.platform)
      results.push({ profileId: profile.id, status: 'scheduled' })
    } catch (err) {
      console.error(`[CRON] Erro ao agendar perfil ${profile.id}:`, err)
      
      // Update status to error
      await supabase
        .from('profiles')
        .update({
          status: 'error',
          last_error: err instanceof Error ? err.message : 'Unknown error during cron'
        })
        .eq('id', profile.id)

      results.push({ profileId: profile.id, status: 'error' })
    }
  }

  return NextResponse.json({
    message: `Cron executado. ${results.length} perfis processados.`,
    results
  })
}
