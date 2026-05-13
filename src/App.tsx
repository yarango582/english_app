import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

import LoginPage from '@/pages/LoginPage'
import HomePage from '@/pages/HomePage'
import StudyPage from '@/pages/StudyPage'
import DashboardPage from '@/pages/DashboardPage'
import TutorPage from '@/pages/TutorPage'
import SessionSetupPage from '@/pages/SessionSetupPage'
import Layout from '@/components/layout/Layout'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-500 border-t-transparent" />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route element={user ? <Layout user={user} /> : <Navigate to="/login" />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/study/setup" element={<SessionSetupPage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tutor" element={<TutorPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
