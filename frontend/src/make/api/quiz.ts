import { fetchJson, postJson, putJson, callDelete } from '#fe/shared/api/helpers.ts'
import type { IdResponse } from '#shared/types/id-response.ts'
import type { Quiz, QuizCohort, QuizLiveStatsResponse, QuizRequest } from '#shared/types/quiz.ts'

export type { QuizRequest } from '#shared/types/quiz.ts'

export const fetchWorkspaceQuiz = async (workspaceGuid: string, quizId: string) =>
    await fetchJson<Quiz>(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}`)

export const postQuiz = async (quiz: QuizRequest, workspaceGuid: string) => {
    const response = await postJson<QuizRequest, IdResponse>(`/api/workspaces/${workspaceGuid}/quizzes`, quiz)
    return String(response.id)
}

export const putQuiz = async (quiz: QuizRequest, id: string, workspaceGuid: string) => {
    await putJson<QuizRequest, IdResponse>(`/api/workspaces/${workspaceGuid}/quizzes/${id}`, quiz)
}

export const deleteQuiz = async (workspaceGuid: string, quizId: string) =>
    await callDelete(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}`)

export type CohortCreateError = 'empty-cohort-name' | 'duplicate-cohort-name'
export type CohortCreateResult = { ok: true; cohort: QuizCohort } | { ok: false; error: CohortCreateError }
export type CohortMutationResult = { ok: true; cohort: QuizCohort } | { ok: false; error: CohortCreateError }

export const createCohort = async (
    workspaceGuid: string,
    quizId: number | string,
    name: string,
): Promise<CohortCreateResult> => {
    const response = await fetch(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}/cohorts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
    if (response.ok) {
        return { ok: true, cohort: (await response.json()) as QuizCohort }
    }
    const body = (await response.json()) as { error: CohortCreateError }
    return { ok: false, error: body.error }
}

export const updateCohort = async (
    workspaceGuid: string,
    quizId: number | string,
    cohortGuid: string,
    name: string,
): Promise<CohortMutationResult> => {
    const response = await fetch(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}/cohorts/${cohortGuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
    })
    if (response.ok) {
        return { ok: true, cohort: (await response.json()) as QuizCohort }
    }
    const body = (await response.json()) as { error: CohortCreateError }
    return { ok: false, error: body.error }
}

export const deleteCohort = async (workspaceGuid: string, quizId: number | string, cohortGuid: string) =>
    await callDelete(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}/cohorts/${cohortGuid}`)

export const fetchQuizLiveStats = async (workspaceGuid: string, quizId: number | string) =>
    await fetchJson<QuizLiveStatsResponse>(`/api/workspaces/${workspaceGuid}/quizzes/${quizId}/live-stats`)
