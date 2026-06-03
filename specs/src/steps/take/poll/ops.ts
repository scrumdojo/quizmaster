import { ensureWorkspaceGuid } from '#steps/make/workspace/ops.ts'
import { createPollViaRest } from '#steps/shared/api.ts'
import type { PollSpec } from '#steps/shared/specs.ts'
import type { QuizmasterWorld } from '#steps/world'

export const createPoll = async (world: QuizmasterWorld, spec: PollSpec) => {
    await ensureWorkspaceGuid(world)
    const id = await createPollViaRest(world, world.workspaceGuid, spec)

    if (spec.bookmark) {
        world.bookmarkPoll(spec.bookmark, spec)
        world.pollIds[spec.bookmark] = id
    }

    return id
}

export const openPoll = async (world: QuizmasterWorld, bookmark: string) => {
    const pollId = world.pollIds[bookmark]
    if (pollId === undefined) {
        throw new Error(`Poll bookmark "${bookmark}" has no REST-assigned id`)
    }

    world.activePollBookmark = bookmark
    await world.page.goto(`/poll/${pollId}`)
    await world.takePollPage.waitForLoaded()
}
