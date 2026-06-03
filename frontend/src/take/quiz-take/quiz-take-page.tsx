import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'

import type { QuizEvaluationResponse, QuizTake } from '#fe/shared/model/quiz.ts'
import { evaluateQuiz } from '#fe/take/api/stats.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { DryRunIndicator } from './dry-run-indicator.tsx'
import { useQuizAttemptApi } from './hooks.ts'
import type { QuizAnswers } from './quiz-answers-state.ts'
import { isQuizAvailable } from './quiz-availability.ts'
import { QuizPlayForm } from './quiz-play.tsx'
import { QuizScorePage } from './quiz-score-page.tsx'
import {
    clearQuizTakeSession,
    getStoredQuizNickname,
    getStoredQuizRunId,
    loadQuizAnswers,
    storeQuizAnswers,
} from './quiz-session.ts'

interface QuizTakePageProps {
    readonly isDryRun: boolean
}

export const QuizTakePage = ({ isDryRun }: QuizTakePageProps) => {
    const params = useParams()
    const location = useLocation()
    const navigate = useNavigate()
    const workspaceId = useWorkspaceId()
    const quizId = params.id ? Number(params.id) : null
    const [initialStateQuiz] = useState<QuizTake | undefined>(
        () => (location.state as { quiz?: QuizTake } | null)?.quiz,
    )
    const quizRunId = quizId !== null ? getStoredQuizRunId(quizId) : null
    const quizNickname = quizId !== null ? getStoredQuizNickname(quizId) : null
    const fetchedQuiz = useQuizAttemptApi(initialStateQuiz ? null : quizRunId)
    const quiz = initialStateQuiz ?? fetchedQuiz
    const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(() => loadQuizAnswers())
    const [scoredQuiz, setScoredQuiz] = useState<QuizEvaluationResponse | null>(null)
    const isAvailable = quiz ? isDryRun || isQuizAvailable(quiz) : false
    const canTakeQuiz = quiz !== undefined && isAvailable && quizRunId !== null

    const questionsBaseUrl = (id: number) =>
        isDryRun ? urls.workspaceQuizDryRunTake(workspaceId, id) : urls.quizTake(id)

    useEffect(() => {
        if (quizId === null) return
        if (canTakeQuiz) return
        if (quizRunId !== null && quiz === undefined) return

        clearQuizTakeSession(quizId)
        const welcomeUrl = isDryRun ? urls.workspaceQuizDryRun(workspaceId, quizId) : urls.quizWelcome(quizId)
        navigate(welcomeUrl, { replace: true })
    }, [quizId, canTakeQuiz, navigate, quiz, quizRunId, isDryRun, workspaceId])

    async function handleEvaluate(answers: QuizAnswers | null) {
        if (!quiz) return

        navigate(questionsBaseUrl(quiz.id))
        storeQuizAnswers(answers)
        setQuizAnswers(answers)

        if (!answers || quizRunId === null) return

        const response = await evaluateQuiz(quiz.id, quizRunId, quizNickname ? { nickname: quizNickname } : undefined)
        setScoredQuiz(response)
    }

    if (quiz && quizRunId !== null && isAvailable) {
        return (
            <>
                {isDryRun && <DryRunIndicator />}
                {quizAnswers && scoredQuiz ? (
                    <QuizScorePage quiz={quiz} quizAnswers={quizAnswers} result={scoredQuiz} />
                ) : (
                    <QuizPlayForm
                        quiz={quiz}
                        quizRunId={quizRunId}
                        questionsBaseUrl={questionsBaseUrl(quiz.id)}
                        onEvaluate={handleEvaluate}
                    />
                )}
            </>
        )
    }
}
