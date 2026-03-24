export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      client_users: {
        Row: { created_at: string | null; id: string; project_id: string; user_id: string }
        Insert: { created_at?: string | null; id?: string; project_id: string; user_id: string }
        Update: { created_at?: string | null; id?: string; project_id?: string; user_id?: string }
        Relationships: []
      }
      invites: {
        Row: { accepted_at: string | null; created_at: string | null; created_by: string; email: string; expires_at: string | null; id: string; project_id: string; token: string }
        Insert: { accepted_at?: string | null; created_at?: string | null; created_by: string; email: string; expires_at?: string | null; id?: string; project_id: string; token?: string }
        Update: { accepted_at?: string | null; created_at?: string | null; created_by?: string; email?: string; expires_at?: string | null; id?: string; project_id?: string; token?: string }
        Relationships: []
      }
      post_metrics: {
        Row: { caption: string | null; collected_at: string; content_url: string | null; deleted_at: string | null; external_id: string; id: string; metrics: Json; post_type: string | null; profile_id: string; published_at: string | null; thumbnail_url: string | null }
        Insert: { caption?: string | null; collected_at?: string; content_url?: string | null; deleted_at?: string | null; external_id: string; id?: string; metrics?: Json; post_type?: string | null; profile_id: string; published_at?: string | null; thumbnail_url?: string | null }
        Update: { caption?: string | null; collected_at?: string; content_url?: string | null; deleted_at?: string | null; external_id?: string; id?: string; metrics?: Json; post_type?: string | null; profile_id?: string; published_at?: string | null; thumbnail_url?: string | null }
        Relationships: []
      }
      profiles: {
        Row: { avatar_url: string | null; created_at: string | null; display_name: string | null; error_msg: string | null; handle: string; id: string; platform: string; project_id: string; rules: Json; status: string; updated_at: string | null }
        Insert: { avatar_url?: string | null; created_at?: string | null; display_name?: string | null; error_msg?: string | null; handle: string; id?: string; platform: string; project_id: string; rules?: Json; status?: string; updated_at?: string | null }
        Update: { avatar_url?: string | null; created_at?: string | null; display_name?: string | null; error_msg?: string | null; handle?: string; id?: string; platform?: string; project_id?: string; rules?: Json; status?: string; updated_at?: string | null }
        Relationships: []
      }
      projects: {
        Row: { brand_color: string; created_at: string | null; id: string; logo_url: string | null; name: string; operator_id: string; slug: string; updated_at: string | null }
        Insert: { brand_color?: string; created_at?: string | null; id?: string; logo_url?: string | null; name: string; operator_id: string; slug: string; updated_at?: string | null }
        Update: { brand_color?: string; created_at?: string | null; id?: string; logo_url?: string | null; name?: string; operator_id?: string; slug?: string; updated_at?: string | null }
        Relationships: []
      }
      raw_responses: {
        Row: { created_at: string | null; error_msg: string | null; id: string; payload: Json; processed: boolean; profile_id: string | null; source: string }
        Insert: { created_at?: string | null; error_msg?: string | null; id?: string; payload: Json; processed?: boolean; profile_id?: string | null; source?: string }
        Update: { created_at?: string | null; error_msg?: string | null; id?: string; payload?: Json; processed?: boolean; profile_id?: string | null; source?: string }
        Relationships: []
      }
      scraping_jobs: {
        Row: { created_at: string | null; error_msg: string | null; finished_at: string | null; id: string; posts_collected: number | null; profile_id: string; provider: string; provider_job_id: string | null; scheduled_for: string | null; started_at: string | null; status: string }
        Insert: { created_at?: string | null; error_msg?: string | null; finished_at?: string | null; id?: string; posts_collected?: number | null; profile_id: string; provider?: string; provider_job_id?: string | null; scheduled_for?: string | null; started_at?: string | null; status?: string }
        Update: { created_at?: string | null; error_msg?: string | null; finished_at?: string | null; id?: string; posts_collected?: number | null; profile_id?: string; provider?: string; provider_job_id?: string | null; scheduled_for?: string | null; started_at?: string | null; status?: string }
        Relationships: []
      }
      user_roles: {
        Row: { created_at: string | null; id: string; is_super_admin: boolean | null; role: string; user_id: string }
        Insert: { created_at?: string | null; id?: string; is_super_admin?: boolean | null; role?: string; user_id: string }
        Update: { created_at?: string | null; id?: string; is_super_admin?: boolean | null; role?: string; user_id?: string }
        Relationships: []
      }
    }
    Views: {
      active_posts: { Row: { caption: string | null; collected_at: string | null; content_url: string | null; deleted_at: string | null; external_id: string | null; handle: string | null; id: string | null; metrics: Json | null; platform: string | null; post_type: string | null; profile_id: string | null; project_id: string | null; project_name: string | null; project_slug: string | null; published_at: string | null; thumbnail_url: string | null }; Relationships: [] }
      profile_summary: { Row: { handle: string | null; last_collected_at: string | null; platform: string | null; profile_id: string | null; project_id: string | null; status: string | null; total_comments: number | null; total_likes: number | null; total_posts: number | null; total_views: number | null }; Relationships: [] }
    }
    Functions: {
      get_my_role: { Args: Record<PropertyKey, never>; Returns: string }
      has_project_access: { Args: { p_project_id: string }; Returns: boolean }
      is_project_operator: { Args: { p_project_id: string }; Returns: boolean }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
