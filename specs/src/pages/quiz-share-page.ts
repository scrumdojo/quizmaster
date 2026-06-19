import { expect, type Locator, type Page } from '@playwright/test'

import { expectTextToBe } from '#steps/common.ts'

export class QuizSharePage {
    private lastShareButtonCenter: { readonly x: number; readonly y: number } | null = null

    constructor(private page: Page) {}

    private takeLinkLocator = () => this.page.locator('#quiz-take-link')
    private cohortRowsLocator = () => this.page.locator('.cohort-row')
    private noCohortsLocator = () => this.page.locator('#no-cohorts')
    private quizTakeQrLocator = () => this.page.getByTestId('quiz-take-qr')
    private qrCodeLocator = () => this.page.locator('.share-qr-code')
    private qrThemeImageLocator = () => this.qrCodeLocator().locator('svg image')
    private shareBirdLocator = () => this.page.getByTestId('share-bird')
    private shareBirdImageLocator = () => this.shareBirdLocator().locator('img')
    private shareFlockBirdLocator = () => this.page.locator('[data-testid="share-bird"][data-flock="true"]')
    private liveStatsButtonLocator = () => this.page.getByTestId('live-stats-button')
    private liveStatsPanelLocator = () => this.page.getByTestId('live-stats-panel')
    private cohortLiveStatsTableLocator = () => this.page.getByTestId('cohort-live-stats-table')

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

    copyQuizTakeLink = async () => {
        const button = this.quizShareButton()
        await this.rememberShareButtonCenter(button)
        await button.click()
    }

    copyQuizTakeLinkRepeatedly = async (count: number) => {
        const button = this.quizShareButton()
        for (let i = 0; i < count; i++) {
            await this.rememberShareButtonCenter(button)
            await button.click()
        }
    }

    copyCohortLink = async (name: string) => {
        const button = this.cohortShareButton(name)
        await this.rememberShareButtonCenter(button)
        await button.click()
    }

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

    expectQrThemeImage = async (image: 'angel' | 'mammoth') => {
        await expect(this.qrCodeLocator()).toHaveAttribute('data-qr-theme-image', image)
        await expect(this.qrThemeImageLocator()).toHaveCount(1)
    }

    expectNoQrThemeImage = async () => {
        await expect(this.qrCodeLocator()).toHaveAttribute('data-qr-theme-image', 'none')
        await expect(this.qrThemeImageLocator()).toHaveCount(0)
    }

    expectQuizTakeCopied = () => expect(this.page.getByRole('button', { name: 'Copied' }).first()).toBeVisible()

    expectShareBirdStartedFromQuizShareButton = async () => {
        await this.expectShareBirdStartedFromLastShareButton()
    }

    expectShareBirdStartedFromCohortShareButton = async (_name: string) => {
        await this.expectShareBirdStartedFromLastShareButton()
    }

    expectAnimatedShareBird = async () => {
        await expect(this.shareBirdImageLocator()).toBeVisible()
        await expect(this.shareBirdImageLocator()).toHaveAttribute('src', /\.gif$/)
    }

    expectShareFlockStartedFromQuizShareButton = async () => {
        await expect(this.shareFlockBirdLocator()).toHaveCount(7)
        expect(this.lastShareButtonCenter).not.toBeNull()
        let birdPathStartsAtButton = false
        for (let i = 0; i < 7; i++) {
            const style = (await this.shareFlockBirdLocator().nth(i).getAttribute('style')) ?? ''
            const startX = Number.parseFloat(style.match(/--share-bird-x:\s*([0-9.]+)px/)?.[1] ?? '0')
            const startY = Number.parseFloat(style.match(/--share-bird-y:\s*([0-9.]+)px/)?.[1] ?? '0')
            birdPathStartsAtButton ||=
                Math.abs(startX - this.lastShareButtonCenter!.x) < 8 &&
                Math.abs(startY - this.lastShareButtonCenter!.y) < 8
        }
        expect(birdPathStartsAtButton).toBe(true)
    }

    expectAnimatedShareFlock = async () => {
        await expect(this.shareFlockBirdLocator()).toHaveCount(7)
        await expect(this.shareFlockBirdLocator().locator('img')).toHaveCount(7)
    }

    expectShareFlockFlyingToTopRight = async () => {
        await expect(this.shareFlockBirdLocator()).toHaveCount(7)
        const viewport = this.page.viewportSize()
        expect(viewport).not.toBeNull()

        let birdEndsInTopRight = false
        for (let i = 0; i < 7; i++) {
            const style = (await this.shareFlockBirdLocator().nth(i).getAttribute('style')) ?? ''
            const endX = Number.parseFloat(style.match(/--share-bird-end-x:\s*([0-9.]+)px/)?.[1] ?? '0')
            const endY = Number.parseFloat(style.match(/--share-bird-end-y:\s*([0-9.]+)px/)?.[1] ?? '0')
            birdEndsInTopRight ||= endX > viewport!.width - 120 && endY < 80
        }

        expect(birdEndsInTopRight).toBe(true)
    }

    expectShareBirdFlyingToTopRight = async () => {
        await expect(this.shareBirdLocator()).toBeVisible()
        await expect(this.shareBirdLocator()).toHaveAttribute('data-flight-target', 'top-right')
        const style = (await this.shareBirdLocator().getAttribute('style')) ?? ''
        const startX = Number.parseFloat(style.match(/--share-bird-x:\s*([0-9.]+)px/)?.[1] ?? '0')
        const startY = Number.parseFloat(style.match(/--share-bird-y:\s*([0-9.]+)px/)?.[1] ?? '0')
        const endX = Number.parseFloat(style.match(/--share-bird-end-x:\s*([0-9.]+)px/)?.[1] ?? '0')
        const endY = Number.parseFloat(style.match(/--share-bird-end-y:\s*([0-9.]+)px/)?.[1] ?? '0')
        const viewport = this.page.viewportSize()

        expect(viewport).not.toBeNull()
        expect(Math.abs(endX - (viewport!.width - 36))).toBeLessThan(2)
        expect(Math.abs(endY - 34)).toBeLessThan(2)
        await expect
            .poll(async () => {
                const box = await this.shareBirdLocator().boundingBox()
                if (!box) return false

                return box.x + box.width / 2 > startX + 20 && box.y + box.height / 2 < startY - 20
            })
            .toBe(true)
    }

