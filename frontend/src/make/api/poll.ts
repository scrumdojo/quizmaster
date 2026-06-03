import { fetchJson } from '#fe/shared/api/helpers.ts'
import type { PollResultsResponse, PollTake } from '#shared/types/poll.ts'

export const fetchWorkspacePoll = async (workspaceGuid: string, pollId: string) =>
    await fetchJson<PollTake>(`/api/workspaces/${workspaceGuid}/polls/${pollId}`)

export const fetchWorkspacePollResults = async (workspaceGuid: string, pollId: string) =>
    await fetchJson<PollResultsResponse>(`/api/workspaces/${workspaceGuid}/polls/${pollId}/results`)
