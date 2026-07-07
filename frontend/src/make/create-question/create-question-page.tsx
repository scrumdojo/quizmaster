import './create-question.scss'
import { useNavigate, useSearchParams } from 'react-router'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import { type QuestionRequest, saveQuestion } from '#fe/make/api/question.ts'
import { Page } from '#fe/shared/page.tsx'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { QuestionEditForm } from './form/question-form.tsx'

export function CreateQuestionPage() {
    const { t } = useLanguage()
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
            title={t.question.createTitle}
            back={{ to: workspaceUrl, label: t.question.backToWorkspace }}
            subtitle={t.question.createSubtitle}
            id="create-question-page"
        >
            <QuestionEditForm workspaceId={workspaceId} onSubmit={handleSubmit} />
        </Page>
    )
}
