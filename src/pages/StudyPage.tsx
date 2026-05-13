import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { sm2 } from '@/lib/sm2'
import type { Flashcard, CardProgress, StudyMode, Quality } from '@/types'
import FlashcardView from '@/components/flashcard/FlashcardView'
import WriteView from '@/components/flashcard/WriteView'
import QuizView from '@/components/quiz/QuizView'
import ResultsView from '@/components/session/ResultsView'

interface SessionState {
  mode: StudyMode
  minutes: number
  selectedTopics: string[]
  pageLimit: number
  plan: { review: { cards: number }; new: { cards: number }; quiz: { cards: number } }
}

export default function StudyPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = location.state as SessionState

  const [cards, setCards] = useState<Flashcard[]>([])
  const [progress, setProgress] = useState<Record<string, CardProgress>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [results, setResults] = useState<{ cardId: string; quality: Quality; correct: boolean }[]>([])
  const [loading, setLoading] = useState(true)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!session) { navigate('/'); return }
    loadCards()
  }, [])

  const loadCards = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    const totalCards = session.plan.review.cards + session.plan.new.cards

    let query = supabase.from('flashcards').select('*').limit(totalCards)
    if (session.pageLimit < 157) query = query.lte('page_number', session.pageLimit)
    if (session.selectedTopics.length > 0) query = query.in('topic', session.selectedTopics)

    const { data: flashcards } = await query
    const { data: progressData } = await supabase
      .from('user_card_progress')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review', today)

    const progressMap: Record<string, CardProgress> = {}
    for (const p of progressData ?? []) progressMap[p.flashcard_id] = p

    // Mezclar: primero vencidas, luego nuevas
    const due = (flashcards ?? []).filter((c: Flashcard) => progressMap[c.id])
    const fresh = (flashcards ?? []).filter((c: Flashcard) => !progressMap[c.id])
    setCards([...due, ...fresh].slice(0, totalCards))
    setProgress(progressMap)
    setLoading(false)
  }

  const handleAnswer = useCallback(async (quality: Quality) => {
    const card = cards[currentIndex]
    if (!card) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const existing = progress[card.id]
    const sm2Input = existing
      ? { ease_factor: existing.ease_factor, interval_days: existing.interval_days, repetitions: existing.repetitions }
      : { ease_factor: 2.5, interval_days: 1, repetitions: 0 }

    const sm2Result = sm2(sm2Input, quality)
    const correct = quality >= 3

    const update = {
      user_id: user.id,
      flashcard_id: card.id,
      level: Math.min(3, (existing?.level ?? 1) + (correct ? 0 : 0)) as 1 | 2 | 3,
      ease_factor: sm2Result.ease_factor,
      interval_days: sm2Result.interval_days,
      repetitions: sm2Result.repetitions,
      next_review: sm2Result.next_review.toISOString().split('T')[0],
      last_reviewed: new Date().toISOString(),
      times_correct: (existing?.times_correct ?? 0) + (correct ? 1 : 0),
      times_wrong: (existing?.times_wrong ?? 0) + (correct ? 0 : 1),
    }

    await supabase.from('user_card_progress').upsert(update, { onConflict: 'user_id,flashcard_id' })
    setResults(prev => [...prev, { cardId: card.id, quality, correct }])

    if (currentIndex + 1 >= cards.length) setDone(true)
    else setCurrentIndex(i => i + 1)
  }, [cards, currentIndex, progress])

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
    </div>
  )

  if (done) return <ResultsView results={results} cards={cards} onFinish={() => navigate('/')} />
  if (!cards.length) return (
    <div className="text-center py-20">
      <p className="text-xl text-slate-500">No hay tarjetas para repasar con estos filtros.</p>
      <button onClick={() => navigate('/study/setup')} className="mt-4 text-blue-600 underline">Volver</button>
    </div>
  )

  const card = cards[currentIndex]
  const cardProgress = progress[card.id]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-slate-500 mb-1">
          <span>{currentIndex + 1} / {cards.length}</span>
          <span>{results.filter(r => r.correct).length} correctas</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${((currentIndex) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {session.mode === 'flashcard' && (
        <FlashcardView card={card} progress={cardProgress} onAnswer={handleAnswer} />
      )}
      {session.mode === 'write' && (
        <WriteView card={card} onAnswer={handleAnswer} />
      )}
      {session.mode === 'quiz' && (
        <QuizView card={card} allCards={cards} onAnswer={handleAnswer} />
      )}
    </div>
  )
}
