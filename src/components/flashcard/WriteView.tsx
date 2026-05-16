import { useState, useRef, useEffect } from 'react'
import type { Flashcard, Quality } from '@/types'
import { checkAnswer } from '@/lib/gemini'
import { Send, Volume2 } from 'lucide-react'

interface Props {
  card: Flashcard
  onAnswer: (quality: Quality, userAnswer?: string) => void
}

interface Feedback {
  correct: boolean
  feedback: string
  score: number
  correctAnswer: string
}

export default function WriteView({ card, onAnswer }: Props) {
  const [input, setInput] = useState('')
  const [checking, setChecking] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const question = card.front_es ?? card.front_en ?? '—'
  const correctAnswer = card.back_en ?? card.back_es ?? '—'
  const questionLang = card.front_es ? 'Traduce al inglés' : 'Traduce al español'

  const submit = async () => {
    if (!input.trim() || checking) return
    setChecking(true)
    try {
      const result = await checkAnswer(question, input.trim(), correctAnswer, card.topic ?? '')
      setFeedback({ ...result, correctAnswer })
    } catch {
      const correct = input.trim().toLowerCase() === correctAnswer.toLowerCase()
      setFeedback({ correct, feedback: correct ? '¡Correcto!' : `Respuesta: ${correctAnswer}`, score: correct ? 4 : 1, correctAnswer })
    }
    setChecking(false)
  }

  const next = () => {
    onAnswer((feedback?.score ?? 0) as Quality, input)
    setInput('')
    setFeedback(null)
  }

  const speak = (text: string, lang: 'en-US' | 'es-ES') => {
    speechSynthesis.cancel()
    speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { lang }))
  }

  // Auto-play question audio once when card changes
  useEffect(() => {
    speak(question, card.front_es ? 'es-ES' : 'en-US')
    return () => speechSynthesis.cancel()
  }, [card.id])

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{questionLang}</p>
        <div className="flex items-center justify-between">
          <p className="text-3xl font-semibold text-slate-900">{question}</p>
          <button
            onClick={() => speak(question, card.front_es ? 'es-ES' : 'en-US')}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
          >
            <Volume2 size={20} />
          </button>
        </div>
        {card.topic && (
          <span className="mt-4 inline-block text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{card.topic}</span>
        )}
      </div>

      {/* Input */}
      {!feedback ? (
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Escribe tu respuesta aquí..."
            className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:outline-none focus:border-blue-500"
            autoFocus
            disabled={checking}
          />
          <button
            onClick={submit}
            disabled={!input.trim() || checking}
            className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            {checking ? '...' : <Send size={20} />}
          </button>
        </div>
      ) : (
        <div className={`rounded-2xl p-6 ${feedback.correct ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{feedback.correct ? '✅' : '❌'}</span>
            <span className="font-bold text-lg">{feedback.correct ? '¡Correcto!' : 'Incorrecto'}</span>
          </div>
          {!feedback.correct && (
            <div className="mt-2">
              <p className="text-sm text-slate-600">Tu respuesta: <span className="font-medium text-red-600">{input}</span></p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-sm text-slate-600">Respuesta correcta: <span className="font-bold text-green-700">{feedback.correctAnswer}</span></p>
                <button onClick={() => speak(feedback.correctAnswer, 'en-US')} className="text-slate-400 hover:text-slate-700">
                  <Volume2 size={16} />
                </button>
              </div>
            </div>
          )}
          <p className="text-sm text-slate-600 mt-2 italic">{feedback.feedback}</p>
          <button
            onClick={next}
            className="mt-4 w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
