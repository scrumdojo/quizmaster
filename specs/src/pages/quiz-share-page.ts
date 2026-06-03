import { expect, type Page } from '@playwright/test'

export class QuizSharePage {
    constructor(private page: Page) {}

    private takeLinkLocator = () => this.page.locator('#quiz-take-link')
    private cohortRowsLocator = () => this.page.locator('.cohort-row')
    private noCohortsLocator = () => this.page.locator('#no-cohorts')
    private quizTakeQrLocator = () => this.page.getByTestId('quiz-take-qr')
    private qrCodeLocator = () => this.page.locator('.share-qr-code')

    private cohortRowLocator = (name: string) => this.page.locator(`.cohort-row[data-name="${name}"]`)

    // ── Queries ──────────────────────────────────────

    isVisible = async () => (await this.page.locator('#share-page').count()) > 0

    takeLink = async () => (await this.takeLinkLocator().getAttribute('href')) ?? ''

    cohortRowNames = async () => {
        const rows = this.cohortRowsLocator()
        const count = await rows.count()
        const names: string[] = []
        for (let i = 0; i < count; i++) {
            const row = rows.nth(i)
            const name = (await row.locator('.cohort-name').count())
                ? await row.locator('.cohort-name').innerText()
                : await row.getAttribute('data-name')

            names.push((name ?? '').trim())
        }
        return names
    }

    cohortLink = async (name: string) => {
        const row = this.cohortRowLocator(name)
        return (await row.locator('.cohort-link').getAttribute('href')) ?? ''
    }

    quizTakeQrValue = async () => (await this.quizTakeQrLocator().getAttribute('data-qr-value')) ?? ''

    cohortQrValue = async () => (await this.qrCodeLocator().getAttribute('data-qr-value')) ?? ''

    clipboardText = async () =>
        await this.page.evaluate(() => {
            const browserGlobal = globalThis as typeof globalThis & {
                navigator: { clipboard: { readText: () => Promise<string> } }
            }

            return browserGlobal.navigator.clipboard.readText()
        })

    errorTestId = async () => {
        const alert = this.page.locator('[data-testid="empty-cohort-name"], [data-testid="duplicate-cohort-name"]')
        if ((await alert.count()) === 0) return null
        return await alert.first().getAttribute('data-testid')
    }

    // ── Actions ──────────────────────────────────────

    clickTakeLink = async () => this.page.goto(await this.takeLink())

    showQuizTakeQr = () => this.page.getByRole('button', { name: 'Show QR code' }).first().click()

    hideQuizTakeQr = () => this.page.getByRole('button', { name: 'Close' }).click()

    showCohortQr = (name: string) => this.cohortRowLocator(name).getByRole('button', { name: 'Show QR code' }).click()

    copyQuizTakeLink = () => this.page.getByRole('button', { name: 'Share', exact: true }).first().click()

    copyCohortLink = (name: string) =>
        this.cohortRowLocator(name).getByRole('button', { name: 'Share', exact: true }).click()

    startRenameCohort = (name: string) => this.cohortRowLocator(name).getByRole('button', { name: 'Edit' }).click()

    renameCohort = async (from: string, to: string) => {
        const row = this.cohortRowLocator(from)
        await row.getByRole('button', { name: 'Edit' }).click()
        await row.locator('.cohort-edit-input').fill(to)
        const cohortPut = this.page.waitForResponse(
            response => /\/cohorts\/[^/]+$/.test(response.url()) && response.request().method() === 'PUT',
        )
        const quizGet = this.page.waitForResponse(
            response => /\/quizzes\/\d+$/.test(response.url()) && response.request().method() === 'GET',
        )
        await row.getByRole('button', { name: 'Save' }).click()
        const putResponse = await cohortPut
        if (putResponse.ok()) {
            await quizGet
        } else {
            void quizGet.catch(() => {})
            await expect(row).toBeVisible()
        }
    }

    cancelRenameCohort = (name: string) => this.cohortRowLocator(name).getByRole('button', { name: 'Cancel' }).click()

    deleteCohort = async (name: string) => {
        const cohortDelete = this.page.waitForResponse(
            response => /\/cohorts\/[^/]+$/.test(response.url()) && response.request().method() === 'DELETE',
        )
        const quizGet = this.page.waitForResponse(
            response => /\/quizzes\/\d+$/.test(response.url()) && response.request().method() === 'GET',
        )
        await this.cohortRowLocator(name).getByRole('button', { name: 'Delete' }).click()
        const deleteResponse = await cohortDelete
        if (deleteResponse.ok()) {
            await quizGet
        } else {
            void quizGet.catch(() => {})
            await expect(this.cohortRowLocator(name)).toBeVisible()
        }
    }

    addCohort = async (name: string) => {
        const existingRowCount = await this.cohortRowLocator(name).count()
        await this.page.locator('#cohort-name-input').fill(name)
        const cohortPost = this.page.waitForResponse(
            response => response.url().endsWith('/cohorts') && response.request().method() === 'POST',
        )
        const quizGet = this.page.waitForResponse(
            response => /\/quizzes\/\d+$/.test(response.url()) && response.request().method() === 'GET',
        )
        await this.page.locator('#add-cohort-button').click()
        const postResponse = await cohortPost
        if (postResponse.ok()) {
            await quizGet
        } else {
            void quizGet.catch(() => {})
            await expect(this.cohortRowLocator(name)).toHaveCount(existingRowCount)
        }
    }

    // ── Page-level expectations ──────────────────────

    expectNoCohorts = () => expect(this.noCohortsLocator()).toBeVisible()

    expectQuizTakeQrVisible = () => expect(this.quizTakeQrLocator()).toBeVisible()

    expectQuizTakeQrHidden = () => expect(this.quizTakeQrLocator()).toHaveCount(0)

    expectCohortQrVisible = (_name: string) => expect(this.qrCodeLocator()).toBeVisible()

    expectCohortQrHidden = async (name: string) =>
        expect(await this.qrCodeLocator().getAttribute('data-qr-value')).not.toBe(await this.cohortLink(name))

    expectQuizTakeCopied = () => expect(this.page.getByRole('button', { name: 'Copied' }).first()).toBeVisible()

    expectCohortCopied = (name: string) =>
        expect(this.cohortRowLocator(name).getByRole('button', { name: 'Copied' })).toBeVisible()

    expectDeleteDisabled = (name: string) =>
        expect(this.cohortRowLocator(name).getByRole('button', { name: 'Delete' })).toBeDisabled()

    expectGeneralTakeLinkNote = () => expect(this.page.locator('#general-take-link-note')).toBeVisible()
    expectCohortTakeLinkNote = () => expect(this.page.locator('#cohort-take-link-note')).toBeVisible()
    expectCohortDeleteNote = (name: string) =>
        expect(this.cohortRowLocator(name).getByText('Cohorts with attempts cannot be deleted.')).toBeVisible()
}
