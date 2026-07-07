import { useEffect, useRef, useState } from 'react'
import './countdown.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'

interface CountdownProps {
    readonly timeLimit: number
    readonly onTimeLimit: () => void
}

const LOW_TIME_THRESHOLD_MS = 60_000
const getNow = () => window.__quizClockNow ?? Date.now()

export const Countdown = ({ onTimeLimit, timeLimit }: CountdownProps) => {
    const { t } = useLanguage()
    const durationMs = (timeLimit || 120) * 1000

    const [timeLeft, setTimeLeft] = useState(durationMs)
    const endTimeRef = useRef(getNow() + durationMs)
    const onTimeLimitRef = useRef(onTimeLimit)
    const timeoutTriggeredRef = useRef(false)

    useEffect(() => {
        onTimeLimitRef.current = onTimeLimit
    }, [onTimeLimit])

    useEffect(() => {
        endTimeRef.current = getNow() + durationMs
        timeoutTriggeredRef.current = false
        setTimeLeft(durationMs)
    }, [durationMs])

    useEffect(() => {
        const updateTimeLeft = () => {
            const next = Math.max(0, endTimeRef.current - getNow())
            setTimeLeft(next)

            if (next <= 0) {
                if (!timeoutTriggeredRef.current) {
                    timeoutTriggeredRef.current = true
                    onTimeLimitRef.current()
                }
            }
        }

        if (window.__advanceQuizClock) {
            const handleTick = () => updateTimeLeft()
            window.addEventListener('quiz-clock-tick', handleTick)
            updateTimeLeft()
            return () => window.removeEventListener('quiz-clock-tick', handleTick)
        }

        const interval = setInterval(updateTimeLeft, 250)
        return () => clearInterval(interval)
    }, [durationMs])

    const minutes = Math.floor(timeLeft / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)
    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    const isLow = timeLeft > 0 && timeLeft < LOW_TIME_THRESHOLD_MS

    return (
        <div className={`countdown${isLow ? ' is-low' : ''}`}>
            <span className="label">{t.take.timeLeftLabel}</span>
            <span className="value" data-testid="timerID">
                {formatted}
            </span>
        </div>
    )
}
