import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { Page } from '#fe/shared'
import type { QuizTake } from '#fe/shared/model/quiz.ts'
import { fetchBuzzerStatus } from '#fe/take/api/quiz.ts'
import { TakeCard } from '#fe/take/shared/take-card.tsx'
import { urls } from '#fe/urls.ts'

import { getStoredQuizRunId } from '../quiz-session.ts'

const POLL_INTERVAL_MS = 1000

export const QuizBuzzerLobbyPage = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const [quiz] = useState<QuizTake | undefined>(() => (location.state as { quiz?: QuizTake } | null)?.quiz)
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)

    useEffect(() => {
        if (!quiz) return
        const attemptId = getStoredQuizRunId(quiz.id)
        if (attemptId === null) return

        let cancelled = false

        const poll = async () => {
            const status = await fetchBuzzerStatus(quiz.id, attemptId)
            if (cancelled) return

            if (status.status === 'started') {
                navigate(urls.quizTake(quiz.id), { state: { quiz } })
                return
            }

            setSecondsRemaining(status.status === 'countdown' ? status.secondsRemaining : null)
        }

        void poll()
        const intervalId = window.setInterval(() => void poll(), POLL_INTERVAL_MS)
        return () => {
            cancelled = true
            window.clearInterval(intervalId)
        }
    }, [quiz, navigate])

    if (!quiz) return null

    return (
        <Page id="quiz-buzzer-lobby" title="Get ready">
            <TakeCard id="quiz-buzzer-lobby-card" className="quiz-buzzer-lobby-card">
                <header>
                    <span className="eyebrow">Quiz</span>
                    <h2>{quiz.title}</h2>
                </header>
                {secondsRemaining === null ? (
                    <p id="buzzer-waiting-message">Waiting for the other team to join…</p>
                ) : (
                    <p>
                        Starting in <span id="buzzer-countdown">{secondsRemaining}</span>
                    </p>
                )}
            </TakeCard>
        </Page>
    )
}
