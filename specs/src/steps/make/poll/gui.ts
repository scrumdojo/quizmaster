import type { DataTable } from '@cucumber/cucumber'

import { Then, When } from '#steps/fixture.ts'

When('I start creating a new poll', async function () {
    await this.workspacePage.createNewPoll()
    await this.pollFormPage.waitForLoaded()
})

When('I start editing poll {string}', async function (pollBookmark: string) {
    const spec = this.pollBookmarks[pollBookmark]
    if (!spec) {
        throw new Error(`Poll bookmark "${pollBookmark}" is unknown`)
    }

    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.editPoll(spec.question)
    await this.pollFormPage.waitForLoaded()
})

When('I enter poll question {string}', async function (question: string) {
    await this.pollFormPage.enterQuestion(question)
})

When('I enter poll answers', async function (answerTable: DataTable) {
    await this.pollFormPage.enterAnswers(answerTable.raw().map(row => `${row[0]}`))
})

When('I enter poll answer {int} text {string}', async function (answerNumber: number, text: string) {
    await this.pollFormPage.enterAnswer(answerNumber - 1, text)
})

When('I submit the poll', async function () {
    await this.pollFormPage.submit()
})

Then('I see poll form question {string}', async function (question: string) {
    await this.pollFormPage.expectQuestionValue(question)
})

Then('I see poll form answers', async function (answerTable: DataTable) {
    await this.pollFormPage.expectAnswerValues(answerTable.raw().map(row => `${row[0]}`))
})
