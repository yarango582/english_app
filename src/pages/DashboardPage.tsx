import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { subDays, format, eachDayOfInterval } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Flame, Trophy, Target, BookOpen } from 'lucide-react'

interface StreakDay { study_date: string; cards: number; minutes: number }
interface WeekData { day: string; cards: number }

export default function DashboardPage() {
  const [streak, setStreak] = useState({ current: 0, best: 0 })
  const [heatmap, setHeatmap] = useState<Record<string, number>>({})
  const [weekData, setWeekData] = useState<WeekData[]>([])
  const [totals, setTotals] = useState({ mastered: 0, learning: 0, total: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const [streakRes, progressRes] = await Promise.all([
        supabase.from('study_streak').select('*').eq('user_id', authUser.id).order('study_date', { ascending: false }).limit(90),
        supabase.from('user_card_progress').select('interval_days').eq('user_id', authUser.id),
      ])

      const streakDays: StreakDay[] = streakRes.data ?? []

      // Heatmap últimos 90 días
      const map: Record<string, number> = {}
      for (const d of streakDays) map[d.study_date] = d.cards
      setHeatmap(map)

      // Semana actual
      const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() })
      setWeekData(last7.map(d => {
        const key = format(d, 'yyyy-MM-dd')
        return { day: format(d, 'EEE', { locale: es }), cards: map[key] ?? 0 }
      }))

      // Progreso SM-2
      const prog = progressRes.data ?? []
      setTotals({
        total: prog.length,
        mastered: prog.filter((p: { interval_days: number }) => p.interval_days >= 21).length,
        learning: prog.filter((p: { interval_days: number }) => p.interval_days < 21).length,
      })

      // Racha actual
      let current = 0
      const sortedDates = streakDays.map(d => d.study_date).sort().reverse()
      for (const date of sortedDates) {
        const expected = format(subDays(new Date(), current), 'yyyy-MM-dd')
        if (date === expected) current++
        else break
      }
      setStreak({ current, best: current })
      setLoading(false)
    }
    load()
  }, [])

  // Heatmap 90 días
  const days90 = eachDayOfInterval({ start: subDays(new Date(), 89), end: new Date() })
  const getHeat = (date: Date) => {
    const key = format(date, 'yyyy-MM-dd')
    const c = heatmap[key] ?? 0
    if (c === 0) return 'bg-slate-100'
    if (c < 5) return 'bg-blue-200'
    if (c < 15) return 'bg-blue-400'
    return 'bg-blue-600'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Mi progreso</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <Flame className="text-orange-500" />, label: 'Racha actual', value: `${streak.current} días` },
          { icon: <Trophy className="text-yellow-500" />, label: 'Dominadas', value: totals.mastered },
          { icon: <BookOpen className="text-blue-500" />, label: 'Aprendiendo', value: totals.learning },
          { icon: <Target className="text-green-500" />, label: 'Total vistas', value: totals.total },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-slate-900">{loading ? '—' : s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly bar chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Tarjetas esta semana</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekData} barSize={32}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
            <YAxis hide />
            <Tooltip cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="cards" radius={[6, 6, 0, 0]}>
              {weekData.map((_, i) => (
                <Cell key={i} fill={i === 6 ? '#2563eb' : '#bfdbfe'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap 90 días */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Actividad (90 días)</h2>
        <div className="flex flex-wrap gap-1">
          {days90.map(day => (
            <div
              key={format(day, 'yyyy-MM-dd')}
              title={`${format(day, 'dd MMM', { locale: es })}: ${heatmap[format(day, 'yyyy-MM-dd')] ?? 0} tarjetas`}
              className={`w-3 h-3 rounded-sm ${getHeat(day)}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
          <span>Menos</span>
          {['bg-slate-100','bg-blue-200','bg-blue-400','bg-blue-600'].map(c => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>Más</span>
        </div>
      </div>

      {/* SM-2 distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Estado del aprendizaje</h2>
        <div className="space-y-3">
          {[
            { label: 'Dominadas (21+ días)', count: totals.mastered, color: 'bg-green-500', total: totals.total },
            { label: 'Aprendiendo (1-20 días)', count: totals.learning, color: 'bg-blue-500', total: totals.total },
            { label: 'Sin ver', count: Math.max(0, 0), color: 'bg-slate-200', total: totals.total },
          ].map(item => (
            <div key={item.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">{item.label}</span>
                <span className="font-medium text-slate-800">{item.count}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} rounded-full`}
                  style={{ width: item.total > 0 ? `${(item.count / item.total) * 100}%` : '0%' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
