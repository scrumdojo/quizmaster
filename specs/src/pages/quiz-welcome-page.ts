import { expect, type Page } from '@playwright/test'

import { expectTextToBe } from '#steps/common.ts'

export class QuizWelcomePage {
    constructor(private page: Page) {}

    private headerLocator = () => this.page.locator('h1')
    private nameLocator = () => this.page.locator('#quiz-name')
    private descriptionLocator = () => this.page.locator('#quiz-description')
    private questionCountLocator = () => this.page.locator('#question-count')
    private feedbackLocator = () => this.page.locator('#question-feedback')
    private passScoreLocator = () => this.page.locator('#pass-score')
    private timeLimitLocator = () => this.page.locator('#time-limit')
    private cohortLeaderboardTableLocator = () => this.page.getByTestId('cohort-leaderboard-table')

    private tableCaptionLocator = () => this.cohortLeaderboardTableLocator().locator('caption')
    private tableHeaderCellsLocator = () => this.cohortLeaderboardTableLocator().locator('thead th')
    private tableBodyRowsLocator = () => this.cohortLeaderboardTableLocator().locator('tbody tr')

    private individualsLeaderboardTableLocator = () => this.page.getByTestId('individuals-leaderboard-table')

    private individualsTableCaptionLocator = () => this.individualsLeaderboardTableLocator().locator('caption')

    private individualsTableHeaderCellsLocator = () => this.individualsTableCaptionLocator().locator('thead th')
    private individualsTableBodyRowsLocator = () => this.individualsTableCaptionLocator().locator('tbody tr')

    expectHeader = (text: string) => expect(this.headerLocator()).toHaveText(text)
    expectName = (name: string) => expect(this.nameLocator()).toHaveText(name)
    expectDescription = (description: string) => expect(this.descriptionLocator()).toHaveText(description)
    expectQuestionCount = (count: number) => expect(this.questionCountLocator()).toHaveText(String(count))
    expectFeedback = (feedback: string) => expect(this.feedbackLocator()).toHaveText(feedback)
    expectPassScore = (score: number) => expect(this.passScoreLocator()).toContainText(String(score))
    timeLimit = async () => Number.parseInt((await this.timeLimitLocator().textContent()) ?? '')
    expectTimeLimit = (seconds: string) => expect(this.timeLimitLocator()).toContainText(seconds)
    expectStartEnabled = () => expect(this.startButton()).toBeEnabled()
    expectStartDisabled = () => expect(this.startButton()).toBeDisabled()
    expectStatusMessage = (message: string) => expect(this.statusMessage()).toHaveText(message)

    statusMessage = () => this.page.locator('p#statusMessage')
    startButton = () => this.page.locator('button#start')
    start = () => this.startButton().click()

    expectCohortLeaderboard = async (captionText: string, headerCells: string[], bodyRows: string[][]) => {
        await expectTextToBe(this.tableCaptionLocator(), captionText)

        for (let i = 0; i < headerCells.length; i++) {
            if (headerCells[i] !== '') {
                await expectTextToBe(this.tableHeaderCellsLocator().nth(i), headerCells[i])
            }
        }

        const rows = this.tableBodyRowsLocator()
        await expect(rows).toHaveCount(bodyRows.length)

        for (let i = 0; i < bodyRows.length; i++) {
            for (let j = 0; j < bodyRows[i].length; j++) {
                if (bodyRows[i][j] !== '') {
                    await expectTextToBe(rows.nth(i).locator('td').nth(j), bodyRows[i][j])
                }
            }
        }
    }

    private dryRunIndicatorLocator = () => this.page.getByTestId('dry-run-indicator')
    expectDryRunIndicatorVisible = () => expect(this.dryRunIndicatorLocator()).toBeVisible()
    expectDryRunIndicatorNotVisible = () => expect(this.dryRunIndicatorLocator()).not.toBeVisible()

    expectIndividualsLeaderboard = async (captionText: string, headerCells: string[], bodyRows: string[][]) => {
        await expectTextToBe(this.individualsTableCaptionLocator(), captionText)

        for (let i = 0; i < headerCells.length; i++) {
            if (headerCells[i] !== '') {
                await expectTextToBe(this.individualsTableHeaderCellsLocator().nth(i), headerCells[i])
            }
        }

        const rows = this.individualsTableBodyRowsLocator()
        await expect(rows).toHaveCount(bodyRows.length)

        for (let i = 0; i < bodyRows.length; i++) {
            for (let j = 0; j < bodyRows[i].length; j++) {
                if (bodyRows[i][j] !== '') {
                    await expectTextToBe(rows.nth(i).locator('td').nth(j), bodyRows[i][j])
                }
            }
        }
    }
}
