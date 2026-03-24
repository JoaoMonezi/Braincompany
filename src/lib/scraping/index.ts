import { ApifyAdapter } from './apify-adapter'
import type { ScrapingAdapter } from './types'

// Para trocar de provider: basta mudar esta linha ☝️
let _scraper: ScrapingAdapter | null = null

export function getScraper(): ScrapingAdapter {
  if (!_scraper) _scraper = new ApifyAdapter()
  return _scraper
}

/** Shorthand: dispara scraping e retorna o provider_job_id */
export async function triggerScrape(
  platform: 'instagram' | 'tiktok' | 'youtube',
  handle: string,
  profileId = '',
  rules: Record<string, unknown> = {}
): Promise<string> {
  return getScraper().scheduleRun(profileId, platform, handle, rules)
}

export type { ScrapingAdapter }
