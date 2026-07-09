import type { QuizAnswers } from './quiz-answers-state.ts'

const QUIZ_ANSWERS_KEY = 'quizAnswers'

const quizRunIdKey = (quizId: number) => `quizRunId:${quizId}`
const quizNicknameKey = (quizId: number) => `quizNickname:${quizId}`
const quizCohortGuidKey = (quizId: number) => `quizCohortGuid:${quizId}`

export const setQuizRun = (runId: number, quizId: number, nickname?: string, cohortGuid?: string) => {
    sessionStorage.setItem(quizRunIdKey(quizId), runId.toString())

    if (nickname === undefined) {
        sessionStorage.removeItem(quizNicknameKey(quizId))
    } else {
        sessionStorage.setItem(quizNicknameKey(quizId), nickname)
    }

    if (cohortGuid === undefined) {
        sessionStorage.removeItem(quizCohortGuidKey(quizId))
    } else {
        sessionStorage.setItem(quizCohortGuidKey(quizId), cohortGuid)
    }
}

export const clearQuizRun = (quizId: number) => {
    sessionStorage.removeItem(quizRunIdKey(quizId))
    sessionStorage.removeItem(quizNicknameKey(quizId))
    sessionStorage.removeItem(quizCohortGuidKey(quizId))
}

export const getStoredQuizRunId = (quizId: number): number | null => {
    const storedRunId = sessionStorage.getItem(quizRunIdKey(quizId))

    if (!storedRunId) return null

    const runId = Number.parseInt(storedRunId, 10)
    return Number.isNaN(runId) ? null : runId
}

export const getStoredQuizNickname = (quizId: number): string | null => sessionStorage.getItem(quizNicknameKey(quizId))

export const getStoredQuizCohortGuid = (quizId: number): string | null =>
    sessionStorage.getItem(quizCohortGuidKey(quizId))

export const loadQuizAnswers = (): QuizAnswers | null => {
    const storedAnswers = sessionStorage.getItem(QUIZ_ANSWERS_KEY)
    if (!storedAnswers) return null

    try {
        return JSON.parse(storedAnswers) as QuizAnswers
    } catch {
        sessionStorage.removeItem(QUIZ_ANSWERS_KEY)
        return null
    }
}

export const storeQuizAnswers = (answers: QuizAnswers | null) => {
    if (answers === null) {
        sessionStorage.removeItem(QUIZ_ANSWERS_KEY)
        return
    }

    sessionStorage.setItem(QUIZ_ANSWERS_KEY, JSON.stringify(answers))
}

export const clearQuizTakeSession = (quizId: number) => {
    clearQuizRun(quizId)
    storeQuizAnswers(null)
}
