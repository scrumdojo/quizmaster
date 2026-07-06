import type { DataTable } from '@cucumber/cucumber'

import { When } from '#steps/fixture.ts'

When('I start creating a new poll', async function () {
    await this.workspacePage.createNewPoll()
    await this.pollCreatePage.waitForLoaded()
})

When('I enter poll question {string}', async function (question: string) {
    await this.pollCreatePage.enterQuestion(question)
})

When('I enter poll answers', async function (answerTable: DataTable) {
    await this.pollCreatePage.enterAnswers(answerTable.raw().map(row => `${row[0]}`))
})

When('I submit the poll', async function () {
    await this.pollCreatePage.submit()
})
