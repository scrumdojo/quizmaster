import { expect, type Page } from '@playwright/test'

export class RobinSheetPage {
    constructor(private page: Page) {}

    private fabLocator = () => this.page.locator('.robin-fab .trigger')
    private promptLocator = () => this.page.locator('#robin-prompt-text')
    private generatedQuestionsLocator = () => this.page.getByTestId('robin-generated-question')
    private generatedQuestionLocator = (index: number) => this.generatedQuestionsLocator().nth(index - 1)
    private generatedQuestionNumberLocator = (index: number) =>
        this.generatedQuestionLocator(index).getByTestId('robin-generated-question-number')
    private generatedQuestionTitleLocator = (index: number) =>
        this.generatedQuestionLocator(index).getByTestId('robin-generated-question-title')
    private generatedQuestionAnswersLocator = (index: number) =>
        this.generatedQuestionLocator(index).getByTestId('robin-generated-answer')
    private generatedQuestionAnswerLocator = (index: number, answer: string) =>
        this.generatedQuestionAnswersLocator(index).filter({ hasText: answer })
    private generatedQuestionAnswerCorrectBadgeLocator = (index: number, answer: string) =>
        this.generatedQuestionAnswerLocator(index, answer).getByTestId('robin-generated-answer-correct')
    private generatedQuestionNumericalAnswerLocator = (index: number) =>
        this.generatedQuestionLocator(index).getByTestId('robin-generated-numerical-answer')
    private generatedQuestionToleranceLocator = (index: number) =>
        this.generatedQuestionLocator(index).getByTestId('robin-generated-tolerance')
    private generatedQuestionExplanationLocator = (index: number) =>
        this.generatedQuestionLocator(index).getByTestId('robin-generated-question-explanation')
    private generatedQuestionAnswerExplanationsLocator = (index: number) =>
        this.generatedQuestionLocator(index).getByTestId('robin-generated-answer-explanation')
    private draftVersionsLocator = () => this.page.getByTestId('robin-draft-version')
    private draftVersionLocator = (version: number) => this.draftVersionsLocator().nth(version - 1)
    private versionQuestionLocator = (version: number, index: number) =>
        this.draftVersionLocator(version)
            .getByTestId('robin-generated-question')
            .nth(index - 1)
    private versionQuestionAnswersLocator = (version: number, index: number) =>
        this.versionQuestionLocator(version, index).getByTestId('robin-generated-answer')
    private versionQuestionCorrectBadgesLocator = (version: number, index: number) =>
        this.versionQuestionLocator(version, index).getByTestId('robin-generated-answer-correct')
    private versionQuestionUseButtonLocator = (version: number, index: number) =>
        this.versionQuestionLocator(version, index).locator('#robin-use-button')
    private saveQuestionButtonLocator = (index: number) =>
        this.generatedQuestionLocator(index).locator('#robin-save-question-button')
    private saveAllButtonLocator = () => this.page.locator('#robin-save-all-button')
    private noticeLocator = () => this.page.getByTestId('robin-chat-notice')

    open = async () => {
        await expect(this.fabLocator()).toBeVisible({ timeout: 3_000 })
        await this.fabLocator().click()
        await expect(this.promptLocator()).toBeVisible({ timeout: 3_000 })
    }

    enterPrompt = (prompt: string) => this.promptLocator().fill(prompt)
    sendPromptByEnter = () => this.promptLocator().press('Enter')
    generate = () => this.sendPromptByEnter()

    useGeneratedQuestion = () => this.page.locator('#robin-use-button').first().click()
    useQuestionFromVersion = (version: number, index: number) =>
        this.versionQuestionUseButtonLocator(version, index).click()
    saveGeneratedQuestion = (index: number) => this.saveQuestionButtonLocator(index).click()
    saveAllGeneratedQuestions = () => this.saveAllButtonLocator().click()

    expectPromptVisible = () => expect(this.promptLocator().first()).toBeVisible()
    expectPromptNotVisible = () => expect(this.promptLocator().first()).not.toBeVisible()

