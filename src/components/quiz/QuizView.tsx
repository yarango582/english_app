import { useState, useEffect } from 'react'
import type { Flashcard, Quality } from '@/types'

interface Props {
  card: Flashcard
  allCards: Flashcard[]
  onAnswer: (quality: Quality) => void
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

export default function QuizView({ card, allCards, onAnswer }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [options, setOptions] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(15)

  const correctAnswer = card.back_en ?? card.back_es ?? '—'
  const question = card.front_es ?? card.front_en ?? '—'

  useEffect(() => {
    // Generar 4 opciones: 1 correcta + 3 falsas del pool de tarjetas
    const wrong = shuffle(allCards.filter(c => c.id !== card.id && (c.back_en ?? c.back_es)))
      .slice(0, 3)
      .map(c => c.back_en ?? c.back_es ?? '—')
    setOptions(shuffle([correctAnswer, ...wrong]))
    setSelected(null)
    setTimeLeft(15)
  }, [card.id])

  useEffect(() => {
    if (selected) return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timer); onAnswer(0); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [card.id, selected])

  const pick = (option: string) => {
    if (selected) return
    setSelected(option)
    const correct = option === correctAnswer
    setTimeout(() => onAnswer(correct ? 4 : 1), 1200)
  }

  const getColor = (option: string) => {
    if (!selected) return 'bg-white hover:bg-blue-50 border-slate-200 hover:border-blue-400 cursor-pointer'
    if (option === correctAnswer) return 'bg-green-100 border-green-400'
    if (option === selected) return 'bg-red-100 border-red-400'
    return 'bg-white border-slate-200 opacity-50'
  }

  return (
    <div className="space-y-6">
      {/* Timer */}
      <div className="flex items-center justify-between">
        <div className="h-2 flex-1 bg-slate-200 rounded-full overflow-hidden mr-4">
          <div
            className={`h-full rounded-full transition-all ${timeLeft > 8 ? 'bg-green-500' : timeLeft > 4 ? 'bg-yellow-500' : 'bg-red-500'}`}
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>
        <span className={`text-lg font-bold w-8 text-right ${timeLeft <= 4 ? 'text-red-500' : 'text-slate-700'}`}>{timeLeft}</span>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8 text-center">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">¿Cómo se dice en inglés?</p>
        <p className="text-3xl font-bold text-slate-900">{question}</p>
        {card.topic && (
          <span className="mt-4 inline-block text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{card.topic}</span>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {options.map(option => (
          <button
            key={option}
            onClick={() => pick(option)}
            className={`w-full p-4 border-2 rounded-xl text-left font-medium text-slate-800 transition-all ${getColor(option)}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}
