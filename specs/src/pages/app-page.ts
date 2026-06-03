import { expect, type Page } from '@playwright/test'

export class AppPage {
    constructor(private page: Page) {}

    private settingsPanel = () => this.page.locator('[data-testid="animation-settings"]')
    private canvas = () => this.page.locator('#crazy-bg')

    openAnimationSettings = () => this.settingsPanel().hover()

    turnOffAnimation = async () => {
        await this.openAnimationSettings()
        await this.page.getByRole('button', { name: 'Turn off' }).click()
    }

    switchToMammoths = async () => {
        await this.openAnimationSettings()
        await this.page.getByRole('button', { name: 'Mammoths' }).click()
    }

    switchToAngels = async () => {
        await this.openAnimationSettings()
        await this.page.getByRole('button', { name: 'Angels & Devils' }).click()
    }

    expectAnimationHidden = () => expect(this.canvas()).toBeHidden()
    expectAnimationTheme = (theme: string) => expect(this.canvas()).toHaveAttribute('data-theme', theme)
    expectAngelScoreboardSide = (side: string) =>
        expect(this.canvas()).toHaveAttribute('data-angel-scoreboard-side', side)
    expectSatanScoreboardSide = (side: string) =>
        expect(this.canvas()).toHaveAttribute('data-satan-scoreboard-side', side)

    expectAnimationSettingsAlwaysVisible = async () => {
        await expect(this.settingsPanel()).toBeVisible()
        await expect(this.page.getByRole('button', { name: 'Mammoths' })).toBeVisible()
        await expect(this.page.getByRole('button', { name: 'Angels & Devils' })).toBeVisible()
        await expect(this.page.getByRole('button', { name: 'Turn off' })).toBeVisible()
    }

    expectMammothButtonSpearCursor = () =>
        expect(this.page.getByRole('button', { name: 'Mammoths' })).toHaveAttribute('style', /cursor:.*url\(/)

    expectMammothsAttackHunters = () => expect(this.canvas()).toHaveAttribute('data-mammoth-attacks-hunters', 'true')

    expectHunterScoreboardSide = (side: string) =>
        expect(this.canvas()).toHaveAttribute('data-hunter-scoreboard-side', side)

    expectMammothScoreboardSide = (side: string) =>
        expect(this.canvas()).toHaveAttribute('data-mammoth-scoreboard-side', side)
}