    expectShareBirdGone = async () => {
        await expect(this.shareBirdLocator()).toHaveCount(0, { timeout: 3500 })
    }

    expectCohortCopied = (name: string) =>
        expect(this.cohortRowLocator(name).getByRole('button', { name: 'Copied' })).toBeVisible()

    expectDeleteDisabled = (name: string) =>
        expect(this.cohortRowLocator(name).getByRole('button', { name: 'Delete' })).toBeDisabled()

    expectGeneralTakeLinkNote = () => expect(this.page.locator('#general-take-link-note')).toBeVisible()
    expectCohortTakeLinkNote = () => expect(this.page.locator('#cohort-take-link-note')).toBeVisible()
    expectCohortDeleteNote = (name: string) =>
        expect(this.cohortRowLocator(name).getByText('Cohorts with attempts cannot be deleted.')).toBeVisible()

    expectLiveStatsButtonVisible = () => expect(this.liveStatsButtonLocator()).toBeVisible()

    expectLiveStatsButtonHidden = () => expect(this.liveStatsButtonLocator()).toHaveCount(0)

    openLiveStats = () => this.liveStatsButtonLocator().click()

    expectLiveStatsPanelVisible = () => expect(this.liveStatsPanelLocator()).toBeVisible()

    closeLiveStats = () => this.liveStatsPanelLocator().getByRole('button', { name: 'Close' }).click()

    expectShareScreenForQuiz = async (quizName: string) => {
        await expect(this.page.locator('#share-page')).toBeVisible()
        await expect(this.page.locator('#share-page h1')).toHaveText(`Share ${quizName}`)
    }

    expectCohortLiveStatsTable = async (captionText: string, headerCells: string[], bodyRows: string[][]) => {
        const table = this.cohortLiveStatsTableLocator()
        await expectTextToBe(table.locator('caption'), captionText)

        for (let i = 0; i < headerCells.length; i++) {
            if (headerCells[i] !== '') {
                await expectTextToBe(table.locator('thead th').nth(i), headerCells[i])
            }
        }

        const rows = table.locator('tbody tr')
        await expect(rows).toHaveCount(bodyRows.length)

        for (let i = 0; i < bodyRows.length; i++) {
            for (let j = 0; j < bodyRows[i].length; j++) {
                if (bodyRows[i][j] !== '') {
                    await expect
                        .poll(async () => (await rows.nth(i).locator('td').nth(j).textContent())?.trim() ?? '')
                        .toBe(bodyRows[i][j])
                }
            }
        }
    }

    private takeLinkShareActionsLocator = () =>
        this.page
            .locator('section')
            .filter({ has: this.page.getByRole('heading', { name: 'Take link' }) })
            .locator('.share-actions')

    expectLiveStatsButtonInTakeLinkShareActions = async () => {
        const shareActions = this.takeLinkShareActionsLocator()
        await expect(shareActions.getByRole('button', { name: 'Show QR code' })).toBeVisible()
        await expect(shareActions.getByTestId('share-link-quiz-take')).toBeVisible()
        await expect(shareActions.getByTestId('live-stats-button')).toBeVisible()
    }

    expectLiveStatsHelpTooltipAfterButton = async () => {
        const shareActions = this.takeLinkShareActionsLocator()
        await expect(
            shareActions.locator(
                '[data-testid="live-stats-button"] + .help-tooltip button[aria-label="Help for Live stats"]',
            ),
        ).toBeVisible()
    }

    private quizShareButton = () => this.page.getByTestId('share-link-quiz-take')

    private cohortShareButton = (name: string) => this.cohortRowLocator(name).locator('[data-testid^="share-link-"]')

    private rememberShareButtonCenter = async (button: Locator) => {
        const buttonBox = await button.boundingBox()
        expect(buttonBox).not.toBeNull()
        this.lastShareButtonCenter = {
            x: buttonBox!.x + buttonBox!.width / 2,
            y: buttonBox!.y + buttonBox!.height / 2,
        }
    }

    private expectShareBirdStartedFromLastShareButton = async () => {
        await expect(this.shareBirdLocator()).toBeVisible()
        expect(this.lastShareButtonCenter).not.toBeNull()
        const style = (await this.shareBirdLocator().getAttribute('style')) ?? ''
        const startX = Number.parseFloat(style.match(/--share-bird-x:\s*([0-9.]+)px/)?.[1] ?? '0')
        const startY = Number.parseFloat(style.match(/--share-bird-y:\s*([0-9.]+)px/)?.[1] ?? '0')
        const birdBox = await this.shareBirdLocator().boundingBox()

        expect(Math.abs(startX - this.lastShareButtonCenter!.x)).toBeLessThan(2)
        expect(Math.abs(startY - this.lastShareButtonCenter!.y)).toBeLessThan(2)
        expect(birdBox).not.toBeNull()
        expect(Math.abs(birdBox!.x + birdBox!.width / 2 - this.lastShareButtonCenter!.x)).toBeLessThan(8)
        expect(Math.abs(birdBox!.y + birdBox!.height / 2 - this.lastShareButtonCenter!.y)).toBeLessThan(8)
    }
}
