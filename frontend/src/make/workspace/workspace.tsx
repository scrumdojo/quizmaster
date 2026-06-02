import './workspace.scss'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { deleteQuestion } from '#fe/make/api/question.ts'
import { deleteQuiz } from '#fe/make/api/quiz.ts'
import { fetchWorkspace, fetchWorkspaceQuestions, fetchWorkspaceQuizzes } from '#fe/make/api/workspace.ts'
import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import type { QuizListItem } from '#fe/make/model/quiz-list-item.ts'
import type { Workspace } from '#fe/make/model/workspace.ts'
import { ItemList, LinkButton } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'

import { QuestionItem } from './question-item.tsx'
import { QuizItem } from './quiz-item.tsx'
import { WorkspaceRobinAiHelper } from './workspace-robin-ai-helper.tsx'

export function WorkspacePage() {
    const workspaceId = useWorkspaceId()
    const [searchParams] = useSearchParams()
    const initialTab = useMemo(
        () => (searchParams.get('tab') === 'questions' ? 'questions' : 'quizzes') as 'questions' | 'quizzes',
        // eslint-disable-next-line react-hooks/exhaustive-deps -- read once on mount
        [],
    )

    const [workspace, setWorkspace] = useState<Workspace>({ guid: workspaceId, title: '' })
    const [questions, setQuestions] = useState<readonly QuestionListItem[]>([])
    const [questionPage, setQuestionPage] = useState(0)
    const [questionTotalPages, setQuestionTotalPages] = useState(1)
    const [questionTotalElements, setQuestionTotalElements] = useState(0)
    const [quizzes, setQuizzes] = useState<readonly QuizListItem[]>([])
    const [quizPage, setQuizPage] = useState(0)
    const [quizTotalPages, setQuizTotalPages] = useState(1)
    const [quizToDelete, setQuizToDelete] = useState<{ id: number; title: string } | null>(null)
    const [activeTab, setActiveTab] = useState<'quizzes' | 'questions'>(initialTab)

    useApi(workspaceId, fetchWorkspace, setWorkspace)

    const loadQuestionPage = useCallback(
        async (page: number) => {
            const result = await fetchWorkspaceQuestions(workspaceId, page)
            setQuestions(result.content)
            setQuestionTotalPages(result.totalPages)
            setQuestionTotalElements(result.totalElements)
            setQuestionPage(result.number)
        },
        [workspaceId],
    )

    const loadQuizPage = useCallback(
        async (page: number) => {
            const result = await fetchWorkspaceQuizzes(workspaceId, page)
            setQuizzes(result.content)
            setQuizTotalPages(result.totalPages)
            setQuizPage(result.number)
        },
        [workspaceId],
    )

    // Stable reference used by WorkspaceRobinAiHelper to refresh questions after AI generation.
    const refreshQuestions = useCallback(() => loadQuestionPage(0), [loadQuestionPage])

    useEffect(() => {
        void loadQuestionPage(0)
    }, [loadQuestionPage])

    useEffect(() => {
        void loadQuizPage(0)
    }, [loadQuizPage])

    const onDeleteQuestion = async (id: number) => {
        await deleteQuestion(workspaceId, String(id))
        await loadQuestionPage(questionPage)
    }

    const onConfirmDeleteQuiz = async () => {
        if (!quizToDelete) return
        await deleteQuiz(workspaceId, String(quizToDelete.id))
        setQuizToDelete(null)
        await loadQuizPage(quizPage)
        await loadQuestionPage(questionPage)
    }

    const hasQuestions = questions.length > 0
    const hasAtLeastTwoQuestions = questionTotalElements >= 2
    const hasQuizzes = quizzes.length > 0

    return (
        <div className="workspace-page">
            <WorkspaceRobinAiHelper workspaceId={workspaceId} onQuestionsSaved={refreshQuestions} />
            <section className="workspace-header">
                <div className="workspace-header__content">
                    <div className="workspace-header__eyebrow">Welcome to your workspace!</div>
                    {workspace.title && <h1 data-testid="workspace-title">{workspace.title}</h1>}
                    <p className="workspace-header__copy">Build your question bank here, then assemble quizzes!</p>
                </div>
                <div className="workspace-header__stats" aria-label="Workspace summary">
                    <div className="workspace-header__stat">
                        <strong>{questionTotalElements}</strong>
                        <span>{questionTotalElements === 1 ? 'question' : 'questions'}</span>
                    </div>
                    <div className="workspace-header__stat">
                        <strong>{quizzes.length}</strong>
                        <span>{quizzes.length === 1 ? 'quiz' : 'quizzes'}</span>
                    </div>
                </div>
            </section>

            <div className="workspace-tabs" role="tablist" aria-label="Workspace sections">
                <button
                    type="button"
                    className="workspace-tab"
                    role="tab"
                    aria-selected={activeTab === 'quizzes'}
                    onClick={() => setActiveTab('quizzes')}
                >
                    Quizzes
                </button>
                <button
                    type="button"
                    className="workspace-tab"
                    role="tab"
                    aria-selected={activeTab === 'questions'}
                    onClick={() => setActiveTab('questions')}
                >
                    Questions
                </button>
            </div>

            {activeTab === 'questions' && (
                <section className="workspace-section workspace-section--questions">
                    <ItemList
                        title="My Questions"
                        action={
                            <LinkButton
                                label="Create"
                                icon="+"
                                id="create-question"
                                to={`${urls.workspaceQuestionNew(workspace.guid)}?tab=questions`}
                            />
                        }
                    >
                        {hasQuestions ? (
                            questions.map((q, index) => (
                                <QuestionItem
                                    key={q.id || index}
                                    question={q}
                                    index={index}
                                    onDeleteQuestion={() => onDeleteQuestion(q.id)}
                                />
                            ))
                        ) : (
                            <div className="workspace-empty-state workspace-empty-state--questions">
                                <h3>Create your first question</h3>
                                <p>
                                    Every quiz starts with a solid question bank. AI will help you to prepare perfect
                                    drafts!
                                </p>
                            </div>
                        )}
                    </ItemList>

                    {questionTotalPages > 1 && (
                        <nav className="question-pagination" aria-label="Question pages">
                            {Array.from({ length: questionTotalPages }, (_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`question-pagination__page${i === questionPage ? ' question-pagination__page--active' : ''}`}
                                    aria-label={`Page ${i + 1}`}
                                    aria-current={i === questionPage ? 'page' : undefined}
                                    onClick={() => void loadQuestionPage(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </nav>
                    )}
                </section>
            )}

            {activeTab === 'quizzes' && (
                <section className="workspace-section workspace-section--quizzes">
                    <ItemList
                        title="My Quizzes"
                        action={
                            <LinkButton
                                label="Create"
                                icon="+"
                                id="create-quiz"
                                to={`${urls.workspaceQuizNew(workspace.guid)}?tab=quizzes`}
                            />
                        }
                    >
                        {hasQuizzes ? (
                            quizzes.map(quiz => (
                                <QuizItem
                                    key={quiz.id}
                                    quiz={quiz}
                                    onDeleteClick={q => setQuizToDelete({ id: q, title: quiz.title })}
                                />
                            ))
                        ) : (
                            <div className="workspace-empty-state workspace-empty-state--quizzes">
                                <h3>
                                    {hasAtLeastTwoQuestions ? 'Turn questions into a quiz' : 'Quizzes will appear here'}
                                </h3>
                                <p>
                                    {hasAtLeastTwoQuestions
                                        ? 'You already have enough questions to work with. Group them into a quiz!'
                                        : 'Once you have at least 2 questions in place, you can package them into quizzes!'}
                                </p>
                            </div>
                        )}
                    </ItemList>

                    {quizTotalPages > 1 && (
                        <nav className="quiz-pagination" aria-label="Quiz pages">
                            {Array.from({ length: quizTotalPages }, (_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`quiz-pagination__page${i === quizPage ? ' quiz-pagination__page--active' : ''}`}
                                    aria-label={`Page ${i + 1}`}
                                    aria-current={i === quizPage ? 'page' : undefined}
                                    onClick={() => void loadQuizPage(i)}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </nav>
                    )}
                </section>
            )}
            {quizToDelete && (
                <dialog open>
                    <p>Delete quiz &quot;{quizToDelete.title}&quot;?</p>
                    <button type="button" onClick={onConfirmDeleteQuiz}>
                        Confirm
                    </button>
                    <button type="button" onClick={() => setQuizToDelete(null)}>
                        Cancel
                    </button>
                </dialog>
            )}
        </div>
    )
}
