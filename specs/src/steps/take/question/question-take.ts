import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { expectTextToBe } from '#steps/common.ts'
import { Then, When } from '#steps/fixture.ts'
import { expectColorFeedback, expectQuestion } from '#steps/question/expects.ts'
import { answerQuestion } from '#steps/take/question/ops.ts'
import type { QuizmasterWorld } from '#steps/world'

const AI_RESPONSE_TIMEOUT = 120_000

// Sends the composer content and waits for the unified explanation-chat endpoint to answer.
const askExplanationChat = async (world: QuizmasterWorld, prompt: string) => {
    await world.takeQuestionPage.fillExplanationChatPrompt(prompt)
    await Promise.all([
        world.page.waitForResponse(response => response.url().includes('/explanation-chat') && response.ok(), {
            timeout: AI_RESPONSE_TIMEOUT,
        }),
        world.takeQuestionPage.sendExplanationChatPrompt(),
    ])
}

When('I take question {string}', async function (bookmark: string) {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.takeQuestion(this.questionBookmarks[bookmark].text)
    await this.takeQuestionPage.waitForLoaded()
    this.activeQuestionBookmark = bookmark
})

Then('I see the question and the answers', async function () {
    await expectQuestion(this.takeQuestionPage, this.activeQuestion)
})

When('I answer {string}', async function (answerList: string) {
    await answerQuestion(this, answerList)
})

When(/^I press the key ([0-9](?:,[0-9])*)$/, async function (keysInput: string) {
    await this.takeQuestionPage.waitForLoaded()

    const keys = keysInput
        .split(',')
        .map(key => key.trim())
        .filter(key => key.length > 0)

    if (keys.length === 0) {
        throw new Error('At least one key must be provided')
    }

    await this.page.click('body')

    for (const key of keys) {
        const num = Number(key)
        if (!Number.isInteger(num) || num < 1 || num > 9) {
            throw new Error(`Invalid numeric key: ${key}. Allowed keys are 1-9.`)
        }

        await this.page.keyboard.press(`Digit${num}`)
    }
})

When('I press enter to submit', async function () {
    await this.page.click('body')
    const submitButton = this.page.locator('input[type="submit"]')
    if ((await submitButton.count()) > 0) {
        await expect(submitButton).toBeEnabled()
    }
    await this.page.keyboard.press('Enter')
})

When('I uncheck answer {string}', async function (answerList: string) {
    const answers = this.parseAnswers(answerList)
    for (const answer of answers) {
        await this.takeQuestionPage.unselectAnswer(answer)
    }
})

When('I check answer {string}', async function (answerList: string) {
    const answers = this.parseAnswers(answerList)
    for (const answer of answers) {
        await this.takeQuestionPage.selectAnswer(answer)
    }
})

Then('I see feedback {string}', async function (feedback: string) {
    await expectTextToBe(this.takeQuestionPage.questionFeedbackLocator(), feedback)
})

Then('I see score {string}', async function (score: string) {
    await expectTextToBe(this.takeQuestionPage.questionScoreLocator(), score)
})

Then('no answer is selected', async function () {
    await this.takeQuestionPage.expectNoAnswerSelected()
})

Then('I see the question explanation', async function () {
    await expectTextToBe(this.takeQuestionPage.questionExplanationLocator(), this.activeQuestion.explanation ?? '')
})

Then('the explanation chat is collapsed', async function () {
    await this.takeQuestionPage.expectExplanationChatCollapsed()
})

When('I expand the explanation chat', async function () {
    await this.takeQuestionPage.expandExplanationChat()
})

Then('I see the explanation chat composer', async function () {
    await this.takeQuestionPage.expectExplanationChatComposerVisible()
})

When('I ask the explanation chat {string}', async function (prompt: string) {
    await askExplanationChat(this, prompt)
})

When('I collapse the explanation chat', async function () {
    await this.takeQuestionPage.collapseExplanationChat()
})

Then('I see a reply in the explanation chat', async function () {
    await this.takeQuestionPage.expectExplanationChatReplyVisible()
})

Then('I see a reply in the explanation chat mentioning {string}', async function (text: string) {
    await this.takeQuestionPage.expectExplanationChatReplyContaining(text)
})

Then('I see my question {string} in the explanation chat', async function (text: string) {
    await this.takeQuestionPage.expectExplanationChatUserMessage(text)
})

Then('I see individual explanations per answer:', async function (dataTable: DataTable) {
    const rows = dataTable.hashes()
    for (const row of rows) {
        const { answer, explanation } = row
        await expect(this.takeQuestionPage.answerExplanationLocator(answer)).toHaveText(explanation)
    }
})

Then('I see individual color feedback per answer:', async function (dataTable: DataTable) {
    await expectColorFeedback(this.takeQuestionPage, dataTable.hashes())
})

Then('I see that the question has {int} correct answers', async function (count: number) {
    await this.takeQuestionPage.expectCorrectAnswersCount(count)
})

Then('I do not see correct answers count', async function () {
    await this.takeQuestionPage.expectSubmitVisible()
    await this.takeQuestionPage.expectCorrectAnswersCountNotAttached()
})

Then('I see the question image', async function () {
    await this.takeQuestionPage.expectQuestionImage()
})

Then('I do not see a question image', async function () {
    await this.takeQuestionPage.expectNoQuestionImage()
})

Then('I see question title {string}', async function (text: string) {
    await this.takeQuestionPage.expectQuestionText(text)
})
