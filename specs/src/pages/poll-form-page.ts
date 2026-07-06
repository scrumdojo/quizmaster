import { expect, type Page } from '@playwright/test'

// Submit fires POST (create) or PUT (update) against the workspace polls route.
const SUBMIT_URL = /\/api\/workspaces\/[^/]+\/polls(\/\d+)?$/
const SUBMIT_METHODS = new Set(['POST', 'PUT'])

export class PollFormPage {
    constructor(private page: Page) {}

    waitForLoaded = () => this.page.locator('#create-poll-page, #edit-poll-page').waitFor({ state: 'visible' })

    private questionInput = () => this.page.locator('#poll-question')
    private answerInputs = () => this.page.locator('input.poll-answer')
    private addAnswerButton = () => this.page.locator('#add-poll-answer')

    enterQuestion = (question: string) => this.questionInput().fill(question)

    enterAnswer = (index: number, text: string) => this.answerInputs().nth(index).fill(text)

    enterAnswers = async (answers: readonly string[]) => {
        for (const [idx, answer] of answers.entries()) {
            if ((await this.answerInputs().count()) <= idx) {
                await this.addAnswerButton().click()
            }
            await this.enterAnswer(idx, answer)
        }
    }

    expectQuestionValue = (question: string) => expect(this.questionInput()).toHaveValue(question)

    expectAnswerValues = async (answers: readonly string[]) => {
        await expect(this.answerInputs()).toHaveCount(answers.length)
        for (const [idx, answer] of answers.entries()) {
            await expect(this.answerInputs().nth(idx)).toHaveValue(answer)
        }
    }

    submit = async () => {
        const pendingResponse = this.page.waitForResponse(
            response => SUBMIT_URL.test(response.url()) && SUBMIT_METHODS.has(response.request().method()),
        )
        await this.page.locator('button[type="submit"]').click()
        await pendingResponse
    }
}
