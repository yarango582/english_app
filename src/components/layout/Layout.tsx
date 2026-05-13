import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { BookOpen, BarChart2, Bot, Home, LogOut } from 'lucide-react'

interface Props { user: User }

export default function Layout({ user }: Props) {
  const navigate = useNavigate()

  const signOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-blue-100 text-blue-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="font-bold text-blue-600 text-lg mr-4">MacArthur EN</span>
            <NavLink to="/" className={navClass}><Home size={16} />Inicio</NavLink>
            <NavLink to="/study/setup" className={navClass}><BookOpen size={16} />Estudiar</NavLink>
            <NavLink to="/dashboard" className={navClass}><BarChart2 size={16} />Progreso</NavLink>
            <NavLink to="/tutor" className={navClass}><Bot size={16} />Tutor IA</NavLink>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:block">{user.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
