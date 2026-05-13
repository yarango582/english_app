import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string })

const SYSTEM_PROMPT = `You are an English tutor for the MacArthur English course.
You ONLY answer questions related to English language learning based on the book content provided.
If asked about anything unrelated to English learning, politely redirect to the course material.
Always respond in Spanish (unless the user asks for English) and keep answers concise and educational.
Use examples from the book content when possible.`

export interface TutorMessage {
  role: 'user' | 'model'
  content: string
}

export async function askTutor(
  messages: TutorMessage[],
  context?: string
): Promise<string> {
  const contextPrompt = context
    ? `\n\nBOOK CONTEXT:\n${context}`
    : ''

  const contents = messages.map(m => ({
    role: m.role,
    parts: [{ text: m.content }],
  }))

  const response = await ai.models.generateContent({
    model: 'models/gemini-2.5-flash',
    contents,
    config: {
      systemInstruction: SYSTEM_PROMPT + contextPrompt,
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  })

  return response.text ?? ''
}

export async function checkAnswer(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  topic: string
): Promise<{ correct: boolean; feedback: string; score: 0 | 1 | 2 | 3 | 4 | 5 }> {
  const prompt = `Topic: ${topic}
Question: ${question}
Correct answer: ${correctAnswer}
Student answer: ${userAnswer}

Evaluate the student's answer. Be lenient with minor spelling/accent differences.
Respond with JSON only:
{"correct": true/false, "feedback": "short feedback in Spanish", "score": 0-5}`

  const response = await ai.models.generateContent({
    model: 'models/gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.1,
      maxOutputTokens: 256,
    },
  })

  try {
    const text = response.text?.trim() ?? ''
    const clean = text.startsWith('```') ? text.split('\n').slice(1, -1).join('\n') : text
    return JSON.parse(clean)
  } catch {
    const isCorrect = userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    return {
      correct: isCorrect,
      feedback: isCorrect ? '¡Correcto!' : `La respuesta correcta es: ${correctAnswer}`,
      score: isCorrect ? 4 : 1,
    }
  }
}

export async function generateExercise(
  topic: string,
  bookContent: string,
  type: 'fill-blank' | 'translate' | 'multiple-choice'
): Promise<object> {
  const prompt = `Generate a ${type} exercise about "${topic}" using ONLY this book content:
${bookContent}

Return JSON matching the exercise type:
- fill-blank: {"sentence": "...___ ...", "answer": "...", "hint": "..."}
- translate: {"source": "...", "answer": "...", "language_from": "es|en", "language_to": "en|es"}
- multiple-choice: {"question": "...", "options": ["a","b","c","d"], "correct": 0, "explanation": "..."}`

  const response = await ai.models.generateContent({
    model: 'models/gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.4, maxOutputTokens: 512 },
  })

  const text = response.text?.trim() ?? '{}'
  const clean = text.startsWith('```') ? text.split('\n').slice(1, -1).join('\n') : text
  return JSON.parse(clean)
}
