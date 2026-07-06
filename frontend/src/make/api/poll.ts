import { fetchJson, postJson } from '#fe/shared/api/helpers.ts'
import type { IdResponse } from '#shared/types/id-response.ts'
import type { PollRequest, PollResultsResponse, PollTake } from '#shared/types/poll.ts'

export const postPoll = async (workspaceGuid: string, poll: PollRequest) => {
    const response = await postJson<PollRequest, IdResponse>(`/api/workspaces/${workspaceGuid}/polls`, poll)
    return String(response.id)
}

export const fetchWorkspacePoll = async (workspaceGuid: string, pollId: string) =>
    await fetchJson<PollTake>(`/api/workspaces/${workspaceGuid}/polls/${pollId}`)

export const fetchWorkspacePollResults = async (workspaceGuid: string, pollId: string) =>
    await fetchJson<PollResultsResponse>(`/api/workspaces/${workspaceGuid}/polls/${pollId}/results`)
