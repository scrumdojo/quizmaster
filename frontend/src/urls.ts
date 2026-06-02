import { useParams } from 'react-router'

export const ROUTES = {
    home: '/',
    questionTake: '/question/:id',

    workspaceNew: '/workspace/new',
    workspace: '/workspace/:workspaceId',
    workspaceQuestionNew: '/workspace/:workspaceId/question/new',
    workspaceQuestionEdit: '/workspace/:workspaceId/question/:id/edit',

    workspaceQuizNew: '/workspace/:workspaceId/quiz/new',
    workspaceQuizEdit: '/workspace/:workspaceId/quiz/:id/edit',
    workspaceQuizStats: '/workspace/:workspaceId/quiz/:id/stats',
    workspaceQuizShare: '/workspace/:workspaceId/quiz/:id/share',
    workspaceQuizDryRun: '/workspace/:workspaceId/quiz/:id/dry-run',
    workspaceQuizDryRunTake: '/workspace/:workspaceId/quiz/:id/dry-run/questions/:questionId?',

    quizWelcome: '/quiz/:id',
    quizWelcomeWithCohort: '/quiz/:id/cohort/:cohortGuid',
    quizTake: '/quiz/:id/questions/:questionId?',
} as const

export const urls = {
    home: () => '/',
    questionTake: (id: number | string) => `/question/${id}`,

    workspaceNew: () => '/workspace/new',
    workspace: (workspaceId: string, tab?: 'questions' | 'quizzes') =>
        `/workspace/${workspaceId}${tab ? `?tab=${tab}` : ''}`,
    workspaceQuestionNew: (workspaceId: string) => `/workspace/${workspaceId}/question/new`,
    workspaceQuestionEdit: (workspaceId: string, id: number | string) =>
        `/workspace/${workspaceId}/question/${id}/edit`,

    workspaceQuizNew: (workspaceId: string) => `/workspace/${workspaceId}/quiz/new`,
    workspaceQuizEdit: (workspaceId: string, id: number | string) => `/workspace/${workspaceId}/quiz/${id}/edit`,
    workspaceQuizStats: (workspaceId: string, id: number | string) => `/workspace/${workspaceId}/quiz/${id}/stats`,
    workspaceQuizShare: (workspaceId: string, id: number | string) => `/workspace/${workspaceId}/quiz/${id}/share`,
    workspaceQuizDryRun: (workspaceId: string, id: number | string) => `/workspace/${workspaceId}/quiz/${id}/dry-run`,
    workspaceQuizDryRunTake: (workspaceId: string, id: number | string) =>
        `/workspace/${workspaceId}/quiz/${id}/dry-run/questions`,

    quizWelcome: (id: number | string) => `/quiz/${id}`,
    quizWelcomeWithCohort: (id: number | string, cohortGuid: string) => `/quiz/${id}/cohort/${cohortGuid}`,
    quizTake: (id: number | string) => `/quiz/${id}/questions`,
}

export const useWorkspaceId = () => {
    const { workspaceId } = useParams()
    return workspaceId || ''
}
