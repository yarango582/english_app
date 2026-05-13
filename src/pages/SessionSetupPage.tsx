import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { planSession } from '@/lib/sm2'
import { Clock, BookOpen, ChevronRight } from 'lucide-react'
import type { StudyMode } from '@/types'

const TIME_OPTIONS = [10, 20, 30, 45, 60]
const MODES: { id: StudyMode; label: string; icon: string }[] = [
  { id: 'flashcard', label: 'Flashcards', icon: '🃏' },
  { id: 'write', label: 'Escritura', icon: '✍️' },
  { id: 'quiz', label: 'Quiz', icon: '🎯' },
  { id: 'dictation', label: 'Dictado', icon: '🎧' },
]

export default function SessionSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const initialMode = (location.state as { mode?: StudyMode })?.mode ?? 'flashcard'

  const [mode, setMode] = useState<StudyMode>(initialMode)
  const [minutes, setMinutes] = useState(20)
  const [topics, setTopics] = useState<string[]>([])
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [pageLimit, setPageLimit] = useState(157)
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const [topicsRes, dueRes] = await Promise.all([
        supabase.from('flashcards').select('topic').not('topic', 'is', null),
        supabase.from('user_card_progress').select('id', { count: 'exact' }).eq('user_id', user.id).lte('next_review', today),
      ])
      const uniqueTopics = [...new Set((topicsRes.data ?? []).map((r: { topic: string | null }) => r.topic).filter(Boolean))] as string[]
      setTopics(uniqueTopics)
      setDueCount(dueRes.count ?? 0)
    }
    load()
  }, [])

  const plan = planSession(minutes, dueCount)

  const start = () => {
    navigate('/study', {
      state: { mode, minutes, selectedTopics, pageLimit, plan },
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Configurar sesión</h1>

      {/* Tiempo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Clock size={18} className="text-blue-500" /> ¿Cuánto tiempo tienes?
        </h2>
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => setMinutes(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                minutes === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t} min
            </button>
          ))}
        </div>

        {/* Plan preview */}
        <div className="mt-4 bg-slate-50 rounded-lg p-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <div className="font-bold text-blue-600">{plan.review.cards}</div>
            <div className="text-slate-500 text-xs">Repaso ({plan.review.minutes}m)</div>
          </div>
          <div>
            <div className="font-bold text-green-600">{plan.new.cards}</div>
            <div className="text-slate-500 text-xs">Nuevo ({plan.new.minutes}m)</div>
          </div>
          <div>
            <div className="font-bold text-purple-600">{plan.quiz.cards}</div>
            <div className="text-slate-500 text-xs">Quiz ({plan.quiz.minutes}m)</div>
          </div>
        </div>
      </div>

      {/* Modo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Modo de estudio principal</h2>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                mode === m.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl">{m.icon}</span>
              <span className="font-medium text-sm text-slate-800">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hasta qué página */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <BookOpen size={18} className="text-blue-500" /> Contenido hasta la página
        </h2>
        <input
          type="range"
          min={1}
          max={157}
          value={pageLimit}
          onChange={e => setPageLimit(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-slate-500 mt-1">
          <span>Pág. 1</span>
          <span className="font-semibold text-blue-600">Hasta pág. {pageLimit}</span>
          <span>Pág. 157</span>
        </div>
      </div>

      {/* Temas */}
      {topics.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Temas específicos (opcional)</h2>
          <div className="flex flex-wrap gap-2">
            {topics.slice(0, 20).map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopics(prev =>
                  prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
                )}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTopics.includes(topic)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
          {selectedTopics.length > 0 && (
            <button onClick={() => setSelectedTopics([])} className="text-xs text-slate-500 mt-2 underline">
              Limpiar selección
            </button>
          )}
        </div>
      )}

      <button
        onClick={start}
        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
      >
        Comenzar sesión <ChevronRight size={20} />
      </button>
    </div>
  )
}
