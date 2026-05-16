import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { Flashcard } from '@/types'
import { Music, PlayCircle, PenLine, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react'

const YOUTUBE_SEARCHES: Record<string, string> = {
  'If you leave me now': 'Chicago If You Leave Me Now',
  'La Isla Bonita': 'Madonna La Isla Bonita official',
  'Fun to Stay at the YMCA': 'Village People YMCA official',
  'YMCA': 'Village People YMCA official',
  'Papa': 'Paul Anka Papa official',
  "You've Got a Friend": "Carole King You've Got a Friend official",
}

interface SongCard extends Flashcard {
  artist: string
  lyricsPreview: string
}

interface PracticeMode {
  id: string
  icon: React.ReactNode
  label: string
  desc: string
  color: string
}

const PRACTICE_MODES: PracticeMode[] = [
  {
    id: 'fill',
    icon: <PenLine size={22} />,
    label: 'Completar letra',
    desc: 'Completa los espacios en blanco de cada línea',
    color: 'bg-pink-50 border-pink-300 text-pink-700',
  },
  {
    id: 'read',
    icon: <BookOpen size={22} />,
    label: 'Leer con traducción',
    desc: 'Lee la letra en inglés con su traducción al español',
    color: 'bg-blue-50 border-blue-300 text-blue-700',
  },
  {
    id: 'youtube',
    icon: <PlayCircle size={22} />,
    label: 'Escuchar en YouTube',
    desc: 'Abre la canción en YouTube para escucharla original',
    color: 'bg-red-50 border-red-300 text-red-700',
  },
]

export default function SongsPage() {
  const navigate = useNavigate()
  const [songs, setSongs] = useState<SongCard[]>([])
  const [selected, setSelected] = useState<SongCard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('flashcards').select('*').eq('card_type', 'phrase')
      const mapped: SongCard[] = (data ?? []).map((c: Flashcard) => ({
        ...c,
        artist: (c.extra?.artist as string) ?? '',
        lyricsPreview: typeof c.extra?.lyrics === 'string'
          ? (c.extra.lyrics as string).slice(0, 120).replace(/\n/g, ' ') + '…'
          : '',
      }))
      setSongs(mapped)
      setLoading(false)
    }
    load()
  }, [])

  const handleMode = (mode: string) => {
    if (!selected) return

    if (mode === 'youtube') {
      const query = YOUTUBE_SEARCHES[selected.front_en ?? ''] ?? `${selected.front_en} ${selected.artist}`
      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank')
      return
    }

    if (mode === 'read') {
      navigate('/songs/lyrics', { state: { song: selected } })
      return
    }

    // fill-in-blank mode → go to study with this specific card
    const dummyPlan = { review: { cards: 1, minutes: 5 }, new: { cards: 0, minutes: 0 }, quiz: { cards: 0, minutes: 0 } }
    navigate('/study', {
      state: {
        mode: 'song',
        minutes: 10,
        selectedTopics: [],
        pageLimit: 157,
        plan: dummyPlan,
        songId: selected.id,
      },
    })
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent" />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Music className="text-pink-500" size={24} /> Canciones
          </h1>
          <p className="text-sm text-slate-500">Aprende inglés con las canciones del libro MacArthur</p>
        </div>
      </div>

      {!selected ? (
        /* Song selection grid */
        <div className="grid gap-4">
          {songs.map(song => (
            <button
              key={song.id}
              onClick={() => setSelected(song)}
              className="bg-white border-2 border-slate-200 rounded-2xl p-5 text-left hover:border-pink-400 hover:shadow-md transition-all flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center shrink-0">
                <Music size={28} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-base truncate">{song.front_en}</p>
                <p className="text-sm text-pink-600 font-medium">{song.artist}</p>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{song.lyricsPreview}</p>
              </div>
              <ChevronRight size={20} className="text-slate-400 shrink-0" />
            </button>
          ))}
        </div>
      ) : (
        /* Practice mode selection */
        <div className="space-y-4">
          {/* Selected song header */}
          <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl p-5 text-white flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Music size={28} />
            </div>
            <div>
              <p className="font-bold text-lg">{selected.front_en}</p>
              <p className="text-pink-200">{selected.artist}</p>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="ml-auto text-pink-200 hover:text-white text-sm underline"
            >
              Cambiar
            </button>
          </div>

          <h2 className="font-semibold text-slate-800">¿Cómo quieres practicar?</h2>

          <div className="grid gap-3">
            {PRACTICE_MODES.map(m => (
              <button
                key={m.id}
                onClick={() => handleMode(m.id)}
                className={`${m.color} border-2 rounded-xl p-4 text-left flex items-center gap-4 hover:shadow-md transition-all`}
              >
                <div className="shrink-0">{m.icon}</div>
                <div>
                  <p className="font-semibold text-sm">{m.label}</p>
                  <p className="text-xs opacity-70 mt-0.5">{m.desc}</p>
                </div>
                <ChevronRight size={18} className="ml-auto shrink-0 opacity-60" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
