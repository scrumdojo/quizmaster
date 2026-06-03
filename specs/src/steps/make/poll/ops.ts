import { fetchWorkspacePollViaRest, submitPollVoteViaRest } from '#steps/shared/api.ts'
import type { PollSpec } from '#steps/shared/specs.ts'
import { createPoll } from '#steps/take/poll/ops.ts'
import type { QuizmasterWorld } from '#steps/world'

export interface PollVoteSeed {
    answer: string
    count: number
}

export const createWorkspacePoll = async (world: QuizmasterWorld, spec: PollSpec) => {
    await createPoll(world, spec)
}

export const openPollResults = async (world: QuizmasterWorld, pollBookmark: string) => {
    const pollId = world.pollIds[pollBookmark]
    if (pollId === undefined) {
        throw new Error(`Poll bookmark "${pollBookmark}" has no REST-assigned id`)
    }

    world.activePollBookmark = pollBookmark
    await world.page.goto(`/workspace/${world.workspaceGuid}/poll/${pollId}/results`)
    await world.pollResultsPage.waitForLoaded()
}

export const seedPollVotes = async (world: QuizmasterWorld, pollBookmark: string, votes: readonly PollVoteSeed[]) => {
    const poll = await fetchWorkspacePollViaRest(world, pollBookmark)
    const answerIds = new Map(poll.answers.map(answer => [answer.text, answer.id]))

    for (const { answer, count } of votes) {
        const answerId = answerIds.get(answer)
        if (answerId === undefined) {
            throw new Error(`Poll "${pollBookmark}" does not contain answer "${answer}"`)
        }

        for (let i = 0; i < count; i++) {
            await submitPollVoteViaRest(world, poll.id, answerId)
        }
    }
}
