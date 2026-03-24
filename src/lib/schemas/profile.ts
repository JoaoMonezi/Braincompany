import { z } from 'zod'

export const ProfileRulesSchema = z.object({
  include_hashtags: z.array(z.string()).default([]),
  exclude_hashtags: z.array(z.string()).default([]),
  caption_contains: z.array(z.string()).default([]),
  caption_excludes: z.array(z.string()).default([]),
  min_views: z.number().int().min(0).default(0),
})

export const CreateProfileSchema = z.object({
  project_id: z.string().uuid(),
  platform: z.enum(['instagram', 'tiktok', 'youtube']),
  handle: z.string().min(1).max(100).transform((h) => h.replace(/^@/, '')),
  display_name: z.string().max(200).optional(),
  rules: ProfileRulesSchema.default(() => ({
    include_hashtags: [],
    exclude_hashtags: [],
    caption_contains: [],
    caption_excludes: [],
    min_views: 0,
  })),
})

export const UpdateProfileSchema = z.object({
  handle: z.string().min(1).max(100).optional(),
  display_name: z.string().max(200).optional(),
  status: z.enum(['active', 'paused', 'error']).optional(),
  rules: ProfileRulesSchema.optional(),
})

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>
export type ProfileRules = z.infer<typeof ProfileRulesSchema>
