import { fetchJson, postNoContent } from '#fe/shared/api/helpers.ts'
import type { PollTake, PollVoteRequest } from '#fe/take/model/poll.ts'

export const fetchPoll = async (pollId: string) => await fetchJson<PollTake>(`/api/poll/${pollId}`)

export const submitPollVote = async (pollId: string, vote: PollVoteRequest) =>
    await postNoContent<PollVoteRequest>(`/api/poll/${pollId}/submit`, vote)
