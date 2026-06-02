import { expect, type Page } from '@playwright/test'

export class RobinSheetPage {
    constructor(private page: Page) {}

    private fabLocator = () => this.page.locator('.robin-fab .trigger')
    private sheetLocator = () => this.page.getByTestId('robin-sheet')
    private composerLocator = () => this.page.getByTestId('robin-composer')
    private promptLocator = () => this.page.locator('#robin-prompt-text')
    private chatMessageLocator = () => this.page.getByTestId('robin-chat-message')
    private generateButtonLocator = () => this.page.locator('#robin-generate-button')
    private saveButtonLocator = () => this.page.locator('#robin-save-button')
    private questionTypeRadio = (value: string) => this.page.locator(`#robin-question-type-${value}`)
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

    open = async () => {
        await expect(this.fabLocator()).toBeVisible({ timeout: 3_000 })
        await this.fabLocator().click()
        await expect(this.promptLocator()).toBeVisible({ timeout: 3_000 })
    }

    enterPrompt = (prompt: string) => this.promptLocator().fill(prompt)
    sendPromptByEnter = () => this.promptLocator().press('Enter')
    generate = async () => {
        if (await this.generateButtonLocator().isVisible()) {
            await this.generateButtonLocator().click()
            return
        }
        await this.sendPromptByEnter()
    }

    askForSingleChoice = () => this.questionTypeRadio('single').check()
    askForMultipleChoice = () => this.questionTypeRadio('multiple').check()
    askForNumericalChoice = () => this.questionTypeRadio('numerical').check()

    saveGeneratedQuestions = () => this.saveButtonLocator().click()

    expectPromptVisible = () => expect(this.promptLocator().first()).toBeVisible()
    expectPromptNotVisible = () => expect(this.promptLocator().first()).not.toBeVisible()
    expectPromptValue = (value: string) => expect(this.promptLocator()).toHaveValue(value)
    expectGenerateButtonVisible = () => expect(this.generateButtonLocator()).toBeVisible()
    expectGenerateButtonNotVisible = () => expect(this.generateButtonLocator()).not.toBeVisible()
    expectComposerNotVisible = () => expect(this.composerLocator()).not.toBeVisible()
    expectChatMessageVisible = (message: string) =>
        expect(this.chatMessageLocator().filter({ hasText: message })).toBeVisible()
    expectComposerDockedToBottom = async () => {
        await expect(this.sheetLocator()).toHaveClass(/robin-sheet--chat/)
        await expect(this.composerLocator()).toBeVisible()
        await expect(this.sheetLocator().locator('> .header')).toBeVisible()
        await expect(this.sheetLocator().locator('> .robin-sheet__content')).toBeVisible()
        await expect(this.sheetLocator().locator('> [data-testid="robin-composer"]:last-child')).toBeVisible()
        await expect(this.sheetLocator().locator('> *')).toHaveCount(3)
    }
    expectNoGeneratedQuestions = () => expect(this.generatedQuestionsLocator()).toHaveCount(0)

    expectGeneratedQuestionCount = (count: number) => expect(this.generatedQuestionsLocator()).toHaveCount(count)
    expectGeneratedQuestionVisible = (index: number) => expect(this.generatedQuestionLocator(index)).toBeVisible()
    expectGeneratedQuestionNumber = (index: number) =>
        expect(this.generatedQuestionNumberLocator(index)).toHaveText(`${index}.`)
    expectGeneratedQuestionTitle = (index: number, title: string) =>
        expect(this.generatedQuestionTitleLocator(index)).toHaveText(title)
    expectGeneratedQuestionAnswerCount = (index: number, count: number) =>
        expect(this.generatedQuestionAnswersLocator(index)).toHaveCount(count)
    expectGeneratedQuestionCorrectAnswerCount = (index: number, count: number) =>
        expect(this.generatedQuestionLocator(index).getByTestId('robin-generated-answer-correct')).toHaveCount(count)
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
}
