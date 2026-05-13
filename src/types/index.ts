export interface Flashcard {
  id: string
  card_type: 'word' | 'phrase' | 'rule' | 'example' | 'exercise_item'
  front_en: string | null
  front_es: string | null
  back_en: string | null
  back_es: string | null
  extra: Record<string, unknown> | null
  topic: string | null
  category: string | null
  page_number: number | null
}

export interface CardProgress {
  flashcard_id: string
  level: 1 | 2 | 3
  ease_factor: number
  interval_days: number
  repetitions: number
  next_review: string
  times_correct: number
  times_wrong: number
}

export interface StudySession {
  mode: 'flashcard' | 'write' | 'quiz' | 'dictation' | 'song' | 'exam'
  topicsSelected: string[]
  pagesRange?: [number, number]
  durationMinutes: number
}

export interface BookContent {
  id: string
  page_number: number | null
  type: string
  topic: string | null
  topic_es: string | null
  category: string | null
  group_number: number | null
  content: Record<string, unknown>
}

export interface UserPreferences {
  daily_goal_minutes: number
  preferred_mode: string
  show_spanish_first: boolean
  audio_enabled: boolean
  current_page: number
  streak_days: number
}

export type StudyMode = 'flashcard' | 'write' | 'quiz' | 'dictation' | 'song' | 'exam'
export type Quality = 0 | 1 | 2 | 3 | 4 | 5
