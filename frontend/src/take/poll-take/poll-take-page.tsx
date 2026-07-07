import { useState } from 'react'
import { useParams } from 'react-router'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import { useApi } from '#fe/shared/api/hooks.ts'
import { fetchPoll, submitPollVote } from '#fe/take/api/poll.ts'
import type { PollTake } from '#fe/take/model/poll.ts'
import './poll-take-page.scss'

export const PollTakePage = () => {
    const { t } = useLanguage()
    const params = useParams()

    const [poll, setPoll] = useState<PollTake | null>(null)
    const [selectedAnswerId, setSelectedAnswerId] = useState<number | null>(null)
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useApi(params.id, fetchPoll, setPoll)

    if (submitted) {
        return (
            <main id="poll-take-page">
                <section className="poll-thank-you-state" aria-live="polite">
                    <div className="poll-thank-you-icon" aria-hidden="true" />
                    <p className="poll-thank-you">{t.take.thankYouForVoting}</p>
                </section>
            </main>
        )
    }

    if (!poll) return null

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()

        if (selectedAnswerId === null || submitting) return

        setSubmitting(true)
        try {
            await submitPollVote(String(poll.id), { selectedAnswerId })
            setSubmitted(true)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <main id="poll-take-page">
            <form onSubmit={onSubmit}>
                <h1 id="poll-question">{poll.question}</h1>
                <ul className="poll-answers">
                    {poll.answers.map(answer => (
                        <li key={answer.id}>
                            <label className="poll-answer">
                                <input
                                    type="radio"
                                    name="poll-answer"
                                    value={answer.text}
                                    checked={selectedAnswerId === answer.id}
                                    onChange={() => setSelectedAnswerId(answer.id)}
                                />
                                <span>{answer.text}</span>
                            </label>
                        </li>
                    ))}
                </ul>
                <button
                    className="poll-submit button primary"
                    type="submit"
                    disabled={selectedAnswerId === null || submitting}
                >
                    {t.take.submit}
                </button>
            </form>
        </main>
    )
}
