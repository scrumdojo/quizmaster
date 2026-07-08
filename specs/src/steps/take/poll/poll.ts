import type { DataTable } from '@cucumber/cucumber'

import { Given, Then, When } from '#steps/fixture.ts'
import type { PollSpec } from '#steps/shared/specs.ts'
import { createPoll, openPoll } from '#steps/take/poll/ops.ts'
import type { QuizmasterWorld } from '#steps/world'

const requirePollSpec = (world: QuizmasterWorld): PollSpec => {
    if (!world.pollWip) {
        throw new Error('No poll spec in progress — start with `Given poll "..." asking "..."`')
    }
    return world.pollWip
}

Given('poll {string} asking {string}', function (bookmark: string, question: string) {
    this.pollWip = {
        bookmark,
        question,
        answers: [],
    }
})

Given('with poll answers:', async function (answerTable: DataTable) {
    const spec = requirePollSpec(this)
    spec.answers = answerTable.raw().map(row => row[0])
    await createPoll(this, spec)
    this.pollWip = undefined
})

When('I take poll {string}', async function (bookmark: string) {
    await openPoll(this, bookmark)
})

When('I select poll answer {string}', async function (answer: string) {
    await this.takePollPage.selectAnswer(answer)
})

When('I submit the poll vote', async function () {
    await this.takePollPage.submitVote()
})

Then('I see poll question {string}', async function (question: string) {
    await this.takePollPage.expectQuestionText(question)
})

Then('I see poll answers:', async function (answerTable: DataTable) {
    const answers = answerTable.raw().map(row => row[0])
    await this.takePollPage.expectAnswerCount(answers.length)
    for (const answer of answers) {
        await this.takePollPage.expectAnswerVisible(answer)
    }
})

Then('no poll answer is selected', async function () {
    await this.takePollPage.expectNoAnswerSelected()
})

Then('only poll answer {string} is selected', async function (answer: string) {
    await this.takePollPage.expectOnlyAnswerSelected(answer)
})

Then('I see thank you for voting', async function () {
    await this.takePollPage.expectThankYouVisible()
})

Then('I see an image for poll answer {string}', async function (answer: string) {
    await this.takePollPage.expectAnswerImageVisible(answer)
})

Then('I do not see an image for poll answer {string}', async function (answer: string) {
    await this.takePollPage.expectNoAnswerImage(answer)
})
