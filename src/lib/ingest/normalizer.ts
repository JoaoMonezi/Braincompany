import type { NormalizedPost } from '@/lib/schemas/ingest'
import type { ProfileRules } from '@/lib/schemas/profile'

// ─── Normalizers por plataforma ─────────────────────────────

/** Instagram Scraper (apify/instagram-scraper) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeInstagram(item: any): NormalizedPost | null {
  if (!item?.id) return null
  return {
    external_id: String(item.id),
    content_url: item.url || (item.shortCode ? `https://instagram.com/p/${item.shortCode}` : undefined),
    thumbnail_url: item.displayUrl,
    caption: item.caption || '',
    post_type: item.type === 'Video' ? 'reel' : item.type === 'Sidecar' ? 'carousel' : 'image',
    published_at: item.timestamp ? new Date(item.timestamp).toISOString() : undefined,
    metrics: {
      views: item.videoViewCount ?? item.videoPlayCount ?? undefined,
      likes: item.likesCount ?? item.likesAndViewsCounts?.likes ?? undefined,
      comments: item.commentsCount ?? undefined,
      saves: item.savesCount ?? undefined,
      reach: item.reach ?? undefined,
    },
  }
}

/** TikTok Scraper — handles multiple Apify actor payload shapes */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeTikTok(item: any): NormalizedPost | null {
  if (!item?.id) return null

  // Caption: different actors use different field names
  const caption =
    item.text || item.desc || item.description || item.title || ''

  // Thumbnail: try every known field path
  const thumbnail_url =
    item.videoMeta?.coverUrl ||
    item.video?.cover ||
    item.video?.dynamicCover ||
    item.video?.originCover ||
    item.covers?.[0] ||
    item.cover ||
    item.thumbnail ||
    undefined

  // Content URL
  const content_url =
    item.webVideoUrl ||
    item.videoUrl ||
    item.url ||
    (item.id && item.authorMeta?.name
      ? `https://www.tiktok.com/@${item.authorMeta.name}/video/${item.id}`
      : undefined)

  // createTime can be a unix timestamp (number) or ISO string
  let published_at: string | undefined
  if (item.createTimeISO) {
    published_at = item.createTimeISO
  } else if (item.createTime) {
    const ts = typeof item.createTime === 'number'
      ? (item.createTime > 1e12 ? item.createTime : item.createTime * 1000)
      : undefined
    if (ts) published_at = new Date(ts).toISOString()
  }

  return {
    external_id: String(item.id),
    content_url,
    thumbnail_url,
    caption,
    post_type: item.isSlideshow ? 'carousel' : 'video',
    published_at,
    metrics: {
      views: item.playCount ?? item.statsV2?.playCount ?? item.videoMeta?.playCount ?? undefined,
      likes: item.diggCount ?? item.statsV2?.diggCount ?? item.likes ?? undefined,
      comments: item.commentCount ?? item.statsV2?.commentCount ?? item.comments ?? undefined,
      shares: item.shareCount ?? item.statsV2?.shareCount ?? item.shares ?? undefined,
      duration: item.video?.duration ?? item.videoMeta?.duration ?? undefined,
    },
  }
}

/** YouTube Scraper (streamers/youtube-scraper) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalizeYouTube(item: any): NormalizedPost | null {
  if (!item?.id) return null
  return {
    external_id: String(item.id),
    content_url: item.url || (item.id ? `https://youtube.com/watch?v=${item.id}` : undefined),
    thumbnail_url: item.thumbnails?.[0]?.url ?? item.bestThumbnail?.url,
    caption: item.title || item.description || '',
    post_type: item.isShort ? 'short' : 'video',
    published_at: item.publishedAt ?? item.date,
    metrics: {
      views: item.viewCount ?? undefined,
      likes: item.likes ?? item.likeCount ?? undefined,
      comments: item.commentsCount ?? item.commentCount ?? undefined,
      duration: item.duration ?? undefined,
    },
  }
}

export const normalizers = {
  instagram: normalizeInstagram,
  tiktok: normalizeTikTok,
  youtube: normalizeYouTube,
}

// ─── Filtros de regras de negócio ───────────────────────────

/**
 * Aplica as rules do perfil ao post normalizado.
 * Retorna true se o post deve ser coletado, false se deve ser ignorado.
 */
export function applyRules(post: NormalizedPost, rules: Partial<ProfileRules>): boolean {
  const caption = (post.caption ?? '').toLowerCase()
  const views = post.metrics.views ?? 0

  const minViews = rules.min_views ?? 0
  const includeHashtags = rules.include_hashtags ?? []
  const excludeHashtags = rules.exclude_hashtags ?? []
  const captionContains = rules.caption_contains ?? []
  const captionExcludes = rules.caption_excludes ?? []

  // min_views
  if (minViews > 0 && views < minViews) return false

  // include_hashtags — pelo menos uma deve estar presente
  if (includeHashtags.length > 0) {
    const hasIncluded = includeHashtags.some((tag) =>
      caption.includes(tag.toLowerCase().replace(/^#/, ''))
    )
    if (!hasIncluded) return false
  }

  // exclude_hashtags — se qualquer uma estiver presente, ignora
  if (excludeHashtags.length > 0) {
    const hasExcluded = excludeHashtags.some((tag) =>
      caption.includes(tag.toLowerCase().replace(/^#/, ''))
    )
    if (hasExcluded) return false
  }

  // caption_contains — todos os termos devem estar no caption
  if (captionContains.length > 0) {
    const hasAll = captionContains.every((term) =>
      caption.includes(term.toLowerCase())
    )
    if (!hasAll) return false
  }

  // caption_excludes — nenhum dos termos pode estar no caption
  if (captionExcludes.length > 0) {
    const hasAny = captionExcludes.some((term) =>
      caption.includes(term.toLowerCase())
    )
    if (hasAny) return false
  }

  return true
}
