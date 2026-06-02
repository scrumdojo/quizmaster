import type { Workspace } from '#fe/make/model/workspace.ts'
import { postJson, fetchJson } from '#fe/shared/api/helpers.ts'
import type { QuestionPage } from '#shared/types/question-page.ts'
import type { QuizPage } from '#shared/types/quiz-page.ts'
import type { WorkspaceCreateResponse, WorkspaceRequest } from '#shared/types/workspace.ts'

export type { WorkspaceCreateResponse, WorkspaceRequest } from '#shared/types/workspace.ts'
export type { QuizPage } from '#shared/types/quiz-page.ts'
export type { QuestionPage } from '#shared/types/question-page.ts'

export const postWorkspace = async (workspace: WorkspaceRequest) =>
    await postJson<WorkspaceRequest, WorkspaceCreateResponse>('/api/workspaces', workspace)

export const fetchWorkspace = async (guid: string) => await fetchJson<Workspace>(`/api/workspaces/${guid}`)

export const fetchWorkspaceQuestions = async (guid: string, page = 0): Promise<QuestionPage> =>
    await fetchJson<QuestionPage>(`/api/workspaces/${guid}/questions?page=${page}`)

export const fetchWorkspaceQuizzes = async (guid: string, page = 0): Promise<QuizPage> =>
    await fetchJson<QuizPage>(`/api/workspaces/${guid}/quizzes?page=${page}`)
