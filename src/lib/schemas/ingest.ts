import { z } from 'zod'

/** Schema do webhook do Apify para notificação de run concluído */
export const ApifyWebhookSchema = z.object({
  eventType: z.string(),
  eventData: z.object({
    actorId: z.string(),
    actorRunId: z.string(),
    datasetId: z.string().optional(),
    status: z.string(),
  }),
  resource: z
    .object({
      id: z.string(),
      actId: z.string(),
      status: z.string(),
      defaultDatasetId: z.string().optional(),
    })
    .optional(),
})

/** Schema normalizado de um post (saída do normalizer) */
export const NormalizedPostSchema = z.object({
  external_id: z.string(),
  content_url: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  caption: z.string().optional(),
  post_type: z.string().optional(),
  published_at: z.string().datetime().optional(),
  metrics: z.object({
    views: z.number().int().min(0).optional(),
    likes: z.number().int().min(0).optional(),
    comments: z.number().int().min(0).optional(),
    shares: z.number().int().min(0).optional(),
    saves: z.number().int().min(0).optional(),
    reach: z.number().int().min(0).optional(),
    duration: z.number().min(0).optional(),
  }),
})

export type ApifyWebhookPayload = z.infer<typeof ApifyWebhookSchema>
export type NormalizedPost = z.infer<typeof NormalizedPostSchema>
