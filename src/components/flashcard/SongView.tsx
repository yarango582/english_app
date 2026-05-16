import { useState, useEffect, useCallback } from 'react'
import type { Flashcard, Quality } from '@/types'
import { Music, Volume2, ChevronRight } from 'lucide-react'

interface Props {
  card: Flashcard
  onAnswer: (quality: Quality) => void
}

// Common stop-words we never blank (too easy / meaningless)
const STOP = new Set([
  'the','a','an','is','are','was','were','be','been','being',
  'have','has','had','do','does','did','will','would','could',
  'should','may','might','shall','can','i','you','he','she','it',
  'we','they','me','him','her','us','them','my','your','his',
  'our','their','its','and','or','but','if','of','at','by',
  'for','in','on','to','up','as','so','not','no','nor',
  'that','this','these','those','with','from','into','than',
  'then','when','what','how','all','any','both','each',
])

function splitIntoChunks(raw: string, maxChunks = 10): string[] {
  // Normalize whitespace, then split on punctuation boundaries
  const cleaned = raw.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim()
  const segments = cleaned
    .split(/(?<=[.!?,;])/)
    .map(s => s.trim())
    .filter(s => {
      const words = s.split(/\s+/)
      return words.length >= 3 && words.length <= 14
    })

  if (segments.length >= maxChunks) {
    // Shuffle and sample so questions come from different parts of the song
    return [...segments].sort(() => Math.random() - 0.5).slice(0, maxChunks)
  }

  // Fallback: slide a 6-word window over the text
  const words = cleaned.split(/\s+/)
  const fallback: string[] = []
  for (let i = 0; i + 5 < words.length; i += 6) {
    fallback.push(words.slice(i, i + 6).join(' '))
  }
  return fallback.sort(() => Math.random() - 0.5).slice(0, maxChunks)
}

interface Challenge {
  chunk: string
  words: string[]        // original word tokens
  blankIndices: number[] // which indices are blanked
  answers: string[]      // clean answers (no punctuation)
}

