import { useState, useRef, useEffect } from 'react'
import type { Flashcard, Quality } from '@/types'
import { Headphones, Volume2, Send } from 'lucide-react'

interface Props {
  card: Flashcard
  onAnswer: (quality: Quality) => void
}

interface Feedback {
  correct: boolean
  correctAnswer: string
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/[¡!¿?.,:;]/g, '').replace(/\s+/g, ' ').trim()
}

export default function DictationView({ card, onAnswer }: Props) {
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [playing, setPlaying] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Play the question side (what to listen to)
  const playText = card.front_es ?? card.front_en ?? '—'
  const playLang = card.front_es ? 'es-ES' : 'en-US'
  // The expected written answer
  const correctAnswer = card.back_en ?? card.back_es ?? '—'

  const playAudio = () => {
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(playText)
    utterance.lang = playLang
    utterance.rate = 0.85
    utterance.onstart = () => setPlaying(true)
    utterance.onend = () => { setPlaying(false); inputRef.current?.focus() }
    speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const timer = setTimeout(playAudio, 300)
    return () => { clearTimeout(timer); speechSynthesis.cancel() }
  }, [card.id])

  const submit = () => {
    if (!input.trim() || feedback) return
    const alternatives = correctAnswer.split('/').map(s => s.trim()).filter(Boolean)
    const normUser = normalize(input)
    const correct = alternatives.some(alt => normalize(alt) === normUser)
    setFeedback({ correct, correctAnswer })
  }

  const next = () => {
    onAnswer(feedback?.correct ? 4 : 1)
    setInput('')
    setFeedback(null)
  }

  return (
    <div className="space-y-6">
      {/* Listen card - shows nothing about the answer */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8 text-center">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-6">
          Escucha y escribe la traducción
        </p>

        <button
          onClick={playAudio}
          className={`mx-auto flex items-center justify-center w-28 h-28 rounded-full transition-all shadow-lg ${
            playing
              ? 'bg-blue-500 text-white scale-110 shadow-blue-300 ring-4 ring-blue-200'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-105'
          }`}
        >
          {playing
            ? <Volume2 size={40} className="animate-pulse" />
            : <Headphones size={40} />}
        </button>

        <p className="mt-4 text-sm text-slate-400 italic">
          {playing ? 'Reproduciendo...' : 'Toca para escuchar de nuevo'}
        </p>

        {card.topic && (
          <div className="mt-5">
            <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{card.topic}</span>
          </div>
        )}
      </div>

      {/* Input */}
      {!feedback ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 text-center">
            {card.front_es ? '¿Cómo se dice en inglés?' : '¿Cómo se dice en español?'}
          </p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Escribe la traducción..."
              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={submit}
              disabled={!input.trim()}
              className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className={`rounded-2xl p-6 ${feedback.correct ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{feedback.correct ? '✅' : '❌'}</span>
            <span className="font-bold text-lg">{feedback.correct ? '¡Correcto!' : 'Incorrecto'}</span>
          </div>
          <p className="text-sm text-slate-500 mb-1">Escuchaste: <em>"{playText}"</em></p>
          <p className="text-sm text-slate-600">Tu respuesta: <span className={`font-medium ${feedback.correct ? 'text-green-700' : 'text-red-600'}`}>{input}</span></p>
          {!feedback.correct && (
            <p className="text-sm text-slate-600 mt-1">
              Respuesta: <span className="font-bold text-green-700">{feedback.correctAnswer}</span>
            </p>
          )}
          <button onClick={next} className="mt-4 w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors">
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
