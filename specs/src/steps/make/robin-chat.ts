import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { toText } from '#steps/common.ts'
import { Given, Then, When } from '#steps/fixture.ts'
import { createQuestion, enterAIPrompt } from '#steps/make/question/ops.ts'
import type { QuizmasterWorld } from '#steps/world'

const AI_RESPONSE_TIMEOUT = 120_000

// Sends the composer content and waits for the unified chat endpoint to answer.
const askRobin = async (world: QuizmasterWorld, prompt: string) => {
    await enterAIPrompt(world, prompt)
    await Promise.all([
        world.page.waitForResponse(response => response.url().includes('/ai-assistant/chat') && response.ok(), {
            timeout: AI_RESPONSE_TIMEOUT,
        }),
        world.robinSheetPage.generate(),
    ])
}

Given(
    'the workspace already contains the question {string} without a dedup embedding',
    async function (question: string) {
        await createQuestion(
            this,
            {
                text: question,
                answers: [
                    { text: 'Correct answer', correct: true },
                    { text: 'Incorrect answer', correct: false },
                ],
            },
            { skipEmbedding: true },
        )
    },
)

When('I ask Robin:', async function (dataTable: DataTable) {
    await askRobin(this, toText(dataTable))
})

When('I use question {int} from draft version {int}', async function (index: number, version: number) {
    await this.robinSheetPage.useQuestionFromVersion(version, index)
})

When('I save generated question {int}', async function (index: number) {
    await this.robinSheetPage.saveGeneratedQuestion(index)
})

When('I save all generated questions', async function () {
    await this.robinSheetPage.saveAllGeneratedQuestions()
})

Then('I see {int} draft version(s) in Robin chat', async function (count: number) {
    await this.robinSheetPage.expectDraftVersionCount(count)
})

Then(
    'question {int} in draft version {int} has {int} answers',
    async function (index: number, version: number, count: number) {
        await this.robinSheetPage.expectVersionQuestionAnswerCount(version, index, count)
    },
)

Then(
    'question {int} in draft version {int} has {int} highlighted correct answer(s)',
    async function (index: number, version: number, count: number) {
        await this.robinSheetPage.expectVersionQuestionCorrectAnswerCount(version, index, count)
    },
)

Then(
    'question {int} in draft version {int} has one more answer than in draft version {int}',
    async function (index: number, version: number, earlierVersion: number) {
        const earlierCount = await this.robinSheetPage.versionQuestionAnswerCount(earlierVersion, index)
        await this.robinSheetPage.expectVersionQuestionAnswerCount(version, index, earlierCount + 1)
    },
)

Then('question {int} in draft version {int} can be used', async function (index: number, version: number) {
    await this.robinSheetPage.expectVersionQuestionUsable(version, index)
})

Then('every answer of generated question {int} in Robin chat shows an explanation', async function (index: number) {
    await this.robinSheetPage.expectEveryAnswerExplained(index)
})

Then('at least {int} generated question(s) in Robin chat is numerical', async function (count: number) {
    expect(await this.robinSheetPage.numericalGeneratedQuestionCount()).toBeGreaterThanOrEqual(count)
})

Then(
    'at least {int} generated question(s) in Robin chat has at least {int} highlighted correct answers',
    async function (count: number, correctCount: number) {
        const badgeCounts = await this.robinSheetPage.generatedQuestionCorrectBadgeCounts()
        expect(badgeCounts.filter(badges => badges >= correctCount).length).toBeGreaterThanOrEqual(count)
    },
)

Then(
    'at least {int} generated question(s) in Robin chat has exactly {int} highlighted correct answer(s)',
    async function (count: number, correctCount: number) {
        const badgeCounts = await this.robinSheetPage.generatedQuestionCorrectBadgeCounts()
        expect(badgeCounts.filter(badges => badges === correctCount).length).toBeGreaterThanOrEqual(count)
    },
)

Then('I see a Robin notice in the chat', async function () {
    await this.robinSheetPage.expectNoticeVisible()
})

Then('the Robin composer is still available', async function () {
    await this.robinSheetPage.expectComposerUsable()
})
