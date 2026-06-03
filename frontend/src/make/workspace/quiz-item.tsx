import { useState } from 'react'

import type { QuizListItem } from '#fe/make/model/quiz-list-item.ts'
import { HelpTooltip, LinkButton } from '#fe/shared'
import { urls, useWorkspaceId } from '#fe/urls.ts'

interface Props {
    readonly quiz: QuizListItem
    readonly orderNumber: number
    readonly onDeleteClick: (id: number) => void
}

export const QuizItem = ({ quiz, orderNumber, onDeleteClick }: Props) => {
    const workspaceId = useWorkspaceId()
    const [actionsOpen, setActionsOpen] = useState(false)

    const handleDelete = () => {
        setActionsOpen(false)
        onDeleteClick(quiz.id)
    }

    return (
        <div className="quiz-item question-item">
            <span className="question-index">#{orderNumber}</span>
            <span className="question-text">{quiz.title}</span>
            <div className="quiz-item__action-group">
                <LinkButton label="Share" to={urls.workspaceQuizShare(workspaceId, quiz.id)} />
                <div className="quiz-item__dropdown">
                    <button
                        type="button"
                        className="link-button link-button--secondary"
                        aria-expanded={actionsOpen}
                        onClick={() => setActionsOpen(o => !o)}
                    >
                        Actions
                        <span className="quiz-item__caret" aria-hidden="true">
                            {actionsOpen ? '▴' : '▾'}
                        </span>
                    </button>
                    {actionsOpen && (
                        <div className="quiz-item__dropdown-menu">
                            <LinkButton
                                label="Edit"
                                to={`${urls.workspaceQuizEdit(workspaceId, quiz.id)}?tab=quizzes`}
                            />
                            <LinkButton label="Take" to={urls.quizWelcome(quiz.id)} />
                            <span className="quiz-item__action-with-help">
                                <LinkButton label="Dry run" to={urls.workspaceQuizDryRun(workspaceId, quiz.id)} />
                                <HelpTooltip label="Dry run action">
                                    Dry run ignores scheduling. Other quiz rules still apply.
                                </HelpTooltip>
                            </span>
                            <LinkButton label="Statistics" to={urls.workspaceQuizStats(workspaceId, quiz.id)} />
                            <button type="button" className="link-button link-button--secondary" onClick={handleDelete}>
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
