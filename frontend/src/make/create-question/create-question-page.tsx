import './create-question.scss'
import { useNavigate, useSearchParams } from 'react-router'

import { type QuestionRequest, saveQuestion } from '#fe/make/api/question.ts'
import { Page } from '#fe/shared/page.tsx'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { QuestionEditForm } from './form/question-form.tsx'

export function CreateQuestionPage() {
    const workspaceId = useWorkspaceId()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const returnTab = searchParams.get('tab') === 'quizzes' ? 'quizzes' : 'questions'
    const workspaceUrl = urls.workspace(workspaceId, returnTab)

    const handleSubmit = (questionData: QuestionRequest) => {
        saveQuestion(workspaceId, questionData).then(() => {
            navigate(workspaceUrl)
        })
    }

    return (
        <Page
            title="Create Question"
            back={{ to: workspaceUrl, label: 'Back to workspace' }}
            subtitle="Draft a clean quiz question, refine the answers, and use AI as a starting point when it helps."
            id="create-question-page"
        >
            <QuestionEditForm workspaceId={workspaceId} onSubmit={handleSubmit} />
        </Page>
    )
}
