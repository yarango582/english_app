import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(url, key)

export type Database = {
  public: {
    Tables: {
      book_content: {
        Row: {
          id: string
          page_number: number | null
          type: string
          topic: string | null
          topic_es: string | null
          category: string | null
          group_number: number | null
          content: Record<string, unknown>
          source_file: string | null
          created_at: string
        }
      }
      flashcards: {
        Row: {
          id: string
          book_content_id: string | null
          card_type: string
          front_en: string | null
          front_es: string | null
          back_en: string | null
          back_es: string | null
          extra: Record<string, unknown> | null
          topic: string | null
          category: string | null
          page_number: number | null
          created_at: string
        }
      }
      user_card_progress: {
        Row: {
          id: string
          user_id: string
          flashcard_id: string
          level: number
          ease_factor: number
          interval_days: number
          repetitions: number
          next_review: string
          last_reviewed: string | null
          times_correct: number
          times_wrong: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_card_progress']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['user_card_progress']['Insert']>
      }
      user_preferences: {
        Row: {
          user_id: string
          daily_goal_minutes: number
          preferred_mode: string
          show_spanish_first: boolean
          audio_enabled: boolean
          current_page: number
          notification_enabled: boolean
          streak_days: number
          last_study_date: string | null
          created_at: string
          updated_at: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          started_at: string
          ended_at: string | null
          duration_minutes: number | null
          mode: string | null
          topics_studied: string[] | null
          pages_range: number[] | null
          cards_reviewed: number
          cards_correct: number
          score_percent: number | null
          created_at: string
        }
      }
      study_streak: {
        Row: {
          id: string
          user_id: string
          study_date: string
          minutes: number
          cards: number
        }
      }
    }
  }
}
