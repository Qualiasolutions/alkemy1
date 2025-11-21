/**
 * Database types generated for Supabase
 *
 * This file defines the structure of your Supabase database tables.
 * It will be automatically generated once you create your tables in Supabase.
 * For now, we're defining the expected structure manually.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          script_content: string | null
          script_analysis: Json | null
          timeline_clips: Json | null
          moodboard_data: Json | null
          project_settings: Json | null
          is_public: boolean
          shared_with: string[] | null
          created_at: string
          updated_at: string
          last_accessed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          script_content?: string | null
          script_analysis?: Json | null
          timeline_clips?: Json | null
          moodboard_data?: Json | null
          project_settings?: Json | null
          is_public?: boolean
          shared_with?: string[] | null
          created_at?: string
          updated_at?: string
          last_accessed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          script_content?: string | null
          script_analysis?: Json | null
          timeline_clips?: Json | null
          moodboard_data?: Json | null
          project_settings?: Json | null
          is_public?: boolean
          shared_with?: string[] | null
          created_at?: string
          updated_at?: string
          last_accessed_at?: string
        }
      }
      media_assets: {
        Row: {
          id: string
          project_id: string
          user_id: string
          type: 'image' | 'video' | 'audio' | 'document'
          url: string
          file_name: string
          file_size: number
          mime_type: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          type: 'image' | 'video' | 'audio' | 'document'
          url: string
          file_name: string
          file_size: number
          mime_type: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          type?: 'image' | 'video' | 'audio' | 'document'
          url?: string
          file_name?: string
          file_size?: number
          mime_type?: string
          metadata?: Json | null
          created_at?: string
        }
      }
      usage_logs: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          action: string
          tokens_used: number | null
          cost_usd: number | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          action: string
          tokens_used?: number | null
          cost_usd?: number | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          action?: string
          tokens_used?: number | null
          cost_usd?: number | null
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      subscription_tier: 'free' | 'pro' | 'enterprise'
      media_type: 'image' | 'video' | 'audio' | 'document'
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]