import { expect, type Page } from '@playwright/test'

export class TakeQuestionPage {
    constructor(private page: Page) {}

    private questionLocator = () => this.page.locator('h1#question')
    questionText = () => this.questionLocator().textContent()
    questionImageLocator = (filename: string) => this.page.locator(`img[src*="${filename}"]`)
    private questionImageLocator_ = () => this.page.locator('img.question-image')

    waitForLoaded = async () => {
        await this.page
            .locator('h1#question, input[type="submit"], p.question-feedback')
            .first()
            .waitFor({ state: 'visible' })
    }

    private answersLocator = () => this.page.locator('ul.answers > li')
    answerLocator = (answer: string) =>
        this.answersLocator().filter({ has: this.page.locator(`input[value="${answer}"]`) })

    answerRowLocator = (answer: string) => this.answerLocator(answer).locator('.answer-input-row')
    answerFeedbackLocator = (answer: string) => this.answerRowLocator(answer).locator('.answer-feedback')
    answerCheckLocator = (answer: string) => this.answerRowLocator(answer).locator('input')
    private answerCheckNthLocator = (number: number) => this.answersLocator().nth(number).locator('input')
    answerExplanationLocator = (answer: string) => this.answerLocator(answer).locator('.explanation')

    correctAnswersCountLocator = () => this.page.locator('.correct-answers-count')

    selectAnswer = async (answer: string) => {
        await expect(this.answerCheckLocator(answer)).toBeVisible()
        await this.answerCheckLocator(answer).check({ force: true })
    }
    selectAnswerNth = async (number: number) => {
        await expect(this.answerCheckNthLocator(number)).toBeVisible()
        await this.answerCheckNthLocator(number).check({ force: true })
    }
    unselectAnswer = (answer: string) => this.answerCheckLocator(answer).uncheck()
    private selectedAnswersLocator = () => this.answersLocator().locator('input:checked')

    private submitButtonLocator = () => this.page.locator('input[type="submit"]')
    submit = async () => {
        await expect(this.submitButtonLocator()).toBeVisible()
        await this.submitButtonLocator().click({ force: true })
    }

    questionFeedbackLocator = () => this.page.locator('p.question-feedback')
    questionScoreLocator = () => this.page.locator('p.question-score')
    questionExplanationLocator = () => this.page.locator('p.question-explanation')

    numericalInputLocator = () => this.page.locator('input[type="number"]')
    private numericalAnswerDigitsHintLocator = () =>
        this.page.locator('.question-fieldset p', { hasText: /decimal digits/i })
    fillNumericalInput = (answer: string) => this.numericalInputLocator().fill(answer)
    fillNumericalAnswer = async (answer: string) => {
        await this.numericalInputLocator().fill(answer)
        await this.submit()
    }

    // Retrying assertions
    expectQuestionText = (text: string) => expect(this.questionLocator()).toHaveText(text)
    expectQuestionTextNotToBe = (text: string) => expect(this.questionLocator()).not.toHaveText(text)
    expectAnswerCount = (count: number) => expect(this.answersLocator()).toHaveCount(count)
    expectAnswerText = (index: number, text: string) => expect(this.answersLocator().nth(index)).toHaveText(text)
    expectNoAnswerSelected = () => expect(this.selectedAnswersLocator()).toHaveCount(0)
    expectAnswerChecked = (answer: string) => expect(this.answerCheckLocator(answer)).toBeChecked()
    expectSubmitEnabled = () => expect(this.submitButtonLocator()).toBeEnabled()
    expectSubmitDisabled = () => expect(this.submitButtonLocator()).toBeDisabled()
    expectSubmitVisible = () => expect(this.submitButtonLocator()).toBeVisible()
    expectCorrectAnswersCount = (count: number) => expect(this.correctAnswersCountLocator()).toHaveText(String(count))
    expectCorrectAnswersCountAttached = () => expect(this.correctAnswersCountLocator()).toBeAttached()
    expectCorrectAnswersCountNotAttached = () => expect(this.correctAnswersCountLocator()).not.toBeAttached()
    expectQuestionImage = () => expect(this.questionImageLocator_()).toBeVisible()
    expectNoQuestionImage = () => expect(this.questionImageLocator_()).not.toBeVisible()
    expectNoQuestionFeedback = () => expect(this.questionFeedbackLocator()).not.toBeVisible()
    expectQuestionTextNotContaining = (text: string) => expect(this.questionLocator()).not.toContainText(text)
    expectNumericalAnswerDigitsHint = (digits: number) =>
        expect(this.numericalAnswerDigitsHintLocator()).toContainText(
            new RegExp(`\\b${digits}\\s+decimal\\s+digits?\\b`, 'i'),
        )
    expectNoNumericalAnswerDigitsHint = () => expect(this.numericalAnswerDigitsHintLocator()).not.toBeAttached()
}
