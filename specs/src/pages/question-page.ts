import { expect, type Locator, type Page, type Route } from '@playwright/test'

interface DelayedFlagSave {
    readonly waitForStarted: () => Promise<void>
    readonly release: () => Promise<void>
}

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

    private flagQuestionButtonLocator = () => this.page.locator('[data-testid="flag-toggle"]')
    private bookmarkQuestionButtonLocator = () => this.page.locator('[data-testid="bookmark-toggle"]')
    private unBookmarkQuestionButtonLocator = (title: string) =>
        this.page.locator(`[data-testid="delete-bookmark-${title}"]`)

    delayFlagSave = async (): Promise<DelayedFlagSave> => {
        const flagUrl = /\/api\/quiz\/\d+\/attempts\/\d+\/questions\/\d+\/flag$/
        const evaluateUrl = /\/api\/quiz\/\d+\/attempts\/\d+\/evaluate$/

        let releaseFlagSave!: () => void
        let markFlagSaveStarted!: () => void
        let isReleased = false
        const flagSaveReleased = new Promise<void>(resolve => {
            releaseFlagSave = () => {
                isReleased = true
                resolve()
            }
        })
        const flagSaveStarted = new Promise<void>(resolve => {
            markFlagSaveStarted = resolve
        })

        const flagHandler = async (route: Route) => {
            markFlagSaveStarted()
            await flagSaveReleased
            await route.continue()
        }
        const evaluateHandler = async (route: Route) => {
            if (isReleased) {
                await route.continue()
                return
            }

            await route.fulfill({
                status: 409,
                contentType: 'application/json',
                body: JSON.stringify({ message: 'Evaluation raced the pending flag save.' }),
            })
        }

        await this.page.route(flagUrl, flagHandler)
        await this.page.route(evaluateUrl, evaluateHandler)

        return {
            waitForStarted: async () => {
                await flagSaveStarted
            },
            release: async () => {
                releaseFlagSave()
                await this.page.unroute(flagUrl, flagHandler)
                await this.page.unroute(evaluateUrl, evaluateHandler)
            },
        }
    }

    private progressBarLocator = () => this.page.locator('#progress-bar')
    private questionFormLocator = () => this.page.locator('#question-form')
    private waitingForPresenterLocator = () => this.page.getByTestId('waiting-for-presenter')
    private progressBarAttribute = async (name: 'value' | 'max') => {
        await this.progressBarLocator().waitFor({ state: 'visible' })
        return this.progressBarLocator().getAttribute(name)
    }
    progressCurrent = async () => Number.parseInt((await this.progressBarAttribute('value')) ?? '')
    progressMax = async () => Number.parseInt((await this.progressBarAttribute('max')) ?? '')

    private navigateToDifferentQuestion = async (locator: Locator) => {
        const previousUrl = this.page.url()
        const previousQuestionForm = await this.questionFormLocator().elementHandle()

        await Promise.all([this.page.waitForURL(url => url.href !== previousUrl), locator.click()])
        await previousQuestionForm?.waitForElementState('hidden')
        await this.questionFormLocator().waitFor({ state: 'visible' })
    }

    back = () => this.navigateToDifferentQuestion(this.backButtonLocator())
    flag = () => this.flagQuestionButtonLocator().click()
    unflag = () => this.flagQuestionButtonLocator().click()
    bookmark = () => this.bookmarkQuestionButtonLocator().click()
    unBookmark = (title: string) => this.unBookmarkQuestionButtonLocator(title).click()
    next = () => this.navigateToDifferentQuestion(this.nextButtonLocator())
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
    expectFlagged = () => expect(this.flagQuestionButtonLocator()).toHaveAttribute('data-flagged', 'true')
    expectNotFlagged = () => expect(this.flagQuestionButtonLocator()).toHaveAttribute('data-flagged', 'false')
    expectBookmarked = () => expect(this.bookmarkQuestionButtonLocator()).toHaveAttribute('data-bookmarked', 'true')
    expectWaitingForPresenter = () => expect(this.waitingForPresenterLocator()).toBeVisible()
}
