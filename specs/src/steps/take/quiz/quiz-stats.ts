import type { DataTable } from '@cucumber/cucumber'

import { Then, When } from '#steps/fixture.ts'
import {
    expectAttemptStatsTable,
    expectQuestionStatsTable,
    expectSummaryStatsTable,
    expectTagStatsTable,
} from '#steps/quiz/expects.ts'
import { finishQuizInSeconds } from '#steps/quiz/ops.ts'

When('I finish the quiz in {int} seconds', async function (seconds: number) {
    await finishQuizInSeconds(this, seconds)
})

Then('I see empty attempt stats table', async function () {
    await this.quizStatsPage.expectAttemptStatsRowCount(0)
})

Then('I see summary stats table', async function (data: DataTable) {
    await expectSummaryStatsTable(this.quizStatsPage, data)
})

Then('I see attempt stats table', async function (data: DataTable) {
    await expectAttemptStatsTable(this.quizStatsPage, data)
})

Then('I see question stats table', async function (data: DataTable) {
    await expectQuestionStatsTable(this.quizStatsPage, data)
})

Then('I see tag stats table', async function (data: DataTable) {
    await expectTagStatsTable(this.quizStatsPage, data)
})

Then(
    'question {string} shows accuracy {string} in the {string} band',
    async function (question: string, percent: string, band: string) {
        await this.quizStatsPage.expectQuestionAccuracyBand(question, percent, band)
    },
)
