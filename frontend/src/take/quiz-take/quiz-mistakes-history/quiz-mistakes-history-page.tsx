import './quiz-mistakes-history-page.scss'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import { Page } from '#fe/shared'
import type { Question } from '#fe/shared/model/question.ts'
import { fetchMistakesHistory } from '#fe/take/api/quiz.ts'

export const QuizMistakesHistoryPage = () => {
    const { t } = useLanguage()
    const params = useParams()
    const [searchParams] = useSearchParams()
    const quizId = params.id ? Number(params.id) : null
    const nickname = searchParams.get('nickname') ?? undefined
    const cohortGuid = searchParams.get('cohortGuid') ?? undefined
    const [questions, setQuestions] = useState<readonly Question[]>()
    const [loadFailed, setLoadFailed] = useState(false)

    useEffect(() => {
        if (quizId === null) return
        let cancelled = false

        fetchMistakesHistory(quizId, nickname, cohortGuid)
            .then(response => {
                if (!cancelled) setQuestions(response.questions)
            })
            .catch(() => {
                if (!cancelled) setLoadFailed(true)
            })

        return () => {
            cancelled = true
        }
    }, [quizId, nickname, cohortGuid])

    return (
        <Page id="quiz-mistakes-history" className="quiz-mistakes-history" title={t.take.mistakesHistoryTitle}>
            <p className="quiz-mistakes-history__intro">{t.take.mistakesHistoryIntro}</p>

            {loadFailed && <p className="quiz-mistakes-history__error">{t.take.mistakesHistoryLoadError}</p>}

            {questions && questions.length === 0 && (
                <p className="quiz-mistakes-history__empty">{t.take.mistakesHistoryEmpty}</p>
            )}

            {questions && questions.length > 0 && (
                <ul className="quiz-mistakes-history__list">
                    {questions.map(question => (
                        <li key={question.id}>{question.question}</li>
                    ))}
                </ul>
            )}
        </Page>
    )
}
