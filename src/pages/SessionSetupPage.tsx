import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { planSession } from '@/lib/sm2'
import { Clock, ChevronRight } from 'lucide-react'
import type { StudyMode } from '@/types'

const TIME_OPTIONS = [5, 10, 20, 30, 45, 60]

const MODES: { id: StudyMode; label: string; icon: string }[] = [
  { id: 'flashcard', label: 'Flashcards', icon: '🃏' },
  { id: 'write',    label: 'Escritura',   icon: '✍️' },
  { id: 'quiz',     label: 'Quiz',        icon: '🎯' },
  { id: 'dictation',label: 'Dictado',     icon: '🎧' },
]

// ── Categorías principales ──────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',       icon: '📚', label: 'Todo',        desc: 'Mezcla inteligente de todo el contenido' },
  { id: 'vocab',     icon: '🔤', label: 'Vocabulario', desc: 'Palabras, verbos y expresiones' },
  { id: 'grammar',   icon: '📖', label: 'Gramática',   desc: 'Reglas y ejemplos del libro' },
  { id: 'exercises', icon: '✍️', label: 'Ejercicios',  desc: 'Traducción y conjugación' },
]

// ── Subcategorías de Vocabulario ────────────────────────────────────────────
const VOCAB_SUBCATS = [
  { label: 'Verbos',           topics: ['Verbs','Useful verbs','Vocabulary - verbs with D','Verbs group seventeen (17)','appear, back off, back up, collect, conduct'] },
  { label: 'Adjetivos',        topics: ['positive and negative adjectives','Los adjetivos (Adjectives)','Participio pasado afirmativo'] },
  { label: 'Partes del cuerpo',topics: ['body parts'] },
  { label: 'Hogar y Escuela',  topics: ['household','school supplies'] },
  { label: 'Geografía',        topics: ['geography'] },
  { label: 'Expresiones útiles',topics: ['Useful expressions','Useful e expressions','Pronombres indefinidos'] },
  { label: 'Vocabulario Mixto',topics: ['Vocabulario','Mixed vocabulary','Vocabulary thirteen (Vocabulario 13)','Vocabulary fifteen (Vocabulario quince)','Vocabulary sixteen (Vocabulario dieciseis)','Vocabulary seventeen','Vocabulary_nineteen (Vocobulario diecinueve)','Vocabulario dieciocho'] },
]

// ── Subcategorías de Gramática ──────────────────────────────────────────────
const GRAMMAR_SUBCATS = [
  { label: 'Preposiciones',    topics: ['Preposiciones','Prepositions'] },
  { label: 'Imperativos',      topics: ['Imperatives with Object Pronouns','Imperativo Tercer Caso'] },
  { label: 'Condicionales',    topics: ['Condiciones con el subjuntivo'] },
  { label: 'Adverbios',        topics: ['Adverbios','Adverbios de formación'] },
  { label: 'Comparativos',     topics: ['Comparativos Irregulares','Comparativos y superlativos','Grados de comparación de los adjetivos'] },
  { label: 'Voz Pasiva',       topics: ['Voz pasiva'] },
  { label: 'El Progresivo',    topics: ['El progresivo','Presente y pasado progresivo'] },
  { label: 'Pasado Simple',    topics: ['El pasado simple','Forma original Pasado afirmativo','Formation of the past negative','Pronunciación de la ED en el pasado'] },
  { label: 'Verbos copulativos',topics: ['Verbos copulativos (auxiliares)'] },
  { label: 'Pronombres reflexivos',topics: ['Pronombres reflexivos'] },
  { label: 'Tag Questions',    topics: ['Tag questions'] },
  { label: 'Conectores',       topics: ['Conectores','Connectives'] },
  { label: 'Verbos en -ar',    topics: ['Verbos regulares en -ar'] },
  { label: 'Plurales',         topics: ['Formación del plural en la tercera persona singular'] },
]

// ── Subcategorías de Ejercicios ─────────────────────────────────────────────
const EXERCISE_SUBCATS = [
  { label: 'Traducción general',  topics: ['Translate','Ejercicios de traducción','Translation Practice','Translate sentences'] },
  { label: 'Imperativos',         topics: ['Imperatives with Object Pronouns'] },
  { label: 'Conjugar y traducir', topics: ['Conjugate and Translate','Conjugate and translate only the affirmative','Conjugate and translate','Verb Conjugation'] },
  { label: 'Sonido del pasado -ED',topics: ['Translate and write the sound of the past tense in the bracket'] },
  { label: 'There be + Modal',    topics: ['THERE BE + MODAL','Exercises for there be + modal'] },
  { label: 'Pasado/Futuro',       topics: ['Pasado y futuro con "be + going to"'] },
  { label: 'Conectores',          topics: ['Connectives'] },
  { label: 'Ejercicios 1–25',     topics: ['Ejercicio 1','Ejercicio 11','Ejercicio 18','Ejercicio 25','Exercise nine (Ejercicio 9)','Exercise ten','Exercise 12','Exercise fourteen (Ejercicio 14)','Exercise sixteen','Exercise twenty-one'] },
  { label: 'Ejercicios 26–55',    topics: ['Exercise thirty-seven (Ejercicio 37)','Exercise forty-four (Ejercicio 44)','Ejercicio 45','Ejercicio 50','Ejercicio 52','Ejercicio 53'] },
  { label: 'Ejercicios 56–90',    topics: ['Exercise fifty-eight','Exercise sixty','Exercise sixty-one','Ejercicio 64','Ejercicio 66','Exercise seventy one','Exercise 79','Ejercicio 81','Ejercicio _ 88','Exercise eighty-nine'] },
  { label: 'Ejercicios 91+',      topics: ['Ejercicio 93','Exercise 94'] },
  { label: 'Lecturas',            topics: ["Bergode's Story",'Topsy on Wheels','The Story of Walt Disney and His Mouse','Reading test (Examen de lectura)','Reading test - Jairo and Fiscal the horse','Air pollution','Tooth Care Tips'] },
]

