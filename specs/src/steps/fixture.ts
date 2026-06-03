import { promises as fs } from 'node:fs'
import path from 'node:path'
import { test as base, createBdd } from 'playwright-bdd'

import { mcr } from '#coverage/mcr.config.ts'
import { initServerClock } from '#steps/clock.ts'
import { QuizmasterWorld } from '#steps/world/world.ts'

export const test = base.extend<{ world: QuizmasterWorld }>({
    page: async ({ page }, use) => {
        await page.addInitScript(() => {
            const globalState = globalThis as {
                __noCrazyBackground?: boolean
                __quizClockNow?: number
                __advanceQuizClock?: (ms: number) => void
            }
            globalState.__noCrazyBackground = true
            globalState.__quizClockNow = Date.now()
            globalState.__advanceQuizClock = (ms: number) => {
                globalState.__quizClockNow = (globalState.__quizClockNow ?? Date.now()) + ms
                globalThis.dispatchEvent(new Event('quiz-clock-tick'))
            }
        })
        await use(page)
    },
    world: async ({ page }, use, testInfo) => {
        const world = new QuizmasterWorld(page, testInfo)
        await use(world)
    },
})

export const { Given, When, Then, BeforeScenario, After, AfterScenario } = createBdd(test, {
    worldFixture: 'world',
})

const ENABLE_COVERAGE = process.env.ENABLE_COVERAGE === '1'
const FEATURE_FLAG_ENABLED: boolean = process.env.FEATURE_FLAG === 'true'
const AI_ENABLED = process.env.E2E_AI_ENABLED === 'true' && !!process.env.OPENROUTER_API_KEY

BeforeScenario(async function ({ $tags, $test }) {
    const hasFeatureFlag = $tags.includes('@feature-flag')
    const hasNotFeatureFlag = $tags.includes('@not-feature-flag')
    const isAi = $tags.includes('@ai')
    const isSkipped = $tags.includes('@skip')

    if (isSkipped) $test.skip()
    if (hasFeatureFlag && !FEATURE_FLAG_ENABLED) $test.skip()
    if (hasNotFeatureFlag && FEATURE_FLAG_ENABLED) $test.skip()
    if (isAi && !AI_ENABLED) $test.skip()

    await initServerClock(this)

    if (!ENABLE_COVERAGE) return

    await this.page.coverage.startJSCoverage({
        resetOnNavigation: false,
    })
})

const screenshotsDir = path.join(__dirname, '../../../site/docs/screenshots')
fs.mkdir(screenshotsDir, { recursive: true })

After(async function ({ $tags, $testInfo }) {
    const screenshotTag = $tags.find(tag => tag.startsWith('@screenshot:'))
    if (!screenshotTag) return

    const [filename, example] = screenshotTag.replace('@screenshot:', '').split(':')

    if (filename && (!example || $testInfo.title === `Example #${example}`)) {
        const screenshotPath = path.join(screenshotsDir, filename)
        await this.page.screenshot({ path: screenshotPath })
    }
})

AfterScenario(async function () {
    if (!ENABLE_COVERAGE) return

    const jsCoverage = await this.page.coverage.stopJSCoverage()
    await mcr.add(jsCoverage)
})
