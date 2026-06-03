import { expect, type Page } from '@playwright/test'

import type { QuizMode, Difficulty } from '#steps/shared/specs.ts'

// Submit fires POST (create) or PUT (update) against the workspace quizzes route.
const SUBMIT_URL = /\/api\/workspaces\/[^/]+\/quizzes(\/\d+)?$/
const SUBMIT_METHODS = new Set(['POST', 'PUT'])
// Short window to detect whether a network request was triggered at all;
// validation errors short-circuit submit without a request, so we don't want
// to block tests in that case.
const SUBMIT_WAIT_TIMEOUT_MS = 1000

export class QuizCreatePage {
    constructor(private page: Page) {}
    timeLimitInput = () => this.page.locator('#time-limit')
    formattedTimeLimitLabel = () => this.page.locator('#formatted-time-limit')
    passScoreInput = () => this.page.locator('#pass-score')
    startDateTimeInput = () => this.page.locator('#quiz-start-at')
    endDateTimeInput = () => this.page.locator('#quiz-end-at')
    questionsInList = () => this.page.locator('.create-quiz > .question-item')
    getQuestion = (question: string) => this.page.locator('label', { hasText: question })
    selectQuestion = async (question: string) => this.page.locator('label', { hasText: question }).click()
    selectRandomizedFunction = () => this.page.locator('#isRandomized').check()
    selectFeedbackMode = (mode: QuizMode) => this.page.locator(`#mode-${mode}`).check()
    selectDifficulty = async (difficulty: Difficulty) => {
        await this.page.locator(`#difficulty-${difficulty}`).check()
    }

    private submitLocator = () => this.page.locator('button[type="submit"]')
    submit = async () => {
        const pendingSubmit = this.waitForSubmitRequest()
        await this.submitLocator().click()
        const request = await pendingSubmit
        await request?.response()
    }

    private waitForSubmitRequest = () =>
        this.page
            .waitForRequest(req => SUBMIT_URL.test(req.url()) && SUBMIT_METHODS.has(req.method()), {
                timeout: SUBMIT_WAIT_TIMEOUT_MS,
            })
            .catch(() => null)

    getQuizTitleValue = () => this.page.locator('#quiz-title').inputValue()
    getQuizDescriptionValue = () => this.page.locator('#quiz-description').inputValue()
    enterQuizName = (title: string) => this.page.locator('#quiz-title').fill(title)
    enterQuizFinalCount = (finalCount: string) =>
        this.page.locator('#quiz-randomQuestionCount').fill(finalCount.toString())
    enterDescription = (description: string) => this.page.locator('#quiz-description').fill(description)
    enterStartDateTime = (startDateTime: string) => this.startDateTimeInput().fill(startDateTime)
    enterEndDateTime = (endDateTime: string) => this.endDateTimeInput().fill(endDateTime)
    errorMessageLocator = () => this.page.locator('.alert.error')
    hasError = (errorTestId: string) => this.page.getByTestId(errorTestId).isVisible()
    clearTimeLimit = () => this.timeLimitInput().fill('')
    clearScore = () => this.passScoreInput().fill('')
    hasAnyError = () => this.page.locator('.alert.error').isVisible()
    enterFilterString = (filter: string) => this.page.locator('#question-filter').fill(filter)
    selectedQuestionCountForQuiz = async () => this.page.locator('#selected-question-count-for-quiz').innerHTML()
    totalQuestionCountForQuiz = async () => this.page.locator('#total-question-count-for-quiz').innerHTML()

    // Retrying assertions
    private quizTitleLocator = () => this.page.locator('#quiz-title')
    private quizDescriptionLocator = () => this.page.locator('#quiz-description')
    private selectedQuestionCountLocator = () => this.page.locator('#selected-question-count-for-quiz')
    private totalQuestionCountLocator = () => this.page.locator('#total-question-count-for-quiz')

    expectQuizTitleValue = (value: string) => expect(this.quizTitleLocator()).toHaveValue(value)
    expectQuizDescriptionValue = (value: string) => expect(this.quizDescriptionLocator()).toHaveValue(value)
    expectTimeLimitValue = (value: string) => expect(this.timeLimitInput()).toHaveValue(value)
    expectPassScoreValue = (value: string) => expect(this.passScoreInput()).toHaveValue(value)
    expectSelectedQuestionCount = (count: number) =>
        expect(this.selectedQuestionCountLocator()).toHaveText(String(count))
    expectTotalQuestionCount = (count: number) => expect(this.totalQuestionCountLocator()).toHaveText(String(count))

    // ── Question tag badge ───────────────────────────

    private questionTagBadgeLocator = (question: string) =>
        this.page.locator('.question-item').filter({ hasText: question }).locator('.question-tag-badge')
    expectQuestionTagBadge = (question: string, tag: string) =>
        expect(this.questionTagBadgeLocator(question)).toHaveText(tag)
    expectQuestionTagBadgeNotVisible = (question: string) =>
        expect(this.questionTagBadgeLocator(question)).not.toBeVisible()

    // ── Inline question creation modal ────────────────────────────────────────

    clickCreateNewQuestion = () => this.page.locator('#quiz-create-new-question').click()

    expectInlineQuestionModalVisible = () => expect(this.page.locator('#inline-question-modal')).toBeVisible()

    fillInlineQuestion = async (questionText: string, answerText: string) => {
        const modal = this.page.locator('#inline-question-modal')
        await modal.locator('#question-text').fill(questionText)
        // Fill first answer as correct, second as wrong
        const answerInputs = modal.locator('.answer-row input.text, .answer-row .text input')
        await answerInputs.first().fill(answerText)
        await modal.locator('.answer-row input[type="radio"], .answer-row input[type="checkbox"]').first().check()
        await answerInputs.nth(1).fill('wrong answer')
    }

    saveInlineQuestion = async () => {
        await this.page.locator('#inline-question-modal').locator('button[type="submit"]').click()
        await this.page.waitForLoadState('networkidle')
    }

    expectOnQuizCreationForm = () => expect(this.page.locator('#create-quiz-page')).toBeVisible()

    expectQuestionInList = (question: string) =>
        expect(this.page.locator('.question-item', { hasText: question })).toBeVisible()
}
