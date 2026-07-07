import { useCallback, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import { type QuestionRequest, saveQuestion } from '#fe/make/api/question.ts'
import { postQuiz, fetchWorkspaceQuiz, putQuiz } from '#fe/make/api/quiz.ts'
import { fetchWorkspaceQuestions } from '#fe/make/api/workspace.ts'
import { QuestionEditForm } from '#fe/make/create-question/form/question-form.tsx'
import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import { Alert, Page } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import { tryCatch } from '#fe/shared/helpers.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { QuizEditForm } from './quiz-edit-form.tsx'
import type { QuizEditFormData } from './quiz-form-state.ts'

export const QuizEditPage = () => {
    const { t } = useLanguage()
    const workspaceId = useWorkspaceId()
    const navigate = useNavigate()
    const { id: quizId } = useParams()
    const [searchParams] = useSearchParams()
    const returnTab = searchParams.get('tab') === 'questions' ? 'questions' : 'quizzes'
    const workspaceUrl = urls.workspace(workspaceId, returnTab)

    const [workspaceQuestions, setWorkspaceQuestions] = useState<readonly QuestionListItem[]>([])
    const [quiz, setQuiz] = useState<Quiz | undefined>(undefined)
    const [errorMessage, setErrorMessage] = useState<string>('')
    const [showCreateQuestion, setShowCreateQuestion] = useState(false)

    const refreshQuestions = useApi(
        workspaceId,
        async guid => (await fetchWorkspaceQuestions(guid)).content,
        setWorkspaceQuestions,
    )
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

    const handleInlineQuestionSave = useCallback(
        (questionData: QuestionRequest) => {
            saveQuestion(workspaceId, questionData).then(async () => {
                setShowCreateQuestion(false)
                await refreshQuestions()
            })
        },
        [workspaceId, refreshQuestions],
    )

    const isEdit = quizId !== undefined
    const title = isEdit ? t.quiz.editTitle : t.quiz.createTitle
    const pageId = isEdit ? 'edit-quiz-page' : 'create-quiz-page'

    return (
        <Page title={title} id={pageId} back={{ to: workspaceUrl, label: t.question.backToWorkspace }}>
            {(!isEdit || quiz) && (
                <QuizEditForm
                    key={quiz?.id}
                    quiz={quiz}
                    questions={workspaceQuestions}
                    onSubmit={onSubmit}
                    onCreateNewQuestion={() => setShowCreateQuestion(true)}
                />
            )}
            {errorMessage && <Alert type="error">{errorMessage}</Alert>}

            {showCreateQuestion && (
                <dialog id="inline-question-modal" open>
                    <button
                        type="button"
                        className="inline-question-modal__close"
                        aria-label={t.common.close}
                        onClick={() => setShowCreateQuestion(false)}
                    >
                        ✕
                    </button>
                    <h2>{t.quiz.createNewQuestionModalTitle}</h2>
                    <QuestionEditForm workspaceId={workspaceId} onSubmit={handleInlineQuestionSave} />
                </dialog>
            )}
        </Page>
    )
}
