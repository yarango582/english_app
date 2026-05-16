import { useState, useEffect } from 'react'
import type { Flashcard, CardProgress, Quality } from '@/types'
import { Volume2 } from 'lucide-react'

interface Props {
  card: Flashcard
  progress?: CardProgress
  onAnswer: (quality: Quality) => void
}

function textSize(text: string): string {
  if (text.length < 40)  return 'text-3xl font-semibold'
  if (text.length < 80)  return 'text-2xl font-semibold'
  if (text.length < 160) return 'text-lg font-medium'
  return 'text-base font-normal leading-relaxed'
}

export default function FlashcardView({ card, progress, onAnswer }: Props) {
  const [flipped, setFlipped] = useState(false)

  const front = card.front_es ?? card.front_en ?? '—'
  const frontLang = card.front_es ? 'ES' : 'EN'

  const isExercise = card.card_type === 'exercise_item'
  const isSong     = card.card_type === 'phrase'
  const rawBack    = card.back_en ?? card.back_es
  const noAnswerKey = isExercise && !rawBack
  const back: string = rawBack
    ?? (isSong && typeof card.extra?.lyrics === 'string'
        ? (card.extra.lyrics as string).slice(0, 300) + '…'
        : null)
    ?? (isExercise && typeof card.extra?.instruction === 'string'
        ? card.extra.instruction as string
        : null)
    ?? '—'
  const backLang = card.back_en ? 'EN' : card.back_es ? 'ES'
    : isExercise ? (card.front_es ? 'EN' : 'ES') : 'EN'

  // Las traducciones con múltiples usos vienen separadas por " / "
  const backParts = back.split(' / ').map(s => s.trim()).filter(Boolean)
  const hasMultiple = backParts.length > 1

  const speak = (text: string, lang: string) => {
    speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'EN' ? 'en-US' : 'es-ES'
    speechSynthesis.speak(utterance)
  }

  // Auto-play front audio once when card changes
  useEffect(() => {
    speak(front, frontLang)
    return () => speechSynthesis.cancel()
  }, [card.id])

  const reset = () => setFlipped(false)

  return (
    <div className="space-y-4">
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
            minHeight: '220px',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-lg px-6 py-6 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{frontLang}</span>
            <p className={`${textSize(front)} text-slate-900 text-center`}>{front}</p>
            {card.topic && (
              <span className="mt-3 text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full max-w-full truncate">{card.topic}</span>
            )}
            <div className="mt-4 flex items-center gap-2">
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
            className="absolute inset-0 bg-blue-600 rounded-2xl shadow-lg px-6 py-6 flex flex-col items-center justify-center overflow-y-auto"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-3">{backLang}</span>

            {noAnswerKey ? (
              <>
                <p className="text-sm font-medium text-blue-100 text-center mb-2">{back}</p>
                <p className="text-blue-300 text-xs text-center italic">Sin clave — ¿lo tradujiste bien?</p>
              </>
            ) : hasMultiple ? (
              /* Múltiples traducciones: cada una en su propia línea */
              <div className="flex flex-col items-center gap-2 w-full">
                {backParts.map((part, i) => (
                  <span
                    key={i}
                    className={`text-white text-center ${i === 0 ? 'text-2xl font-semibold' : 'text-base text-blue-100'}`}
                  >
                    {part}
                  </span>
                ))}
              </div>
            ) : (
              <p className={`${textSize(back)} text-white text-center`}>{back}</p>
            )}

            {typeof card.extra?.context === 'string' && (
              <p className="mt-3 text-blue-200 text-sm text-center italic">"{card.extra.context}"</p>
            )}

            {!noAnswerKey && (
              <button
                onClick={e => { e.stopPropagation(); speak(backParts[0] ?? back, backLang) }}
                className="mt-3 p-2 rounded-lg hover:bg-blue-500 text-blue-200 hover:text-white transition-colors shrink-0"
              >
                <Volume2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Answer buttons */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { q: 1 as Quality, label: 'No sé',   color: 'bg-red-100 text-red-700 hover:bg-red-200' },
            { q: 2 as Quality, label: 'Difícil',  color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
            { q: 3 as Quality, label: 'Bien',     color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
            { q: 5 as Quality, label: 'Fácil',    color: 'bg-green-100 text-green-700 hover:bg-green-200' },
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

      {progress && (
        <p className="text-center text-xs text-slate-400">
          Intervalo actual: {progress.interval_days} días · Nivel {progress.level}/3
        </p>
      )}
    </div>
  )
}
