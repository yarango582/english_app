import { useLocation, useNavigate } from 'react-router-dom'
import type { Flashcard } from '@/types'
import { ArrowLeft, Music } from 'lucide-react'

export default function LyricsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const song = (location.state as { song: Flashcard })?.song

  if (!song) { navigate('/songs'); return null }

  const artist = song.extra?.artist as string ?? ''
  const rawLyrics = typeof song.extra?.lyrics === 'string' ? song.extra.lyrics as string : ''

  // Split into lines and separate EN / ES pairs (alternating lines from OCR)
  const lines = rawLyrics.split('\n').map(l => l.trim()).filter(l => l.length > 2)

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/songs')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{song.front_en}</h1>
          <p className="text-sm text-pink-600 font-medium flex items-center gap-1">
            <Music size={14} /> {artist}
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-4 text-white text-center text-sm">
        <p>Letra completa con traducción del libro MacArthur</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`leading-relaxed ${
              /^[A-Z\[¡¿]/.test(line) || /[a-z]/.test(line.slice(0, 5))
                ? 'text-slate-900 font-medium'
                : 'text-slate-500 text-sm italic pl-2'
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}
