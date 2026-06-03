import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useApi } from '#fe/shared/api/hooks.ts'
import type { QuizLeaderboardResponse, QuizMetadata, QuizTake } from '#fe/shared/model/quiz.ts'
import { createAttempt, createDryRun, fetchQuiz, fetchQuizLeaderboard } from '#fe/take/api/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { DryRunIndicator } from '../dry-run-indicator.tsx'
import { isQuizAvailable } from '../quiz-availability.ts'
import { setQuizRun, storeQuizAnswers } from '../quiz-session.ts'
import { QuizDetails } from './quiz-details.tsx'

interface QuizWelcomePageProps {
    readonly isDryRun: boolean
}

export const QuizWelcomePage = ({ isDryRun }: QuizWelcomePageProps) => {
    const navigate = useNavigate()
    const params = useParams()
    const workspaceId = useWorkspaceId()
    const cohortGuid = params.cohortGuid
    const [quiz, setQuiz] = useState<QuizMetadata>()
    const [leaderboard, setLeaderboard] = useState<QuizLeaderboardResponse>({ cohorts: [], individuals: [] })
    const [isStarting, setIsStarting] = useState(false)

    useApi(params.id, fetchQuiz, setQuiz)
    useApi(params.id, fetchQuizLeaderboard, setLeaderboard)

    const canStart = quiz ? !isStarting && (isDryRun || isQuizAvailable(quiz)) : false

    const onStart = async () => {
        if (!quiz || !canStart) return

        if (!isDryRun) {
            const target = cohortGuid ? urls.quizNicknameWithCohort(quiz.id, cohortGuid) : urls.quizNickname(quiz.id)
            navigate(target)
            return
        }

        setIsStarting(true)
        storeQuizAnswers(null)

        try {
            const { attemptId, questions } = isDryRun
                ? await createDryRun(workspaceId, quiz.id)
                : await createAttempt(quiz.id, { cohortGuid })
            const playableQuiz: QuizTake = { ...quiz, questions }
            setQuizRun(attemptId, quiz.id)
            const target = isDryRun ? urls.workspaceQuizDryRunTake(workspaceId, quiz.id) : urls.quizTake(quiz.id)
            navigate(target, { state: { quiz: playableQuiz } })
        } catch {
            setIsStarting(false)
        }
    }

    return (
        quiz && (
            <>
                {isDryRun && <DryRunIndicator />}
                <QuizDetails
                    quiz={quiz}
                    questionCount={quiz.questionCount}
                    canStart={canStart}
                    cohortLeaderboard={leaderboard.cohorts}
                    individualsLeaderboard={leaderboard.individuals}
                    onStart={onStart}
                />
            </>
        )
    )
}
