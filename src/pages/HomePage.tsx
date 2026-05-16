import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { BookOpen, Flame, Target, Clock, ChevronRight, Trophy } from 'lucide-react'

interface Stats {
  streak: number
  cardsToday: number
  totalMastered: number
  nextReviewCount: number
}

export default function HomePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ streak: 0, cardsToday: 0, totalMastered: 0, nextReviewCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date().toISOString().split('T')[0]
      const [streakRes, reviewRes, masteredRes] = await Promise.all([
        supabase.from('user_preferences').select('streak_days').eq('user_id', user.id).single(),
        supabase.from('user_card_progress').select('id', { count: 'exact' }).eq('user_id', user.id).lte('next_review', today),
        supabase.from('user_card_progress').select('id', { count: 'exact' }).eq('user_id', user.id).gte('interval_days', 21),
      ])

      setStats({
        streak: streakRes.data?.streak_days ?? 0,
        cardsToday: 0,
        totalMastered: masteredRes.count ?? 0,
        nextReviewCount: reviewRes.count ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const goToSetup = (mode: string, categoryFilter?: string) => {
    navigate('/study/setup', { state: { mode, categoryFilter } })
  }

  const studyModes = [
    { id: 'flashcard', icon: '🃏', label: 'Flashcards', desc: 'Repasa con tarjetas interactivas', color: 'bg-blue-50 border-blue-200', route: '' },
    { id: 'write', icon: '✍️', label: 'Escritura', desc: 'Escribe la respuesta sin ver opciones', color: 'bg-purple-50 border-purple-200', route: '' },
    { id: 'quiz', icon: '🎯', label: 'Quiz', desc: '4 opciones, cronometrado', color: 'bg-green-50 border-green-200', route: '' },
    { id: 'dictation', icon: '🎧', label: 'Dictado', desc: 'Escucha y escribe la traducción', color: 'bg-orange-50 border-orange-200', route: '' },
    { id: 'song', icon: '🎵', label: 'Canciones', desc: 'Práctica con canciones del libro', color: 'bg-pink-50 border-pink-200', route: '/songs' },
    { id: 'exam', icon: '📋', label: 'Examen', desc: 'Simulacro de examen completo', color: 'bg-red-50 border-red-200', route: '' },
  ]

  const quickModes = [
    {
      icon: '🔤', label: 'Verbos', desc: 'Practica todos los verbos del libro',
      color: 'bg-indigo-50 border-indigo-300',
      action: () => goToSetup('write', 'verbs'),
    },
    {
      icon: '⚡', label: 'Verbos Irregulares', desc: 'Conjuga y traduce verbos irregulares',
      color: 'bg-yellow-50 border-yellow-300',
      action: () => goToSetup('write', 'irregular_verbs'),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Flame className="text-orange-500" size={20} />, label: 'Racha', value: `${stats.streak} días` },
          { icon: <Target className="text-blue-500" size={20} />, label: 'Para repasar', value: stats.nextReviewCount },
          { icon: <Trophy className="text-yellow-500" size={20} />, label: 'Dominadas', value: stats.totalMastered },
          { icon: <Clock className="text-green-500" size={20} />, label: 'Hoy', value: `${stats.cardsToday} tarjetas` },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            {s.icon}
            <div>
              <div className="text-lg font-bold text-slate-900">{loading ? '—' : s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick study banner */}
      {stats.nextReviewCount > 0 && (
        <div
          onClick={() => navigate('/study/setup', { state: { mode: 'flashcard' } })}
          className="bg-blue-600 text-white rounded-xl p-5 flex items-center justify-between cursor-pointer hover:bg-blue-700 transition-colors"
        >
          <div>
            <p className="font-bold text-lg">¡Tienes {stats.nextReviewCount} tarjetas para repasar!</p>
            <p className="text-blue-200 text-sm">Mantén tu racha activa</p>
          </div>
          <ChevronRight size={24} />
        </div>
      )}

      {/* Quick verb modes */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">⚡ Acceso rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickModes.map(mode => (
            <button
              key={mode.label}
              onClick={mode.action}
              className={`${mode.color} border-2 rounded-xl p-4 text-left hover:shadow-md transition-shadow`}
            >
              <div className="text-2xl mb-2">{mode.icon}</div>
              <div className="font-bold text-slate-900 text-sm">{mode.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Study modes */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <BookOpen size={20} className="text-blue-500" /> Modos de estudio
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {studyModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => mode.route ? navigate(mode.route) : goToSetup(mode.id)}
              className={`${mode.color} border rounded-xl p-4 text-left hover:shadow-md transition-shadow`}
            >
              <div className="text-2xl mb-2">{mode.icon}</div>
              <div className="font-semibold text-slate-900 text-sm">{mode.label}</div>
              <div className="text-xs text-slate-500 mt-0.5">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
