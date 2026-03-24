// lib/scraping/types.ts
// O resto do app NUNCA fala diretamente com o Apify.
// Fala sempre com esta interface.

export interface ScrapingAdapter {
  /**
   * Agenda um run no provider e retorna o provider_job_id.
   */
  scheduleRun(
    profileId: string,
    platform: 'instagram' | 'tiktok' | 'youtube',
    handle: string,
    rules: Record<string, unknown>
  ): Promise<string>

  /**
   * Cancela um run em andamento.
   */
  cancelRun(providerJobId: string): Promise<void>

  /**
   * Retorna o status atual de um run.
   */
  getRunStatus(providerJobId: string): Promise<'running' | 'done' | 'failed'>
}
