import { useEffect, useState } from 'react'
import type { Flashcard, Quality } from '@/types'
import { Home, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  results: { cardId: string; quality: Quality; correct: boolean }[]
  cards: Flashcard[]
  onFinish: () => void
}

export default function ResultsView({ results, cards, onFinish }: Props) {
  const correct = results.filter(r => r.correct).length
  const total = results.length
  const pct = Math.round((correct / Math.max(total, 1)) * 100)

  const emoji = pct >= 90 ? '🏆' : pct >= 70 ? '🎉' : pct >= 50 ? '👍' : '💪'
  const msg = pct >= 90 ? '¡Excelente!' : pct >= 70 ? '¡Muy bien!' : pct >= 50 ? '¡Bien hecho!' : '¡Sigue practicando!'

  const [newStreak, setNewStreak] = useState<number | null>(null)
  const [streakIncreased, setStreakIncreased] = useState(false)

  useEffect(() => {
    const updateStreak = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('streak_days, last_study_date')
        .eq('user_id', user.id)
        .single()

      let streak = 1
      if (prefs) {
        if (prefs.last_study_date === today) {
          streak = prefs.streak_days ?? 1        // already studied today, keep
          setStreakIncreased(false)
        } else if (prefs.last_study_date === yesterday) {
          streak = (prefs.streak_days ?? 0) + 1  // extend streak
          setStreakIncreased(true)
        } else {
          streak = 1                              // reset
          setStreakIncreased(false)
        }
      } else {
        setStreakIncreased(true)
      }

      await supabase.from('user_preferences').upsert(
        { user_id: user.id, streak_days: streak, last_study_date: today, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      setNewStreak(streak)
    }

    updateStreak()
  }, [])

  const wrong = results
    .filter(r => !r.correct)
    .map(r => cards.find(c => c.id === r.cardId))
    .filter(Boolean) as Flashcard[]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center">
        <div className="text-6xl mb-3">{emoji}</div>
        <h1 className="text-3xl font-bold text-slate-900">{msg}</h1>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div>
            <div className="text-4xl font-bold text-blue-600">{pct}%</div>
            <div className="text-sm text-slate-500">Aciertos</div>
          </div>
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <div className="text-4xl font-bold text-green-600">{correct}</div>
            <div className="text-sm text-slate-500">Correctas</div>
          </div>
          <div className="h-12 w-px bg-slate-200" />
          <div>
            <div className="text-4xl font-bold text-red-400">{total - correct}</div>
            <div className="text-sm text-slate-500">A repasar</div>
          </div>
        </div>

        <div className="mt-6 h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Streak badge */}
      {newStreak !== null && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${streakIncreased ? 'bg-orange-50 border-2 border-orange-300' : 'bg-slate-50 border border-slate-200'}`}>
          <Flame size={28} className={streakIncreased ? 'text-orange-500' : 'text-slate-400'} />
          <div>
            <p className="font-bold text-slate-900">
              {streakIncreased ? `¡Racha aumentada! 🔥 ${newStreak} días` : `Racha: ${newStreak} días`}
            </p>
            <p className="text-xs text-slate-500">
              {streakIncreased ? '¡Sigue así! Vuelve mañana para mantenerla.' : 'Ya estudiaste hoy. ¡Bien hecho!'}
            </p>
          </div>
        </div>
      )}

      {/* Incorrect cards */}
      {wrong.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Para repasar ({wrong.length})</h2>
          <div className="space-y-2">
            {wrong.map(card => (
              <div key={card.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-sm font-medium text-slate-800">{card.front_es ?? card.front_en}</span>
                <span className="text-sm text-red-600 font-medium">{card.back_en ?? card.back_es}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onFinish}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <Home size={18} /> Inicio
        </button>
      </div>
    </div>
  )
}
