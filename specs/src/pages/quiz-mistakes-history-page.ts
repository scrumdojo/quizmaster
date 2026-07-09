import { expect, type Page } from '@playwright/test'

export class QuizMistakesHistoryPage {
    constructor(private page: Page) {}

    private listLocator = () => this.page.locator('.quiz-mistakes-history__list')
    private emptyLocator = () => this.page.locator('.quiz-mistakes-history__empty')

    mistakeQuestions = async () => {
        await expect(this.listLocator().or(this.emptyLocator())).toBeVisible()
        return this.listLocator().locator('li').allTextContents()
    }

    expectEmpty = () => expect(this.emptyLocator()).toBeVisible()
}
