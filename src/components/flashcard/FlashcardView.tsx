import { useState } from 'react'
import type { Flashcard, CardProgress, Quality } from '@/types'
import { Volume2 } from 'lucide-react'

interface Props {
  card: Flashcard
  progress?: CardProgress
  onAnswer: (quality: Quality) => void
}

export default function FlashcardView({ card, progress, onAnswer }: Props) {
  const [flipped, setFlipped] = useState(false)

  const front = card.front_es ?? card.front_en ?? '—'
  const back = card.back_en ?? card.back_es ?? '—'
  const frontLang = card.front_es ? 'ES' : 'EN'
  const backLang = card.back_en ? 'EN' : 'ES'

  const speak = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'EN' ? 'en-US' : 'es-ES'
    speechSynthesis.speak(utterance)
  }

  const reset = () => setFlipped(false)

  return (
    <div className="space-y-6">
      {/* Flashcard */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '240px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">{frontLang}</span>
            <p className="text-3xl font-semibold text-slate-900 text-center">{front}</p>
            {card.topic && (
              <span className="mt-4 text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{card.topic}</span>
            )}
            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); speak(front, frontLang) }}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <Volume2 size={18} />
              </button>
              <span className="text-sm text-slate-400">Toca para voltear</span>
            </div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-blue-600 rounded-2xl border-2 border-blue-600 shadow-lg p-8 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-4">{backLang}</span>
            <p className="text-3xl font-semibold text-white text-center">{back}</p>
            {typeof card.extra?.context === 'string' && (
              <p className="mt-4 text-blue-200 text-sm text-center italic">"{card.extra.context}"</p>
            )}
            <button
              onClick={e => { e.stopPropagation(); speak(back, backLang) }}
              className="mt-4 p-2 rounded-lg hover:bg-blue-500 text-blue-200 hover:text-white transition-colors"
            >
              <Volume2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Answer buttons (solo si está volteada) */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { q: 1 as Quality, label: 'No sé', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
            { q: 2 as Quality, label: 'Difícil', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
            { q: 3 as Quality, label: 'Bien', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
            { q: 5 as Quality, label: 'Fácil', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
          ].map(btn => (
            <button
              key={btn.q}
              onClick={() => { reset(); onAnswer(btn.q) }}
              className={`${btn.color} py-3 rounded-xl font-medium text-sm transition-colors`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {/* SM-2 info */}
      {progress && (
        <p className="text-center text-xs text-slate-400">
          Intervalo actual: {progress.interval_days} días · Nivel {progress.level}/3
        </p>
      )}
    </div>
  )
}
