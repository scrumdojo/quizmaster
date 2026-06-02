import type { QuizListItem } from '#fe/make/model/quiz-list-item.ts'
import { LinkButton } from '#fe/shared'
import { urls, useWorkspaceId } from '#fe/urls.ts'

interface Props {
    readonly quiz: QuizListItem
    readonly orderNumber: number
    readonly onDeleteClick: (id: number) => void
}

export const QuizItem = ({ quiz, orderNumber, onDeleteClick }: Props) => {
    const workspaceId = useWorkspaceId()
    return (
        <div className="quiz-item question-item">
            <span className="question-index">#{orderNumber}</span>
            <span className="question-text">{quiz.title}</span>
            <LinkButton label="Edit" to={`${urls.workspaceQuizEdit(workspaceId, quiz.id)}?tab=quizzes`} />
            <LinkButton label="Take" to={urls.quizWelcome(quiz.id)} />
            <LinkButton label="Share" to={urls.workspaceQuizShare(workspaceId, quiz.id)} />
            <LinkButton label="Dry run" to={urls.workspaceQuizDryRun(workspaceId, quiz.id)} />
            <LinkButton label="Statistics" to={urls.workspaceQuizStats(workspaceId, quiz.id)} />
            <button type="button" className="link-button" onClick={() => onDeleteClick(quiz.id)}>
                Delete
            </button>
        </div>
    )
}
