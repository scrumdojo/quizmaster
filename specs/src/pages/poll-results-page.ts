import { expect, type Page } from '@playwright/test'

import { expectTextToBe } from '#steps/common.ts'

export class PollResultsPage {
    constructor(private page: Page) {}

    private pageLocator = () => this.page.locator('#poll-results-page')
    private questionLocator = () => this.page.getByTestId('poll-results-question')
    private resultsTableLocator = () => this.page.getByTestId('poll-results-table')
    private bodyRowsLocator = () => this.resultsTableLocator().locator('tbody tr')
    private rowLocator = (answer: string) => this.bodyRowsLocator().filter({ hasText: answer })

    waitForLoaded = async () => {
        await expect(this.pageLocator()).toBeVisible()
        await expect(this.resultsTableLocator()).toBeVisible()
    }

    expectQuestionText = (text: string) => expectTextToBe(this.questionLocator(), text)

    expectResultRowCount = (count: number) => expect(this.bodyRowsLocator()).toHaveCount(count)

    expectVoteCount = async (answer: string, votes: string) => {
        const row = this.rowLocator(answer)
        await expect(row).toHaveCount(1)
        await expectTextToBe(row.locator('th').first(), answer)
        await expectTextToBe(row.locator('td').first(), votes)
    }
}
