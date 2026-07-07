import { useState } from 'react'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { QuizListItem } from '#fe/make/model/quiz-list-item.ts'
import { HelpTooltip, LinkButton } from '#fe/shared'
import { urls, useWorkspaceId } from '#fe/urls.ts'

interface Props {
    readonly quiz: QuizListItem
    readonly orderNumber: number
    readonly onDeleteClick: (id: number) => void
}

export const QuizItem = ({ quiz, orderNumber, onDeleteClick }: Props) => {
    const { t } = useLanguage()
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
                <LinkButton label={t.common.share} to={urls.workspaceQuizShare(workspaceId, quiz.id)} />
                <div className="quiz-item__dropdown">
                    <button
                        type="button"
                        className="link-button link-button--secondary"
                        aria-expanded={actionsOpen}
                        onClick={() => setActionsOpen(o => !o)}
                    >
                        {t.common.actions}
                        <span className="quiz-item__caret" aria-hidden="true">
                            {actionsOpen ? '▴' : '▾'}
                        </span>
                    </button>
                    {actionsOpen && (
                        <div className="quiz-item__dropdown-menu">
                            <LinkButton
                                label={t.common.edit}
                                to={`${urls.workspaceQuizEdit(workspaceId, quiz.id)}?tab=quizzes`}
                            />
                            <LinkButton label={t.common.take} to={urls.quizWelcome(quiz.id)} />
                            <span className="quiz-item__action-with-help">
                                <LinkButton
                                    label={t.common.dryRun}
                                    to={urls.workspaceQuizDryRun(workspaceId, quiz.id)}
                                />
                                <HelpTooltip label={t.workspace.dryRunTooltipLabel}>
                                    {t.workspace.dryRunTooltipBody}
                                </HelpTooltip>
                            </span>
                            <LinkButton
                                label={t.common.statistics}
                                to={urls.workspaceQuizStats(workspaceId, quiz.id)}
                            />
                            <button type="button" className="link-button link-button--secondary" onClick={handleDelete}>
                                {t.common.delete}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