// card_type to use when category filter is active
const CATEGORY_CARD_TYPE: Record<string, string> = {
  vocab: 'word',
  grammar: 'example',
  exercises: 'exercise_item',
}

interface NavState { mode?: StudyMode; categoryFilter?: string }

export default function SessionSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navState = (location.state as NavState) ?? {}
  const initialMode = navState.mode ?? 'flashcard'
  const quickCategory = navState.categoryFilter  // 'verbs' | 'irregular_verbs'

  const [mode, setMode] = useState<StudyMode>(initialMode)
  const [minutes, setMinutes] = useState(20)
  const [category, setCategory] = useState<string>(quickCategory === 'verbs' || quickCategory === 'irregular_verbs' ? 'vocab' : 'all')
  const [selectedSubcats, setSelectedSubcats] = useState<string[]>(
    quickCategory === 'verbs' || quickCategory === 'irregular_verbs' ? ['Verbos'] : []
  )
  const [dueCount, setDueCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const today = new Date().toISOString().split('T')[0]
      const { count } = await supabase.from('user_card_progress')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .lte('next_review', today)
      setDueCount(count ?? 0)
    }
    load()
  }, [])

  const plan = planSession(minutes, dueCount)

  // Resolve the actual topics array from selected subcategory labels
  const getSubcatList = () => {
    if (category === 'vocab')     return VOCAB_SUBCATS
    if (category === 'grammar')   return GRAMMAR_SUBCATS
    if (category === 'exercises') return EXERCISE_SUBCATS
    return []
  }

  const resolvedTopics = (): string[] => {
    if (category === 'all' || selectedSubcats.length === 0) return []
    const subcatList = getSubcatList()
    return subcatList
      .filter(s => selectedSubcats.includes(s.label))
      .flatMap(s => s.topics)
  }

  const toggleSubcat = (label: string) => {
    setSelectedSubcats(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const start = () => {
    const topics = resolvedTopics()
    const cardTypeFilter = category !== 'all' ? CATEGORY_CARD_TYPE[category] : undefined
    navigate('/study', {
      state: { mode, minutes, selectedTopics: topics, cardTypeFilter, pageLimit: 157, plan },
    })
  }

  const subcatList = getSubcatList()

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">Configurar sesión</h1>

      {/* Tiempo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Clock size={18} className="text-blue-500" /> ¿Cuánto tiempo tienes?
        </h2>
        <div className="flex flex-wrap gap-2">
          {TIME_OPTIONS.map(t => (
            <button key={t} onClick={() => setMinutes(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${minutes === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
              {t} min
            </button>
          ))}
        </div>
        <div className="mt-4 bg-slate-50 rounded-lg p-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div><div className="font-bold text-blue-600">{plan.review.cards}</div><div className="text-slate-500 text-xs">Repaso ({plan.review.minutes}m)</div></div>
          <div><div className="font-bold text-green-600">{plan.new.cards}</div><div className="text-slate-500 text-xs">Nuevo ({plan.new.minutes}m)</div></div>
          <div><div className="font-bold text-purple-600">{plan.quiz.cards}</div><div className="text-slate-500 text-xs">Quiz ({plan.quiz.minutes}m)</div></div>
        </div>
      </div>

      {/* Modo */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-3">Modo de estudio</h2>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map(m => (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${mode === m.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <span className="text-xl">{m.icon}</span>
              <span className="font-medium text-sm text-slate-800">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">¿Qué quieres practicar?</h2>

        {/* Category tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {CATEGORIES.map(cat => (
            <button key={cat.id} onClick={() => { setCategory(cat.id); setSelectedSubcats([]) }}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                category === cat.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}>
              <div className="text-2xl mb-1">{cat.icon}</div>
              <div className="font-semibold text-xs text-slate-900">{cat.label}</div>
              <div className="text-xs text-slate-400 mt-0.5 hidden sm:block">{cat.desc}</div>
            </button>
          ))}
        </div>

        {/* Subcategory chips */}
        {category !== 'all' && subcatList.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">
              {selectedSubcats.length === 0 ? 'Estudiarás todo el contenido de esta categoría' : `${selectedSubcats.length} subtema${selectedSubcats.length > 1 ? 's' : ''} seleccionado${selectedSubcats.length > 1 ? 's' : ''}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {subcatList.map(sub => (
                <button key={sub.label} onClick={() => toggleSubcat(sub.label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedSubcats.includes(sub.label)
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}>
                  {sub.label}
                </button>
              ))}
            </div>
            {selectedSubcats.length > 0 && (
              <button onClick={() => setSelectedSubcats([])} className="text-xs text-slate-400 mt-2 underline">
                Limpiar selección
              </button>
            )}
          </div>
        )}
      </div>

      <button onClick={start}
        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors">
        Comenzar sesión <ChevronRight size={20} />
      </button>
    </div>
  )
}
