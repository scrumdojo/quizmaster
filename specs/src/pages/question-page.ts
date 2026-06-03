import { expect, type Page } from '@playwright/test'

export class QuestionPage {
    constructor(private page: Page) {}

    backButtonLocator = () => this.page.locator('#back')
    nextButtonLocator = () => this.page.locator('#next')
    evaluateButtonLocator = () => this.page.locator('#evaluate')
    evaluateModalButtonLocator = () => this.page.locator('dialog #evaluate')

    dialogTextLocator = () => this.page.locator('dialog p')
    timerLocator = () => this.page.getByTestId('timerID')

    navigationButtonsLocator = () => this.page.locator('#back, #next, #evaluate')
    submitButtonLocator = () => this.page.locator('input.submit-btn')

    private bookmarkQuestionButtonLocator = () => this.page.locator('[data-testid="bookmark-toggle"]')
    private unBookmarkQuestionButtonLocator = (title: string) =>
        this.page.locator(`[data-testid="delete-bookmark-${title}"]`)

    private progressBarLocator = () => this.page.locator('#progress-bar')
    private progressBarAttribute = async (name: 'value' | 'max') => {
        await this.progressBarLocator().waitFor({ state: 'visible' })
        return this.progressBarLocator().getAttribute(name)
    }
    progressCurrent = async () => Number.parseInt((await this.progressBarAttribute('value')) ?? '')
    progressMax = async () => Number.parseInt((await this.progressBarAttribute('max')) ?? '')

    back = () => this.backButtonLocator().click()
    bookmark = () => this.bookmarkQuestionButtonLocator().click()
    unBookmark = (title: string) => this.unBookmarkQuestionButtonLocator(title).click()
    next = () => this.nextButtonLocator().click()
    evaluate = async () => {
        const dialog = this.page.locator('dialog')
        const isDialogVisible = await dialog.isVisible()
        const locator = isDialogVisible ? this.evaluateModalButtonLocator() : this.evaluateButtonLocator()
        await locator.click()
    }
    submit = () => this.submitButtonLocator().click()

    bookmarkListLocator = (title: string) =>
        this.page.locator('[data-testid="bookmark-list"] button', { hasText: title })

    gotoBookmark = (title: string) => this.bookmarkListLocator(title).click()

    // Retrying assertions
    expectProgress = (current: number, max: number) =>
        expect(this.progressBarLocator())
            .toHaveAttribute('value', String(current))
            .then(() => expect(this.progressBarLocator()).toHaveAttribute('max', String(max)))
    expectBookmarked = () => expect(this.bookmarkQuestionButtonLocator()).toHaveAttribute('data-bookmarked', 'true')
}
