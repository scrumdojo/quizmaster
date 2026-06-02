import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import { tagToColor } from '#fe/make/model/tag.ts'
import { Button, LinkButton } from '#fe/shared'
import { urls, useWorkspaceId } from '#fe/urls.ts'

interface Props {
    readonly question: QuestionListItem
    readonly index: number
    readonly onDeleteQuestion: () => void
}

export const QuestionItem = ({ question, index, onDeleteQuestion }: Props) => {
    const workspaceId = useWorkspaceId()
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
                        label="Edit"
                        to={`${urls.workspaceQuestionEdit(workspaceId, question.id)}?tab=questions`}
                    />
                    <LinkButton label="Take" to={urls.questionTake(question.id)} />
                    {question.isInAnyQuiz ? (
                        <span className="question-used-badge link-button">In Quiz</span>
                    ) : (
                        <Button className="link-button" onClick={onDeleteQuestion}>
                            Delete
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
