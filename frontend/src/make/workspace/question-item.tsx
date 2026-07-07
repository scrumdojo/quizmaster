import { useState } from 'react'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import { tagToColor } from '#fe/make/model/tag.ts'
import { Button, HelpTooltip, LinkButton } from '#fe/shared'
import { urls, useWorkspaceId } from '#fe/urls.ts'

interface Props {
    readonly question: QuestionListItem
    readonly index: number
    readonly onDeleteQuestion: () => void
}

export const QuestionItem = ({ question, index, onDeleteQuestion }: Props) => {
    const { t } = useLanguage()
    const workspaceId = useWorkspaceId()
    const [showQuizList, setShowQuizList] = useState(false)
    return (
        <div className="question-item">
            <div className="question-content">
                <span className="question-index">Q{index + 1}.</span>
                {question.tags.length > 0 && (
                    <div className="question-tag-row">
                        {question.tags.map(tag => (
                            <span key={tag} className="question-tag-badge" style={{ background: tagToColor(tag) }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                <div className="question-main-row">
                    <div className="question-title-group">
                        <span className="question-text">{question.question}</span>
                        {question.imageUrl && <img src={question.imageUrl} alt="" className="question-thumbnail" />}
                    </div>
                    <LinkButton
                        label={t.common.edit}
                        to={`${urls.workspaceQuestionEdit(workspaceId, question.id)}?tab=questions`}
                    />
                    <LinkButton label={t.common.take} to={urls.questionTake(question.id)} />
                    {question.isInAnyQuiz ? (
                        <div className="question-used-wrapper">
                            <button
                                type="button"
                                className="question-used-badge link-button link-button--secondary"
                                onClick={() => setShowQuizList(v => !v)}
                            >
                                {t.workspace.inQuiz}
                            </button>
                            <HelpTooltip label={t.workspace.inQuizTooltipLabel(question.question)}>
                                {t.workspace.inQuizTooltipBody}
                            </HelpTooltip>
                            {showQuizList && (
                                <ul className="in-quiz-list">
                                    {question.quizTitles.map(title => (
                                        <li key={title}>{title}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ) : (
                        <Button className="link-button" onClick={onDeleteQuestion}>
                            {t.common.delete}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
