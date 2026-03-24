import type { ScrapingAdapter } from './types'

// Actor IDs dos scrapers no Apify (configurar no .env.local)
const ACTOR_IDS: Record<string, string> = {
  instagram: process.env.APIFY_INSTAGRAM_ACTOR_ID ?? '',
  tiktok: process.env.APIFY_TIKTOK_ACTOR_ID ?? '',
  youtube: process.env.APIFY_YOUTUBE_ACTOR_ID ?? '',
}

export class ApifyAdapter implements ScrapingAdapter {
  private readonly token: string
  private readonly baseUrl = 'https://api.apify.com/v2'

  constructor() {
    this.token = process.env.APIFY_API_TOKEN ?? ''
    if (!this.token) throw new Error('APIFY_API_TOKEN não configurado')
  }

  private headers() {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.token}`,
    }
  }

  async scheduleRun(
    _profileId: string,
    platform: 'instagram' | 'tiktok' | 'youtube',
    handle: string,
    rules: Record<string, unknown>
  ): Promise<string> {
    const actorId = ACTOR_IDS[platform]
    if (!actorId) throw new Error(`Actor ID não configurado para ${platform}`)

    const input = this.buildInput(platform, handle, rules)

    const res = await fetch(`${this.baseUrl}/acts/${actorId}/runs`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Apify scheduleRun falhou: ${err}`)
    }

    const data = (await res.json()) as { data: { id: string } }
    return data.data.id
  }

  async cancelRun(providerJobId: string): Promise<void> {
    const res = await fetch(
      `${this.baseUrl}/actor-runs/${providerJobId}/abort`,
      { method: 'POST', headers: this.headers() }
    )
    if (!res.ok) throw new Error(`Apify cancelRun falhou: ${providerJobId}`)
  }

  async getRunStatus(
    providerJobId: string
  ): Promise<'running' | 'done' | 'failed'> {
    const res = await fetch(`${this.baseUrl}/actor-runs/${providerJobId}`, {
      headers: this.headers(),
    })
    if (!res.ok) throw new Error(`Apify getRunStatus falhou: ${providerJobId}`)

    const data = (await res.json()) as {
      data: { status: string }
    }
    const status = data.data.status

    if (['SUCCEEDED', 'FINISHED'].includes(status)) return 'done'
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(status)) return 'failed'
    return 'running'
  }

  private buildInput(
    platform: string,
    handle: string,
    _rules: Record<string, unknown>
  ): Record<string, unknown> {
    switch (platform) {
      case 'instagram':
        return { usernames: [handle], resultsLimit: 50 }
      case 'tiktok':
        return { profiles: [`@${handle}`], resultsPerPage: 50 }
      case 'youtube':
        return { channelHandles: [handle], maxResultsShorts: 50 }
      default:
        return {}
    }
  }
}
