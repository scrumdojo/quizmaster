import type { Page } from '@playwright/test'

// Submit fires POST against the workspace polls route.
const SUBMIT_URL = /\/api\/workspaces\/[^/]+\/polls$/

export class PollCreatePage {
    constructor(private page: Page) {}

    waitForLoaded = () => this.page.locator('#create-poll-page').waitFor({ state: 'visible' })

    enterQuestion = (question: string) => this.page.locator('#poll-question').fill(question)

    private answerInputs = () => this.page.locator('input.poll-answer')
    private addAnswerButton = () => this.page.locator('#add-poll-answer')

    enterAnswers = async (answers: readonly string[]) => {
        for (const [idx, answer] of answers.entries()) {
            if ((await this.answerInputs().count()) <= idx) {
                await this.addAnswerButton().click()
            }
            await this.answerInputs().nth(idx).fill(answer)
        }
    }

    submit = async () => {
        const pendingResponse = this.page.waitForResponse(
            response => SUBMIT_URL.test(response.url()) && response.request().method() === 'POST',
        )
        await this.page.locator('button[type="submit"]').click()
        await pendingResponse
    }
}
