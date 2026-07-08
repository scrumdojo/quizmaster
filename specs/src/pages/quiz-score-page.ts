import { expect, type Page } from '@playwright/test'

export class QuizScorePage {
    constructor(private page: Page) {}

    private resultTableLocator = () => this.page.locator('#results')
    resultTableExists = () => this.resultTableLocator().isVisible()

    private correctAnswerLocator = () => this.page.locator('#correct-answers')

    private totalQuestionsLocator = () => this.page.locator('#total-questions')
    totalQuestions = () => this.totalQuestionsLocator().textContent().then(Number)

    private percentageResultLocator = () => this.page.locator('#percentage-result')

    private passScoreLocator = () => this.page.locator('#pass-score')

    private textResultLocator = () => this.page.locator('#text-result')

    private questionsLocator = () => this.page.locator('fieldset[id^="question-"]')
    questions = async () => {
        await expect(this.questionsLocator().first()).toBeVisible()
        return this.page.locator('[id^="question-name-"]').allTextContents()
    }

    private questionLocator = (question: string) => this.questionsLocator().filter({ hasText: question })

    private waitForQuestion = async (question: string) => {
        await expect(this.questionLocator(question)).toBeVisible()
    }

    private answerAndExplanationLocator = (question: string) =>
        this.questionLocator(question).locator('li[id^=answer-row-]')

    answerListLocator = (question: string) => this.questionLocator(question).locator('[id^=question-answers-]')

    private numericalResultLocator = (question: string) => this.questionLocator(question).locator('.numerical-result')
    correctAnswerBarLocator = (question: string) =>
        this.numericalResultLocator(question).locator('[data-testid=correct-bar]')
    userAnswerBarLocator = (question: string) => this.numericalResultLocator(question).locator('[data-testid=user-bar]')
    numericalWithinToleranceBarLocator = (question: string) =>
        this.numericalResultLocator(question).locator('.numerical-bar.within-tolerance')
    numericalIncorrectBarLocator = (question: string) =>
        this.numericalResultLocator(question).locator('.numerical-bar.incorrect')

    private extractNumber = (text: string | null): string => {
        const match = (text ?? '').match(/:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/)
        return match ? match[1] : ''
    }

    answers = async (question: string) => {
        await this.waitForQuestion(question)
        const numericalCount = await this.numericalResultLocator(question).count()
        if (numericalCount > 0) {
            const text = await this.correctAnswerBarLocator(question).textContent()
            return [this.extractNumber(text)]
        }
        const labels = this.answerListLocator(question).locator('[id^=answer-label-]')
        await expect(labels.first()).toBeVisible()
        return labels.allTextContents()
    }

    explanations = (question: string) =>
        this.answerAndExplanationLocator(question).locator('.explanationText').allTextContents()

    questionExplanation = async (question: string) => {
        await this.waitForQuestion(question)
        return this.questionLocator(question).locator('.question-explanation').textContent()
    }

    private checkedUserSelectLocator = (question: string) => this.questionLocator(question).locator('input:checked')
    checkedAnswerLabel = async (question: string) => {
        await this.waitForQuestion(question)
        const numericalCount = await this.numericalResultLocator(question).count()
        if (numericalCount > 0) {
            const userCount = await this.userAnswerBarLocator(question).count()
            const text =
                userCount > 0
                    ? await this.userAnswerBarLocator(question).textContent()
                    : await this.correctAnswerBarLocator(question).textContent()
            return this.extractNumber(text)
        }
        return this.checkedUserSelectLocator(question).locator('..').locator('[id^=answer-label-]').textContent()
    }

    private questionAnswerLocator = (question: string, answer: string) =>
        this.answerAndExplanationLocator(question).getByText(answer)
    private answerCorrespondingResponseLocator = (question: string, answer: string) =>
        this.questionAnswerLocator(question, answer).locator('..').locator('..').locator('.feedback')
    answerCorrespondingResponse = (question: string, answer: string) =>
        this.answerCorrespondingResponseLocator(question, answer).textContent()

    private weightedPointsLocator = () => this.page.locator('#weighted-points')
    private totalWeightLocator = () => this.page.locator('#total-weight')

    private mistakesSummaryLocator = () => this.page.locator('#mistakes-summary')
    private mistakesSummaryQuestionsLocator = () => this.mistakesSummaryLocator().locator('li .mistake-question')
    mistakesSummaryQuestions = async () => {
        await this.expectResultTableVisible()
        await expect(this.mistakesSummaryQuestionsLocator().first()).toBeVisible()
        return this.mistakesSummaryQuestionsLocator().allTextContents()
    }

    private mistakesSummaryItemLocator = (question: string) =>
        this.mistakesSummaryLocator()
            .locator('li')
            .filter({ has: this.page.locator('.mistake-question', { hasText: question }) })
    private missedBeforeNoteLocator = (question: string) =>
        this.mistakesSummaryItemLocator(question).locator('.missed-before-note')
    expectMissedBeforeNote = async (question: string) => {
        await this.expectResultTableVisible()
        await expect(this.missedBeforeNoteLocator(question)).toBeVisible()
    }
    expectNoMissedBeforeNote = async (question: string) => {
        await this.expectResultTableVisible()
        await expect(this.missedBeforeNoteLocator(question)).toHaveCount(0)
    }

    // Retrying assertions
    expectResultTableVisible = () => expect(this.resultTableLocator()).toBeVisible()
    expectCorrectAnswers = (text: string) => expect(this.correctAnswerLocator()).toHaveText(text)
    expectTotalQuestions = (n: number) => expect(this.totalQuestionsLocator()).toHaveText(String(n))
    expectPercentageResult = (n: number) => expect(this.percentageResultLocator()).toHaveText(String(n))
    expectTextResult = (text: string) => expect(this.textResultLocator()).toHaveText(text)
    expectPassScore = (n: number) => expect(this.passScoreLocator()).toHaveText(String(n))
    expectWeightedScore = (points: number, total: number) =>
        Promise.all([
            expect(this.weightedPointsLocator()).toHaveText(String(points)),
            expect(this.totalWeightLocator()).toHaveText(String(total)),
        ])
    expectNoMistakesSummary = async () => {
        await this.expectResultTableVisible()
        await expect(this.mistakesSummaryLocator()).toHaveCount(0)
    }
}
