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
    const webhooks = this.buildWebhooks()
    let url = `${this.baseUrl}/acts/${actorId}/runs`
    
    if (webhooks) {
      const webhooksBase64 = Buffer.from(JSON.stringify(webhooks)).toString('base64')
      url += `?webhooks=${webhooksBase64}`
    }

    const res = await fetch(url, {
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

  private buildWebhooks() {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const secret = process.env.INGEST_WEBHOOK_SECRET

    if (!appUrl || appUrl.includes('localhost')) return undefined

    return [
      {
        eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED', 'ACTOR.RUN.ABORTED', 'ACTOR.RUN.TIMED_OUT'],
        requestUrl: `${appUrl}/api/ingest`,
        payloadTemplate: `{"eventType":"{{eventType}}","eventData":{{eventData}},"resource":{{resource}}}`,
        headersTemplate: secret ? `{ "x-webhook-secret": "${secret}" }` : undefined
      }
    ]
  }

  // Helpers to manage schedules
  async createSchedule(
    profileId: string,
    platform: 'instagram' | 'tiktok' | 'youtube',
    handle: string,
    rules: Record<string, unknown>,
    time: string // Format "HH:mm"
  ): Promise<string> {
    const actorId = ACTOR_IDS[platform]
    if (!actorId) throw new Error(`Actor ID não configurado para ${platform}`)

    const input = this.buildInput(platform, handle, rules)
    const [hour, minute] = time.split(':')
    const cronExpression = `${minute} ${hour} * * *`
    const webhooks = this.buildWebhooks()

    const res = await fetch(`${this.baseUrl}/schedules`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        name: `BC_Profile_${profileId}`,
        isEnabled: true,
        isExclusive: true,
        cronExpression,
        timezone: 'America/Sao_Paulo',
        actions: [
          {
            type: 'RUN_ACTOR',
            actorId,
            runInput: input,
            runOptions: {
              build: 'latest',
              memoryMbytes: Math.max(1024, 2048), // Algumas plataformas pedem +, YT e TT recomendam 2+
              webhooks
            }
          }
        ]
      })
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Apify createSchedule falhou: ${err}`)
    }

    const data = await res.json() as { data: { id: string } }
    return data.data.id
  }

  async updateSchedule(
    scheduleId: string,
    platform: 'instagram' | 'tiktok' | 'youtube',
    handle: string,
    rules: Record<string, unknown>,
    time: string,
    isEnabled: boolean = true
  ): Promise<void> {
    const actorId = ACTOR_IDS[platform]
    if (!actorId) throw new Error(`Actor ID não configurado para ${platform}`)

    const input = this.buildInput(platform, handle, rules)
    const [hour, minute] = time.split(':')
    const cronExpression = `${minute} ${hour} * * *`
    const webhooks = this.buildWebhooks()

    const res = await fetch(`${this.baseUrl}/schedules/${scheduleId}`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify({
        isEnabled,
        cronExpression,
        timezone: 'America/Sao_Paulo',
        actions: [
          {
            type: 'RUN_ACTOR',
            actorId,
            runInput: input,
            runOptions: {
              build: 'latest',
              memoryMbytes: 1024,
              webhooks
            }
          }
        ]
      })
    })

    if (!res.ok) throw new Error(`Apify updateSchedule falhou: ${await res.text()}`)
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/schedules/${scheduleId}`, {
      method: 'DELETE',
      headers: this.headers()
    })
    if (!res.ok) throw new Error(`Apify deleteSchedule falhou: ${await res.text()}`)
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
