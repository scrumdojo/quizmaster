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
    const [availableQuestionTags, setAvailableQuestionTags] = useState<readonly string[]>([])
    const [questionFilter, setQuestionFilter] = useState('')
    const [debouncedQuestionFilter, setDebouncedQuestionFilter] = useState('')
    const [selectedQuestionTags, setSelectedQuestionTags] = useState<readonly string[]>([])
    const [questionPage, setQuestionPage] = useState(0)
    const [questionPageSize, setQuestionPageSize] = useState(0)
    const [questionTotalPages, setQuestionTotalPages] = useState(1)
    const [questionTotalElements, setQuestionTotalElements] = useState(0)
    const [quizzes, setQuizzes] = useState<readonly QuizListItem[]>([])
    const [quizFilter, setQuizFilter] = useState('')
    const [debouncedQuizFilter, setDebouncedQuizFilter] = useState('')
    const [quizPage, setQuizPage] = useState(0)
    const [quizPageSize, setQuizPageSize] = useState(0)
    const [quizTotalPages, setQuizTotalPages] = useState(1)
    const [quizToDelete, setQuizToDelete] = useState<{ id: number; title: string } | null>(null)
    const [activeTab, setActiveTab] = useState<'quizzes' | 'questions'>(initialTab)

    useApi(workspaceId, fetchWorkspace, setWorkspace)

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedQuestionFilter(questionFilter.trim())
        }, 300)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [questionFilter])

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setDebouncedQuizFilter(quizFilter.trim())
        }, 300)

        return () => {
            window.clearTimeout(timeout)
        }
    }, [quizFilter])

    const loadQuestionPage = useCallback(
        async (page: number, query = '', selectedTags: readonly string[] = []) => {
            const result = await fetchWorkspaceQuestions(workspaceId, page, query, selectedTags)
            setQuestions(result.content)
            setAvailableQuestionTags(result.availableTags)
            setQuestionTotalPages(result.totalPages)
            setQuestionTotalElements(result.totalElements)
            setQuestionPageSize(result.size)
            setQuestionPage(result.number)

            // Keep workspace-level counters stable while user is filtering.
            if (query.length === 0 && selectedTags.length === 0) {
                setQuestionTotalElements(result.totalElements)
            }
        },
        [workspaceId],
    )

    const refreshQuestionTotals = useCallback(async () => {
        const result = await fetchWorkspaceQuestions(workspaceId, 0)
        setQuestionTotalElements(result.totalElements)
        setAvailableQuestionTags(result.availableTags)
    }, [workspaceId])

    const loadQuizPage = useCallback(
        async (page: number, query = '') => {
            const result = await fetchWorkspaceQuizzes(workspaceId, page, query)
            setQuizzes(result.content)
            setQuizTotalPages(result.totalPages)
            setQuizPageSize(result.size)
            setQuizPage(result.number)
        },
        [workspaceId],
    )

    // Stable reference used by WorkspaceRobinAiHelper to refresh questions after AI generation.
    const refreshQuestions = useCallback(async () => {
        await loadQuestionPage(0, debouncedQuestionFilter, selectedQuestionTags)
        if (debouncedQuestionFilter.length > 0 || selectedQuestionTags.length > 0) {
            await refreshQuestionTotals()
        }
    }, [debouncedQuestionFilter, loadQuestionPage, refreshQuestionTotals, selectedQuestionTags])

    useEffect(() => {
        void loadQuestionPage(0, debouncedQuestionFilter, selectedQuestionTags)
    }, [debouncedQuestionFilter, loadQuestionPage, selectedQuestionTags])

    useEffect(() => {
        setSelectedQuestionTags(current => {
            const next = current.filter(tag => availableQuestionTags.includes(tag))
            return next.length === current.length ? current : next
        })
    }, [availableQuestionTags])

    useEffect(() => {
        void loadQuizPage(0, debouncedQuizFilter)
    }, [debouncedQuizFilter, loadQuizPage])

    const onDeleteQuestion = async (id: number) => {
        await deleteQuestion(workspaceId, String(id))
        await loadQuestionPage(questionPage, debouncedQuestionFilter, selectedQuestionTags)
        if (debouncedQuestionFilter.length > 0 || selectedQuestionTags.length > 0) {
            await refreshQuestionTotals()
        }
    }

    const onConfirmDeleteQuiz = async () => {
        if (!quizToDelete) return
        await deleteQuiz(workspaceId, String(quizToDelete.id))
        setQuizToDelete(null)
        await loadQuizPage(quizPage, debouncedQuizFilter)
        await loadQuestionPage(questionPage, debouncedQuestionFilter, selectedQuestionTags)
    }

    const hasQuestions = questions.length > 0
    const hasQuizzes = quizzes.length > 0
    const hasActiveQuestionFilters = debouncedQuestionFilter.length > 0 || selectedQuestionTags.length > 0
    const toggleQuestionTag = (tag: string) => {
        setSelectedQuestionTags(current =>
            current.includes(tag) ? current.filter(currentTag => currentTag !== tag) : [...current, tag],
        )
    }

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
                        <form
                            className="workspace-question-filter"
                            role="search"
                            onSubmit={event => event.preventDefault()}
                        >
                            <label htmlFor="workspace-question-filter-input">Filter questions or tags</label>
                            <input
                                id="workspace-question-filter-input"
                                type="search"
                                value={questionFilter}
                                placeholder="Type question text or tag"
                                onChange={event => setQuestionFilter(event.target.value)}
                            />
                        </form>

                        {availableQuestionTags.length > 0 && (
                            <div className="workspace-question-tag-filter" data-testid="workspace-question-tag-filter">
                                <span className="workspace-question-tag-filter__label">Tags</span>
                                <div className="workspace-question-tag-filter__list">
                                    {availableQuestionTags.map(tag => {
                                        const isSelected = selectedQuestionTags.includes(tag)
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                className={`workspace-question-tag-filter__button${isSelected ? ' workspace-question-tag-filter__button--selected' : ''}`}
                                                aria-pressed={isSelected}
                                                onClick={() => toggleQuestionTag(tag)}
                                            >
                                                {tag}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {hasQuestions ? (
                            questions.map((q, index) => (
                                <QuestionItem
                                    key={q.id || index}
                                    question={q}
                                    index={questionPage * questionPageSize + index}
                                    onDeleteQuestion={() => onDeleteQuestion(q.id)}
                                />
                            ))
                        ) : hasActiveQuestionFilters ? (
                            <div className="workspace-empty-state workspace-empty-state--questions">
                                <h3>No matching questions</h3>
                                <p>Try a different filter phrase.</p>
                            </div>
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
                        <nav className="workspace-pagination question-pagination" aria-label="Question pages">
                            {Array.from({ length: questionTotalPages }, (_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`workspace-pagination__page${i === questionPage ? ' workspace-pagination__page--active' : ''}`}
                                    aria-label={`Page ${i + 1}`}
                                    aria-current={i === questionPage ? 'page' : undefined}
                                    onClick={() =>
                                        void loadQuestionPage(i, debouncedQuestionFilter, selectedQuestionTags)
                                    }
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
                        <form
                            className="workspace-quiz-filter"
                            role="search"
                            onSubmit={event => event.preventDefault()}
                        >
                            <label htmlFor="workspace-quiz-filter-input">Filter quizzes</label>
                            <input
                                id="workspace-quiz-filter-input"
                                type="search"
                                value={quizFilter}
                                placeholder="Type to filter quizzes"
                                onChange={event => setQuizFilter(event.target.value)}
                            />
                        </form>

                        {hasQuizzes ? (
                            quizzes.map((quiz, index) => (
                                <QuizItem
                                    key={quiz.id}
                                    quiz={quiz}
                                    orderNumber={quizPage * quizPageSize + index + 1}
                                    onDeleteClick={q => setQuizToDelete({ id: q, title: quiz.title })}
                                />
                            ))
                        ) : debouncedQuizFilter.length > 0 ? (
                            <div className="workspace-empty-state workspace-empty-state--quizzes">
                                <h3>No matching quizzes</h3>
                                <p>Try a different filter phrase.</p>
                            </div>
                        ) : (
                            <div className="workspace-empty-state workspace-empty-state--quizzes">
                                <h3>Turn questions into a quiz</h3>
                                <p>Select questions and package them into a quiz!</p>
                            </div>
                        )}
                    </ItemList>

                    {quizTotalPages > 1 && (
                        <nav className="workspace-pagination quiz-pagination" aria-label="Quiz pages">
                            {Array.from({ length: quizTotalPages }, (_, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={`workspace-pagination__page${i === quizPage ? ' workspace-pagination__page--active' : ''}`}
                                    aria-label={`Page ${i + 1}`}
                                    aria-current={i === quizPage ? 'page' : undefined}
                                    onClick={() => void loadQuizPage(i, debouncedQuizFilter)}
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
