import { expect, type Locator, type Page } from '@playwright/test'

import { expectTextToBe } from '#steps/common.ts'

export class QuizStatsPage {
    constructor(private page: Page) {}

    private pageHeadingLocator = () => this.page.locator('h2')
    private attemptStatsTableLocator = () => this.page.getByTestId('attempt-stats-table')
    private questionStatsTableLocator = () => this.page.getByTestId('question-stats-table')
    private summaryStatsTableLocator = () => this.page.getByTestId('summary-stats-table')

    private tableCaptionLocator = (table: Locator) => table.locator('caption')
    private tableHeaderCellsLocator = (table: Locator) => table.locator('thead .stats-table__column-text')
    private tableBodyRowsLocator = (table: Locator) => table.locator('tbody tr')

    expectPageHeading = (text: string) => expectTextToBe(this.pageHeadingLocator(), text)
    focusColumnHelp = (column: string) =>
        this.page
            .getByRole('button', { name: `Help for ${column} statistics column`, exact: true })
            .first()
            .focus()

    expectAttemptStatsRowCount = (count: number) =>
        expect(this.tableBodyRowsLocator(this.attemptStatsTableLocator())).toHaveCount(count)

    expectSummaryStatsRowCount = (count: number) =>
        expect(this.tableBodyRowsLocator(this.summaryStatsTableLocator())).toHaveCount(count)

    expectAttemptStatsBodyRowCell = (rowIndex: number, colIndex: number, text: string) =>
        expectTextToBe(
            this.tableBodyRowsLocator(this.attemptStatsTableLocator()).nth(rowIndex).locator('td').nth(colIndex),
            text,
        )

    expectQuestionAccuracyBand = async (question: string, percent: string, band: string) => {
        const row = this.tableBodyRowsLocator(this.questionStatsTableLocator()).filter({ hasText: question })
        const pill = row.locator('.accuracy-pill')
        await expectTextToBe(pill, percent)
        await expect(pill).toHaveAttribute('data-band', band)
    }

    expectLabeledTable = async (
        table: 'attempt' | 'question' | 'summary',
        captionText: string | undefined,
        headerCells: string[],
        bodyRows: string[][],
    ) => {
        const tableLocator =
            table === 'attempt'
                ? this.attemptStatsTableLocator()
                : table === 'question'
                  ? this.questionStatsTableLocator()
                  : this.summaryStatsTableLocator()

        if (captionText) {
            await expectTextToBe(this.tableCaptionLocator(tableLocator), captionText)
        }

        for (let i = 0; i < headerCells.length; i++) {
            if (headerCells[i] !== '') {
                await expectTextToBe(this.tableHeaderCellsLocator(tableLocator).nth(i), headerCells[i])
            }
        }

        const rows = this.tableBodyRowsLocator(tableLocator)
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