function buildChallenge(chunk: string): Challenge {
  const words = chunk.split(/\s+/)
  const candidates = words
    .map((w, i) => ({ i, clean: w.replace(/[.,!?;:'"]/g, '').toLowerCase() }))
    .filter(({ clean }) => clean.length > 3 && !STOP.has(clean))

  // Pick up to 2 blanks, well-spaced
  const picked: number[] = []
  for (const c of candidates.sort(() => Math.random() - 0.5)) {
    if (picked.length >= 2) break
    if (picked.every(p => Math.abs(p - c.i) > 2)) picked.push(c.i)
  }
  // If no candidates found, just blank the middle word
  if (picked.length === 0) picked.push(Math.floor(words.length / 2))

  picked.sort((a, b) => a - b)
  return {
    chunk,
    words,
    blankIndices: picked,
    answers: picked.map(i => words[i].replace(/[.,!?;:'"]/g, '').toLowerCase()),
  }
}

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[.,!?;:'"]/g, '').replace(/\s+/g, ' ')
}

export default function SongView({ card, onAnswer }: Props) {
  const [challenges, setChallenges]   = useState<Challenge[]>([])
  const [idx, setIdx]                 = useState(0)
  const [inputs, setInputs]           = useState<string[]>([])
  const [submitted, setSubmitted]     = useState(false)
  const [score, setScore]             = useState(0)

  const title  = card.front_en ?? card.front_es ?? 'Canción'
  const artist = (card.extra?.artist as string) ?? ''
  const lyrics = typeof card.extra?.lyrics === 'string' ? card.extra.lyrics : ''

  useEffect(() => {
    if (!lyrics) return
    const chunks = splitIntoChunks(lyrics, 10)
    const built  = chunks.map(buildChallenge)
    setChallenges(built)
    setIdx(0)
    setScore(0)
    setSubmitted(false)
    setInputs(built[0] ? Array(built[0].blankIndices.length).fill('') : [])
  }, [card.id])

  const challenge = challenges[idx]

  const speakChunk = useCallback((text: string) => {
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang  = 'en-US'
    u.rate  = 0.82
    speechSynthesis.speak(u)
  }, [])

  const submit = () => {
    if (!challenge || submitted) return
    setSubmitted(true)
    const allCorrect = challenge.answers.every((ans, i) => normalize(inputs[i] ?? '') === ans)
    if (allCorrect) setScore(s => s + 1)
  }

  const next = () => {
    const nextIdx = idx + 1
    if (nextIdx >= challenges.length) {
      const ratio = score / Math.max(challenges.length, 1)
      onAnswer(ratio >= 0.7 ? 5 : ratio >= 0.4 ? 3 : 1)
      return
    }
    setIdx(nextIdx)
    setInputs(Array(challenges[nextIdx].blankIndices.length).fill(''))
    setSubmitted(false)
  }

  if (!lyrics) {
    return (
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-8 text-center">
        <Music size={48} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500">Esta canción no tiene letra cargada.</p>
        <button onClick={() => onAnswer(3)} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl">
          Siguiente →
        </button>
      </div>
    )
  }

  if (!challenge) return null

  // Build the display: word tokens with blanks
  const display = challenge.words.map((w, wi) => {
    const blankPos = challenge.blankIndices.indexOf(wi)
    if (blankPos === -1) return { type: 'word' as const, text: w }
    return { type: 'blank' as const, pos: blankPos }
  })

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-1">
          <Music size={20} />
          <div>
            <p className="font-bold">{title}</p>
            {artist && <p className="text-pink-200 text-xs">{artist}</p>}
          </div>
          <button
            onClick={() => speakChunk(challenge.chunk)}
            className="ml-auto p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Volume2 size={18} />
          </button>
        </div>
        <div className="flex justify-between text-pink-200 text-xs mt-2">
          <span>Ronda {idx + 1} / {challenges.length}</span>
          <span>✅ {score} correctas</span>
        </div>
        <div className="mt-2 h-1 bg-pink-400/50 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${(idx / Math.max(challenges.length, 1)) * 100}%` }} />
        </div>
      </div>

      {/* Challenge card */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-4 text-center">
          Completa los espacios en blanco
        </p>

        {/* Song fragment with blanks inline */}
        <p className="text-xl text-slate-800 leading-relaxed text-center flex flex-wrap justify-center gap-x-1 gap-y-2">
          {display.map((token, ti) => {
            if (token.type === 'word') {
              return <span key={ti}>{token.text}</span>
            }
            const pos = token.pos
            const isCorrect = submitted && normalize(inputs[pos] ?? '') === challenge.answers[pos]
            return (
              <input
                key={ti}
                type="text"
                value={inputs[pos] ?? ''}
                onChange={e => {
                  const next = [...inputs]
                  next[pos] = e.target.value
                  setInputs(next)
                }}
                onKeyDown={e => e.key === 'Enter' && !submitted && submit()}
                disabled={submitted}
                placeholder="___"
                className={`w-28 px-2 py-1 border-b-2 text-center text-lg font-semibold focus:outline-none transition-colors ${
                  submitted
                    ? isCorrect
                      ? 'border-green-500 text-green-700 bg-green-50'
                      : 'border-red-500 text-red-600 bg-red-50'
                    : 'border-blue-400 bg-transparent'
                }`}
              />
            )
          })}
        </p>

        {/* Answer feedback */}
        {submitted && (
          <div className="mt-4 space-y-1">
            {challenge.answers.map((ans, i) => {
              const correct = normalize(inputs[i] ?? '') === ans
              return (
                <p key={i} className={`text-sm text-center font-medium ${correct ? 'text-green-600' : 'text-red-600'}`}>
                  {correct ? `✅ "${ans}" ¡Correcto!` : `❌ Era: "${ans}" · Escribiste: "${inputs[i] ?? ''}"`}
                </p>
              )
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!submitted ? (
        <button
          onClick={submit}
          disabled={inputs.some(v => !v.trim())}
          className="w-full bg-pink-500 text-white py-3 rounded-xl font-semibold hover:bg-pink-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          Verificar <ChevronRight size={18} />
        </button>
      ) : (
        <button
          onClick={next}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-medium hover:bg-slate-700 transition-colors"
        >
          {idx + 1 >= challenges.length ? 'Terminar canción 🎉' : 'Siguiente frase →'}
        </button>
      )}
    </div>
  )
}
