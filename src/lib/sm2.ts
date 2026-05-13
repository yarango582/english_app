/**
 * SM-2 Spaced Repetition Algorithm
 * Quality: 0-5 (0-1=fail, 2=hard, 3=ok, 4=good, 5=perfect)
 */

export interface SM2Card {
  ease_factor: number    // default 2.5
  interval_days: number  // default 1
  repetitions: number    // default 0
}

export interface SM2Result extends SM2Card {
  next_review: Date
  passed: boolean
}

export function sm2(card: SM2Card, quality: 0 | 1 | 2 | 3 | 4 | 5): SM2Result {
  const passed = quality >= 3
  let { ease_factor, interval_days, repetitions } = card

  if (passed) {
    if (repetitions === 0) interval_days = 1
    else if (repetitions === 1) interval_days = 6
    else interval_days = Math.round(interval_days * ease_factor)

    repetitions += 1
  } else {
    repetitions = 0
    interval_days = 1
  }

  ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  const next_review = new Date()
  next_review.setDate(next_review.getDate() + interval_days)

  return { ease_factor, interval_days, repetitions, next_review, passed }
}

/** Calcula cuántas tarjetas caben en X minutos según el modo */
export function cardsForTime(minutes: number, mode: 'flashcard' | 'write' | 'quiz'): number {
  const secondsPerCard = { flashcard: 8, write: 20, quiz: 15 }
  return Math.floor((minutes * 60) / secondsPerCard[mode])
}

/** Distribuye el tiempo de sesión entre repaso vencido y contenido nuevo */
export function planSession(totalMinutes: number, dueCount: number) {
  const reviewMinutes = Math.min(totalMinutes * 0.4, dueCount * 0.15)
  const newMinutes = Math.min(totalMinutes * 0.45, totalMinutes - reviewMinutes)
  const quizMinutes = totalMinutes - reviewMinutes - newMinutes
  return {
    review: { minutes: Math.round(reviewMinutes), cards: cardsForTime(reviewMinutes, 'flashcard') },
    new: { minutes: Math.round(newMinutes), cards: cardsForTime(newMinutes, 'flashcard') },
    quiz: { minutes: Math.round(quizMinutes), cards: cardsForTime(quizMinutes, 'quiz') },
  }
}
