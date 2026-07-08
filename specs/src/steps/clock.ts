import type { QuizmasterWorld } from '#steps/world'

export const CLOCK_HEADER = 'X-Test-Clock-At'

/**
 * Anchor the scenario's server-side clock to "now" as the spec sees it. Each
 * subsequent browser request carries an X-Test-Clock-At header; the backend's
 * RequestScopedTestClock returns this value from now() for the request.
 *
 * Concurrent scenarios in different browser contexts each carry their own
 * header value, so the backend serves each on a different request thread with
 * its own per-thread clock — no shared mutable state.
 */
export const initServerClock = async (world: QuizmasterWorld) => {
    world.scenarioClockNow = new Date()
    await world.page.setExtraHTTPHeaders({ [CLOCK_HEADER]: world.scenarioClockNow.toISOString() })
}

export const advanceServerClock = async (world: QuizmasterWorld, seconds: number) => {
    if (!world.scenarioClockNow) {
        await initServerClock(world)
    }
    world.scenarioClockNow = new Date(world.scenarioClockNow!.getTime() + seconds * 1000)
    const headerValue = world.scenarioClockNow.toISOString()
    await world.page.setExtraHTTPHeaders({ [CLOCK_HEADER]: headerValue })
    for (const actor of Object.values(world.buzzerTeams)) {
        await actor.page.setExtraHTTPHeaders({ [CLOCK_HEADER]: headerValue })
    }
}
