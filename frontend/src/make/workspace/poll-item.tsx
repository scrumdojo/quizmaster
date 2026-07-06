import { LinkButton } from '#fe/shared'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { PollListItem } from '#shared/types/poll.ts'

interface Props {
    readonly poll: PollListItem
    readonly onDeleteClick: () => void
}

export const PollItem = ({ poll, onDeleteClick }: Props) => {
    const workspaceId = useWorkspaceId()

    return (
        <div className="poll-item question-item">
            <span className="question-text">{poll.question}</span>
            <LinkButton label="Edit" to={urls.workspacePollEdit(workspaceId, poll.id)} />
            <LinkButton label="Results" to={urls.workspacePollResults(workspaceId, poll.id)} />
            <button type="button" className="link-button link-button--secondary" onClick={onDeleteClick}>
                Delete
            </button>
        </div>
    )
}
