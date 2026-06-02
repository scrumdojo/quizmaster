import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { postQuiz, fetchWorkspaceQuiz, putQuiz } from '#fe/make/api/quiz.ts'
import { fetchWorkspaceQuestions } from '#fe/make/api/workspace.ts'
import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import { Alert, Page } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import { tryCatch } from '#fe/shared/helpers.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { QuizEditForm } from './quiz-edit-form.tsx'
import type { QuizEditFormData } from './quiz-form-state.ts'

export const QuizEditPage = () => {
    const workspaceId = useWorkspaceId()
    const navigate = useNavigate()
    const { id: quizId } = useParams()
    const [searchParams] = useSearchParams()
    const returnTab = searchParams.get('tab') === 'questions' ? 'questions' : 'quizzes'
    const workspaceUrl = urls.workspace(workspaceId, returnTab)

    const [workspaceQuestions, setWorkspaceQuestions] = useState<readonly QuestionListItem[]>([])
    const [quiz, setQuiz] = useState<Quiz | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string>('')

    useApi(workspaceId, async guid => (await fetchWorkspaceQuestions(guid)).content, setWorkspaceQuestions)
    useApi(quizId, id => fetchWorkspaceQuiz(workspaceId, id), setQuiz)

    const onSubmit = (data: QuizEditFormData) =>
        tryCatch(setErrorMessage, async () => {
            if (quizId) {
                await putQuiz(data, quizId, workspaceId)
            } else {
                await postQuiz(data, workspaceId)
            }
            navigate(workspaceUrl)
        })

    const isEdit = quizId !== undefined
    const title = isEdit ? 'Edit Quiz' : 'Create Quiz'
    const pageId = isEdit ? 'edit-quiz-page' : 'create-quiz-page'

    return (
        <Page title={title} id={pageId} back={{ to: workspaceUrl, label: 'Back to workspace' }}>
            {(!isEdit || quiz) && (
                <QuizEditForm key={quiz?.id} quiz={quiz} questions={workspaceQuestions} onSubmit={onSubmit} />
            )}
            {errorMessage && <Alert type="error">{errorMessage}</Alert>}
        </Page>
    )
}
