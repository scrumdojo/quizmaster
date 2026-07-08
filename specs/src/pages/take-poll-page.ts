import { expect, type Page } from '@playwright/test'

export class TakePollPage {
    constructor(private page: Page) {}

    private pollQuestionLocator = () => this.page.locator('h1, [data-testid="poll-question"], #poll-question').first()

    private pollAnswerInputsLocator = () => this.page.locator('input[type="radio"]')

    private pollAnswerInputLocator = (answer: string) =>
        this.page
            .getByLabel(answer, { exact: true })
            .or(this.page.locator(`input[type="radio"][value="${answer}"]`))
            .first()

    private submitButtonLocator = () =>
        this.page
            .getByRole('button', { name: /vote|submit|send/i })
            .or(this.page.locator('input[type="submit"]'))
            .first()

    thankYouLocator = () => this.page.getByText(/thank you for voting/i).first()

    waitForLoaded = async () => {
        await expect(this.pollQuestionLocator().or(this.thankYouLocator())).toBeVisible()
    }

    pollQuestionText = () => this.pollQuestionLocator().textContent()
    selectAnswer = (answer: string) => this.pollAnswerInputLocator(answer).check()
    submitVote = () => this.submitButtonLocator().click()

    private selectedAnswersLocator = () => this.page.locator('input[type="radio"]:checked')

    private pollAnswerImageLocator = (answer: string) =>
        this.page.locator('.poll-answer', { hasText: answer }).locator('img')

    expectQuestionText = (text: string) => expect(this.pollQuestionLocator()).toHaveText(text)
    expectAnswerCount = (count: number) => expect(this.pollAnswerInputsLocator()).toHaveCount(count)
    expectAnswerVisible = (answer: string) => expect(this.page.getByText(answer, { exact: true }).first()).toBeVisible()
    expectNoAnswerSelected = () => expect(this.selectedAnswersLocator()).toHaveCount(0)
    expectOnlyAnswerSelected = async (answer: string) => {
        await expect(this.selectedAnswersLocator()).toHaveCount(1)
        await expect(this.pollAnswerInputLocator(answer)).toBeChecked()
    }
    expectThankYouVisible = () => expect(this.thankYouLocator()).toBeVisible()
    expectAnswerImageVisible = (answer: string) => expect(this.pollAnswerImageLocator(answer)).toBeVisible()
    expectNoAnswerImage = (answer: string) => expect(this.pollAnswerImageLocator(answer)).toHaveCount(0)
}