    expectGeneratedQuestionCount = (count: number) => expect(this.generatedQuestionsLocator()).toHaveCount(count)
    expectGeneratedQuestionVisible = (index: number) => expect(this.generatedQuestionLocator(index)).toBeVisible()
    expectGeneratedQuestionNumber = (index: number) =>
        expect(this.generatedQuestionNumberLocator(index)).toHaveText(`${index}.`)
    expectGeneratedQuestionTitle = (index: number, title: string) =>
        expect(this.generatedQuestionTitleLocator(index)).toHaveText(title)
    generatedQuestionTitleText = async (index: number): Promise<string> =>
        (await this.generatedQuestionTitleLocator(index).textContent())?.trim() ?? ''
    expectGeneratedQuestionAnswerCount = (index: number, count: number) =>
        expect(this.generatedQuestionAnswersLocator(index)).toHaveCount(count)
    expectGeneratedQuestionAnswerCountAtLeast = async (index: number, count: number) =>
        expect.poll(() => this.generatedQuestionAnswersLocator(index).count()).toBeGreaterThanOrEqual(count)
    expectGeneratedQuestionCorrectAnswerCount = (index: number, count: number) =>
        expect(this.generatedQuestionLocator(index).getByTestId('robin-generated-answer-correct')).toHaveCount(count)
    expectGeneratedQuestionCorrectAnswerCountAtLeast = async (index: number, count: number) =>
        expect
            .poll(() => this.generatedQuestionLocator(index).getByTestId('robin-generated-answer-correct').count())
            .toBeGreaterThanOrEqual(count)
    expectGeneratedAnswer = async (index: number, answer: string, correct: boolean) => {
        await expect(this.generatedQuestionAnswerLocator(index, answer)).toBeVisible()
        if (correct) {
            await expect(this.generatedQuestionAnswerCorrectBadgeLocator(index, answer)).toBeVisible()
        } else {
            await expect(this.generatedQuestionAnswerCorrectBadgeLocator(index, answer)).not.toBeVisible()
        }
    }
    expectGeneratedQuestionNumericalAnswerVisible = (index: number) =>
        expect(this.generatedQuestionNumericalAnswerLocator(index)).toBeVisible()
    expectGeneratedQuestionNumericalAnswer = (index: number, value: string) =>
        expect(this.generatedQuestionNumericalAnswerLocator(index)).toHaveText(value)
    generatedQuestionTolerance = async (index: number): Promise<number> => {
        const text = (await this.generatedQuestionToleranceLocator(index).textContent())?.trim() ?? ''
        return Number.parseFloat(text)
    }
    expectGeneratedQuestionToleranceVisible = (index: number) =>
        expect(this.generatedQuestionToleranceLocator(index)).toBeVisible()
    expectGeneratedQuestionToleranceGreaterThan = async (index: number, threshold: number) => {
        expect(await this.generatedQuestionTolerance(index)).toBeGreaterThan(threshold)
    }
    expectGeneratedQuestionToleranceLessThan = async (index: number, threshold: number) => {
        expect(await this.generatedQuestionTolerance(index)).toBeLessThan(threshold)
    }
    expectGeneratedQuestionExplanationVisible = (index: number) =>
        expect(this.generatedQuestionExplanationLocator(index)).toBeVisible()
    expectEveryAnswerExplained = async (index: number) => {
        const answerCount = await this.generatedQuestionAnswersLocator(index).count()
        expect(answerCount).toBeGreaterThan(0)
        await expect(this.generatedQuestionAnswerExplanationsLocator(index)).toHaveCount(answerCount)
    }

    expectDraftVersionCount = (count: number) => expect(this.draftVersionsLocator()).toHaveCount(count)
    versionQuestionAnswerCount = (version: number, index: number) =>
        this.versionQuestionAnswersLocator(version, index).count()
    expectVersionQuestionAnswerCount = (version: number, index: number, count: number) =>
        expect(this.versionQuestionAnswersLocator(version, index)).toHaveCount(count)
    expectVersionQuestionCorrectAnswerCount = (version: number, index: number, count: number) =>
        expect(this.versionQuestionCorrectBadgesLocator(version, index)).toHaveCount(count)
    expectVersionQuestionUsable = (version: number, index: number) =>
        expect(this.versionQuestionUseButtonLocator(version, index)).toBeVisible()

    generatedQuestionCorrectBadgeCounts = async (): Promise<number[]> => {
        const cards = await this.generatedQuestionsLocator().all()
        return Promise.all(cards.map(card => card.getByTestId('robin-generated-answer-correct').count()))
    }
    numericalGeneratedQuestionCount = () =>
        this.generatedQuestionsLocator()
            .filter({ has: this.page.getByTestId('robin-generated-numerical-answer') })
            .count()

    expectNoticeVisible = () => expect(this.noticeLocator().first()).toBeVisible()
    expectComposerUsable = async () => {
        await expect(this.promptLocator()).toBeVisible()
        await expect(this.promptLocator()).toBeEnabled()
    }
}
