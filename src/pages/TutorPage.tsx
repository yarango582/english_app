import { useState, useRef, useEffect } from 'react'
import { askTutor } from '@/lib/gemini'
import type { TutorMessage } from '@/lib/gemini'
import { Send, Bot, User } from 'lucide-react'

export default function TutorPage() {
  const [messages, setMessages] = useState<TutorMessage[]>([
    { role: 'model', content: '¡Hola! Soy tu tutor de inglés del curso MacArthur. Puedes preguntarme sobre cualquier tema del libro: gramática, vocabulario, ejercicios, reglas... ¿En qué te puedo ayudar?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: TutorMessage = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      const reply = await askTutor([...messages, userMsg])
      setMessages(prev => [...prev, { role: 'model', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'model', content: 'Lo siento, hubo un error. Intenta de nuevo.' }])
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-blue-100 p-2 rounded-xl">
          <Bot className="text-blue-600" size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-900">Tutor IA</h1>
          <p className="text-xs text-slate-500">Solo responde sobre el contenido del libro MacArthur</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'model' ? 'bg-blue-100' : 'bg-slate-200'}`}>
              {msg.role === 'model' ? <Bot size={16} className="text-blue-600" /> : <User size={16} className="text-slate-600" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'model' ? 'bg-white border border-slate-200 text-slate-800' : 'bg-blue-600 text-white'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot size={16} className="text-blue-600" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 my-3">
        {['Explícame el imperativo', 'Verbos grupo 1', '¿Qué es el SM-2?', 'Ejercicio de práctica'].map(p => (
          <button
            key={p}
            onClick={() => setInput(p)}
            className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 border-t border-slate-200 pt-4">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Pregunta sobre el curso de inglés..."
          className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}
