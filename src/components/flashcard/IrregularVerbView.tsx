import { useState } from 'react'
import type { Flashcard, CardProgress, Quality } from '@/types'
import { Volume2 } from 'lucide-react'

interface Props {
  card: Flashcard
  progress?: CardProgress
  onAnswer: (quality: Quality) => void
}

export default function IrregularVerbView({ card, progress, onAnswer }: Props) {
  const [flipped, setFlipped] = useState(false)

  const spanish  = card.front_es ?? '—'
  const base     = card.front_en ?? '—'
  const past     = (card.extra?.past      as string) ?? '—'
  const participle = (card.extra?.participle as string) ?? '—'

  const speakAll = () => {
    speechSynthesis.cancel()
    const full = `${base}, ${past}, ${participle}`
    const u = new SpeechSynthesisUtterance(full)
    u.lang = 'en-US'
    u.rate = 0.85
    speechSynthesis.speak(u)
  }

  return (
    <div className="space-y-4">
      {/* Card */}
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
            className="absolute inset-0 bg-white rounded-2xl border-2 border-slate-200 shadow-lg px-6 py-6 flex flex-col items-center justify-center gap-3"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Verbo Irregular</span>
            <p className="text-2xl font-semibold text-slate-500">{spanish}</p>
            <p className="text-5xl font-bold text-slate-900">{base}</p>
            <div className="flex gap-6 mt-1">
              <span className="text-slate-300 text-2xl font-light">?</span>
              <span className="text-slate-300 text-2xl font-light">?</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">Toca para ver las 3 formas</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl shadow-lg px-6 py-6 flex flex-col items-center justify-center gap-4"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <span className="text-xs font-semibold text-yellow-100 uppercase tracking-widest">{spanish}</span>

            <div className="w-full space-y-3">
              {[
                { label: 'Base (infinitivo)', value: base,        color: 'bg-white/20' },
                { label: 'Pasado simple',     value: past,        color: 'bg-white/30' },
                { label: 'Participio pasado', value: participle,  color: 'bg-white/40' },
              ].map(row => (
                <div key={row.label} className={`${row.color} rounded-xl px-5 py-3 flex items-center justify-between`}>
                  <span className="text-yellow-100 text-xs font-medium w-32">{row.label}</span>
                  <span className="text-white text-2xl font-bold">{row.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={e => { e.stopPropagation(); speakAll() }}
              className="mt-1 flex items-center gap-2 text-yellow-100 hover:text-white text-sm transition-colors"
            >
              <Volume2 size={18} /> Escuchar las 3 formas
            </button>
          </div>
        </div>
      </div>

      {/* Rating buttons — only visible after flip */}
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
              onClick={() => { setFlipped(false); onAnswer(btn.q) }}
              className={`${btn.color} py-3 rounded-xl font-medium text-sm transition-colors`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      {progress && (
        <p className="text-center text-xs text-slate-400">
          Intervalo: {progress.interval_days} días · {progress.times_correct} correctas · {progress.times_wrong} errores
        </p>
      )}
    </div>
  )
}
