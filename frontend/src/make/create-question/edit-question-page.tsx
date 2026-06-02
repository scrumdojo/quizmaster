import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { fetchWorkspaceQuestion, type QuestionRequest, updateQuestion } from '#fe/make/api/question.ts'
import { useApi } from '#fe/shared/api/hooks.ts'
import type { Question } from '#fe/shared/model/question.ts'
import { Page } from '#fe/shared/page.tsx'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { QuestionEditForm } from './form/question-form.tsx'

export function EditQuestionPage() {
    const workspaceId = useWorkspaceId()
    const params = useParams()
    const questionId = params.id || ''

    const [question, setQuestion] = useState<Question | undefined>(undefined)

    useApi(questionId, id => fetchWorkspaceQuestion(workspaceId, id), setQuestion)
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const returnTab = searchParams.get('tab') === 'questions' ? 'questions' : undefined
    const workspaceUrl = urls.workspace(workspaceId, returnTab ?? 'questions')

    const handleSubmit = (questionData: QuestionRequest) => {
        updateQuestion(workspaceId, question?.id ?? 0, questionData).then(() => {
            navigate(workspaceUrl)
        })
    }

    return (
        <Page
            title="Edit Question"
            back={{ to: workspaceUrl, label: 'Back to workspace' }}
            subtitle="Tune the prompt, answers, and explanations until the question reads clearly and scores fairly."
            id="edit-question-page"
        >
            {question && <QuestionEditForm workspaceId={workspaceId} question={question} onSubmit={handleSubmit} />}
        </Page>
    )
}
