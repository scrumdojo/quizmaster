import './quiz-nickname-page.scss'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { Button, Field, Page, TextInput } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import type { QuizMetadata, QuizTake } from '#fe/shared/model/quiz.ts'
import { createAttempt, fetchQuiz } from '#fe/take/api/quiz.ts'
import { TakeCard } from '#fe/take/shared/take-card.tsx'
import { urls } from '#fe/urls.ts'

import { isQuizAvailable } from '../quiz-availability.ts'
import { setQuizRun, storeQuizAnswers } from '../quiz-session.ts'

interface QuizNicknamePageProps {
    readonly isDryRun: boolean
}

export const QuizNicknamePage = ({ isDryRun }: QuizNicknamePageProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const cohortGuid = params.cohortGuid
    const [quiz, setQuiz] = useState<QuizMetadata>()
    const [nickname, setNickname] = useState('')
    const [isStarting, setIsStarting] = useState(false)

    useApi(params.id, fetchQuiz, setQuiz)

    const trimmedNickname = nickname.trim()
    const canStart = quiz ? !isStarting && trimmedNickname.length > 0 && isQuizAvailable(quiz) && !isDryRun : false

    const onStart = async () => {
        if (!quiz || !canStart) return

        setIsStarting(true)
        storeQuizAnswers(null)

        try {
            const { attemptId, questions } = await createAttempt(quiz.id, {
                cohortGuid,
                nickname: trimmedNickname,
            })
            const playableQuiz: QuizTake = { ...quiz, questions }
            setQuizRun(attemptId, quiz.id, trimmedNickname)
            navigate(urls.quizTake(quiz.id), { state: { quiz: playableQuiz } })
        } catch {
            setIsStarting(false)
        }
    }

    return (
        quiz && (
            <Page id="quiz-nickname" title="Choose your nickname">
                <TakeCard id="quiz-nickname-card" className="quiz-nickname-card">
                    <header>
                        <span className="eyebrow">Quiz</span>
                        <h2>Choose your nickname</h2>
                        <p>
                            Enter the nickname you want to use for <strong>{quiz.title}</strong> before the quiz starts.
                        </p>
                    </header>
                    <div className="quiz-nickname-card__form">
                        <Field label="Nickname" required={true}>
                            <TextInput
                                id="quiz-nickname-input"
                                value={nickname}
                                onChange={setNickname}
                                placeholder="Your nickname"
                            />
                        </Field>
                        <p className="quiz-nickname-card__hint">This name is shown for your quiz attempt.</p>
                    </div>
                    <footer className="quiz-nickname-card__actions">
                        <Button
                            type="button"
                            className="button secondary"
                            onClick={() =>
                                navigate(
                                    cohortGuid
                                        ? urls.quizWelcomeWithCohort(quiz.id, cohortGuid)
                                        : urls.quizWelcome(quiz.id),
                                )
                            }
                        >
                            Back
                        </Button>
                        <Button
                            id="start-quiz"
                            type="button"
                            className="button primary"
                            onClick={onStart}
                            disabled={!canStart}
                        >
                            Start quiz
                        </Button>
                    </footer>
                </TakeCard>
            </Page>
        )
    )
}
