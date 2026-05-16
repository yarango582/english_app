import { useState, useEffect, useCallback } from 'react'
import type { Flashcard, Quality } from '@/types'
import { Music, Volume2, ChevronRight } from 'lucide-react'

interface Props {
  card: Flashcard
  onAnswer: (quality: Quality) => void
}

interface LineChallenge {
  before: string
  blank: string
  after: string
  lineText: string
}

function pickBlank(line: string): LineChallenge {
  const words = line.trim().split(/\s+/)
  if (words.length < 3) return { before: '', blank: line, after: '', lineText: line }
  // Pick a content word (skip short words like articles)
  const candidates = words.map((w, i) => ({ w, i })).filter(({ w }) => w.length > 3)
  const chosen = candidates.length > 0
    ? candidates[Math.floor(Math.random() * candidates.length)]
    : { w: words[Math.floor(words.length / 2)], i: Math.floor(words.length / 2) }
  return {
    before: words.slice(0, chosen.i).join(' '),
    blank: chosen.w.replace(/[.,!?;:]/g, ''),
    after: words.slice(chosen.i + 1).join(' '),
    lineText: line,
  }
}

export default function SongView({ card, onAnswer }: Props) {
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [challenge, setChallenge] = useState<LineChallenge | null>(null)
  const [lineIndex, setLineIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [lines, setLines] = useState<string[]>([])

  const title = card.front_es ?? card.front_en ?? 'Canción'
  const lyrics = typeof card.extra?.lyrics === 'string' ? card.extra.lyrics : ''

  useEffect(() => {
    const rawLines = lyrics.split('\n').map(l => l.trim()).filter(l => l.length > 4)
    setLines(rawLines)
    setLineIndex(0)
    setScore(0)
    setFeedback(null)
    setInput('')
    if (rawLines.length > 0) setChallenge(pickBlank(rawLines[0]))
  }, [card.id])

  const speakLine = useCallback((text: string) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = 0.8
    speechSynthesis.speak(u)
  }, [])

  // Auto-play current line
  useEffect(() => {
    if (challenge?.lineText) {
      const t = setTimeout(() => speakLine(challenge.lineText), 400)
      return () => clearTimeout(t)
    }
  }, [challenge])

  const submit = () => {
    if (!challenge || feedback) return
    const correct = input.trim().toLowerCase() === challenge.blank.toLowerCase()
    setFeedback(correct ? 'correct' : 'wrong')
    if (correct) setScore(s => s + 1)
  }

  const nextLine = () => {
    const next = lineIndex + 1
    if (next >= lines.length) {
      // Session done — quality based on score ratio
      const ratio = score / lines.length
      onAnswer(ratio >= 0.7 ? 5 : ratio >= 0.4 ? 3 : 1)
      return
    }
    setLineIndex(next)
    setChallenge(pickBlank(lines[next]))
    setInput('')
    setFeedback(null)
  }

  if (!lyrics) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8 text-center">
        <Music size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Esta tarjeta no tiene letra de canción.</p>
        <button onClick={() => onAnswer(3)} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl">
          Siguiente →
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Song header */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Music size={22} />
          <h2 className="font-bold text-lg">{title}</h2>
        </div>
        <div className="flex justify-between text-pink-200 text-sm">
          <span>Línea {lineIndex + 1} / {lines.length}</span>
          <span>✅ {score} correctas</span>
        </div>
        <div className="mt-2 h-1 bg-pink-400 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${((lineIndex) / Math.max(lines.length, 1)) * 100}%` }} />
        </div>
      </div>

      {/* Fill-in-the-blank */}
      {challenge && (
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400 uppercase tracking-wider">Completa la letra</p>
            <button
              onClick={() => speakLine(challenge.lineText)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
            >
              <Volume2 size={18} />
            </button>
          </div>

          <p className="text-xl text-slate-800 text-center leading-relaxed">
            {challenge.before && <span>{challenge.before} </span>}
            <span className={`inline-block min-w-[80px] border-b-2 text-center px-2 ${
              feedback === 'correct' ? 'border-green-500 text-green-700' :
              feedback === 'wrong' ? 'border-red-500 text-red-600' :
              'border-blue-400'
            }`}>
              {feedback ? (feedback === 'correct' ? input : challenge.blank) : '_____'}
            </span>
            {challenge.after && <span> {challenge.after}</span>}
          </p>

          {feedback && (
            <p className={`text-center text-sm mt-3 font-medium ${feedback === 'correct' ? 'text-green-600' : 'text-red-600'}`}>
              {feedback === 'correct' ? '¡Correcto!' : `Era: "${challenge.blank}"`}
            </p>
          )}
        </div>
      )}

      {/* Input / Next */}
      {!feedback ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Escribe la palabra que falta..."
            className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl text-lg focus:outline-none focus:border-pink-500"
            autoFocus
          />
          <button
            onClick={submit}
            disabled={!input.trim()}
            className="px-5 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      ) : (
        <button
          onClick={nextLine}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors"
        >
          {lineIndex + 1 >= lines.length ? 'Terminar canción' : 'Siguiente línea →'}
        </button>
      )}
    </div>
  )
}
