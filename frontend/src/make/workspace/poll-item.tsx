import { LinkButton } from '#fe/shared'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { PollListItem } from '#shared/types/poll.ts'

interface Props {
    readonly poll: PollListItem
}

export const PollItem = ({ poll }: Props) => {
    const workspaceId = useWorkspaceId()

    return (
        <div className="poll-item question-item">
            <span className="question-text">{poll.question}</span>
            <LinkButton label="Edit" to={urls.workspacePollEdit(workspaceId, poll.id)} />
            <LinkButton label="Results" to={urls.workspacePollResults(workspaceId, poll.id)} />
        </div>
    )
}
