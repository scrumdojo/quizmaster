import { fetchJson, postJson } from '#fe/shared/api/helpers.ts'
import type {
    QuizAttemptStartRequest,
    QuizAttemptStartResponse,
    QuizBuzzerStatus,
    QuizLeaderboardResponse,
    QuizMetadata,
    QuizMistakesHistoryResponse,
    QuizTake,
} from '#fe/shared/model/quiz.ts'

export const fetchQuiz = async (quizId: string) => await fetchJson<QuizMetadata>(`/api/quiz/${quizId}`)

export const fetchQuizLeaderboard = async (quizId: string) =>
    await fetchJson<QuizLeaderboardResponse>(`/api/quiz/${quizId}/leaderboard`)

export const fetchQuizAttempt = async (quizId: number, attemptId: number) =>
    await fetchJson<QuizTake>(`/api/quiz/${quizId}/attempts/${attemptId}`)

export const createAttempt = async (
    quizId: number,
    request?: QuizAttemptStartRequest,
): Promise<QuizAttemptStartResponse> =>
    await postJson<QuizAttemptStartRequest | undefined, QuizAttemptStartResponse>(
        `/api/quiz/${quizId}/attempts`,
        request,
    )

export const createDryRun = async (workspaceGuid: string, quizId: number): Promise<QuizAttemptStartResponse> =>
    await postJson<undefined, QuizAttemptStartResponse>(
        `/api/workspaces/${workspaceGuid}/quizzes/${quizId}/dry-runs`,
        undefined,
    )

export const fetchBuzzerStatus = async (quizId: number, attemptId: number) =>
    await fetchJson<QuizBuzzerStatus>(`/api/quiz/${quizId}/attempts/${attemptId}/buzzer-status`)

export const fetchMistakesHistory = async (quizId: number, nickname?: string, cohortGuid?: string) => {
    const params = new URLSearchParams()
    if (nickname) params.set('nickname', nickname)
    if (cohortGuid) params.set('cohortGuid', cohortGuid)
    const query = params.toString()
    return await fetchJson<QuizMistakesHistoryResponse>(
        `/api/quiz/${quizId}/mistakes-history${query ? `?${query}` : ''}`,
    )
}
