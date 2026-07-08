import { expect, type Page } from '@playwright/test'

export class EpicBattlePage {
    constructor(private page: Page) {}

    private armyLocator = (cohort: string) => this.page.locator(`[data-testid="roman-army"][data-cohort="${cohort}"]`)
    private battlefieldLocator = () => this.page.getByTestId('battlefield')
    private soldierLocator = () => this.page.getByTestId('battle-soldier').first()

    // ── Queries ──────────────────────────────────────

    // ── Actions ──────────────────────────────────────

    // ── Page-level expectations ──────────────────────

    expectEpicBattlePageForQuiz = async (quizName: string) => {
        await expect(this.page.locator('#epic-battle-page')).toBeVisible()
        await expect(this.page.locator('#epic-battle-page h1')).toContainText(quizName)
    }

    expectArmyVisible = (cohort: string) => expect(this.armyLocator(cohort)).toBeVisible()

    expectArmyHits = (cohort: string, hits: number) =>
        expect.poll(() => this.armyLocator(cohort).getAttribute('data-hits')).toBe(String(hits))

    expectArmyStatus = (cohort: string, status: 'winning' | 'losing' | 'even') =>
        expect.poll(() => this.armyLocator(cohort).getAttribute('data-status')).toBe(status)

    expectBattleEven = async () => {
        const count = await this.page.getByTestId('roman-army').count()
        for (let i = 0; i < count; i++) {
            await expect.poll(() => this.page.getByTestId('roman-army').nth(i).getAttribute('data-status')).toBe('even')
        }
    }

    expectArmiesClashing = async () => {
        await expect(this.battlefieldLocator()).toHaveAttribute('data-clashing', 'true')

        const firstBox = await this.soldierLocator().boundingBox()
        expect(firstBox).not.toBeNull()

        await expect
            .poll(async () => {
                const box = await this.soldierLocator().boundingBox()
                if (!box) return false
                return box.x !== firstBox!.x || box.y !== firstBox!.y
            })
            .toBe(true)
    }
}
