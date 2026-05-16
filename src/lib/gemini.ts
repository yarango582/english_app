// Tutor IA — usa Groq (6000 RPM gratis, prácticamente sin límite para uso personal)

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string
const GROQ_MODEL   = 'llama-3.3-70b-versatile'
const GROQ_URL     = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `Eres un tutor de inglés para el curso MacArthur English.
SOLO respondes preguntas relacionadas con el aprendizaje del inglés basado en el contenido del libro MacArthur.
Si te preguntan algo no relacionado con el inglés o el curso, redirige amablemente al material.
Responde siempre en español (salvo que el usuario pida inglés). Sé conciso y educativo.
Usa ejemplos del libro cuando sea posible.`

export interface TutorMessage {
  role: 'user' | 'assistant'
  content: string
}

async function groqChat(
  messages: { role: string; content: string }[],
  temperature = 0.7,
  maxTokens = 1024
): Promise<string> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0].message.content.trim()
}

export async function askTutor(
  messages: TutorMessage[],
  context?: string
): Promise<string> {
  const system = SYSTEM_PROMPT + (context ? `\n\nCONTEXTO DEL LIBRO:\n${context}` : '')
  return groqChat([
    { role: 'system', content: system },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ])
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[¡!¿?.,:;()\[\]"'«»—–]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function checkAnswer(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  topic: string
): Promise<{ correct: boolean; feedback: string; score: 0 | 1 | 2 | 3 | 4 | 5 }> {
  const alternatives = correctAnswer.split('/').map(s => s.trim()).filter(Boolean)
  const normUser = normalize(userAnswer)

  // Fast path: exact match against any alternative (ignoring punctuation/case)
  if (alternatives.some(alt => normalize(alt) === normUser)) {
    return { correct: true, feedback: '¡Correcto!', score: 5 }
  }

  const altList = alternatives.map((a, i) => `  ${i + 1}. "${a}"`).join('\n')
  const prompt = `Eres evaluador de un curso de inglés para colombianos (MacArthur English).

Tema: ${topic}
Pregunta: "${question}"
Respuestas aceptadas (cualquiera es válida):
${altList}
Respuesta del estudiante: "${userAnswer}"

REGLAS DE EVALUACIÓN — aplica TODAS:
1. Acepta si coincide semánticamente con CUALQUIERA de las opciones (no solo textual).
2. Ignora puntuación: ¡!¿?.,:;()[]"'
3. Ignora mayúsculas/minúsculas.
4. Sé flexible con tildes/acentos (ej: "mas" ≈ "más", "deje" ≈ "déje").
5. En imperativas en español: ACEPTA tanto la forma TÚ como la forma USTED. Ejemplo: "no lo golpees" es igual de válido que "no lo golpee".
6. Acepta sinónimos razonables que transmitan el mismo significado.
7. Penaliza solo si el significado cambia sustancialmente o hay error gramatical grave.
8. Score: 5=perfecto/sinónimo exacto, 4=casi perfecto (acento o puntuación), 3=correcto pero forma diferente aceptable, 2=parcialmente correcto, 1=equivocado pero relacionado, 0=totalmente incorrecto.

Responde SOLO con JSON válido (sin markdown):
{"correct": true|false, "feedback": "una frase corta en español", "score": 0|1|2|3|4|5}`

  const text = await groqChat(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    0.1, 256
  )

  try {
    const clean = text.startsWith('```') ? text.split('\n').slice(1, -1).join('\n') : text
    return JSON.parse(clean)
  } catch {
    const isCorrect = alternatives.some(alt => normalize(alt) === normUser)
    return {
      correct: isCorrect,
      feedback: isCorrect ? '¡Correcto!' : `La respuesta correcta es: ${alternatives[0]}`,
      score: isCorrect ? 4 : 1,
    }
  }
}

export async function generateExercise(
  topic: string,
  bookContent: string,
  type: 'fill-blank' | 'translate' | 'multiple-choice'
): Promise<object> {
  const prompt = `Genera un ejercicio de tipo "${type}" sobre "${topic}" usando SOLO este contenido del libro:
${bookContent}

Devuelve JSON según el tipo:
- fill-blank: {"sentence": "...___ ...", "answer": "...", "hint": "..."}
- translate: {"source": "...", "answer": "...", "language_from": "es|en", "language_to": "en|es"}
- multiple-choice: {"question": "...", "options": ["a","b","c","d"], "correct": 0, "explanation": "..."}`

  const text = await groqChat(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    0.4, 512
  )
  const clean = text.startsWith('```') ? text.split('\n').slice(1, -1).join('\n') : text
  return JSON.parse(clean)
}
