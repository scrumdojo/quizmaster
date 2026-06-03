import { expect, type Page } from '@playwright/test'

export class AppPage {
    constructor(private page: Page) {}

    private settingsPanel = () => this.page.locator('[data-testid="animation-settings"]')
    private canvas = () => this.page.locator('#crazy-bg')
    private tooltipLocator = () => this.page.getByRole('tooltip')

    // Opens the dropdown by clicking the FAB trigger button
    openAnimationSettings = async () => {
        const trigger = this.settingsPanel().locator('.bg-game-trigger')
        const isOpen = await this.settingsPanel().locator('.bg-game-dropdown').isVisible()
        if (!isOpen) await trigger.click()
    }

    focusHelpTooltip = (label: string) => this.page.getByRole('button', { name: `Help for ${label}` }).focus()
    dismissHelpTooltip = () => this.page.keyboard.press('Escape')
    expectHelpText = (text: string) => expect(this.tooltipLocator()).toHaveText(text)
    expectHelpTextHidden = (text: string) =>
        expect(this.page.getByRole('tooltip').filter({ hasText: text })).toHaveCount(0)

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
    }

    expectBackgroundGameFabLabel = async (label: string) => {
        await expect(this.settingsPanel().locator('.bg-game-label')).toHaveText(label)
    }

    expectDropdownOptionsVisible = async () => {
        await this.openAnimationSettings()
        await expect(this.page.getByRole('button', { name: 'Mammoths' })).toBeVisible()
        await expect(this.page.getByRole('button', { name: 'Angels & Devils' })).toBeVisible()
        await expect(this.page.getByRole('button', { name: 'Turn off' })).toBeVisible()
    }

    expectGiantMammothEnabled = () => expect(this.canvas()).toHaveAttribute('data-giant-mammoth-lives', '10')

    expectMammothSpriteSpearCursor = () => expect(this.canvas()).toHaveAttribute('data-mammoth-hover-spear', 'true')

    expectMammothButtonSpearCursor = () =>
        expect(this.page.getByRole('button', { name: 'Mammoths' })).toHaveAttribute('style', /cursor:.*url\(/)

    selectBattleOnly = async () => {
        await this.openAnimationSettings()
        await this.page.getByRole('button', { name: 'Battle only' }).click()
    }

    expectInterfaceHidden = () => expect(this.page.getByTestId('app-interface')).toBeHidden()

    expectAnimationVisible = () => expect(this.canvas()).toBeVisible()

    expectMammothsAttackHunters = () => expect(this.canvas()).toHaveAttribute('data-mammoth-attacks-hunters', 'true')

    expectHunterClickKill = () => expect(this.canvas()).toHaveAttribute('data-hunter-click-kill', 'true')

    expectMammothClickKill = () => expect(this.canvas()).toHaveAttribute('data-mammoth-click-kill', 'true')

    expectHunterScoreboardSide = (side: string) =>
        expect(this.canvas()).toHaveAttribute('data-hunter-scoreboard-side', side)

    expectMammothScoreboardSide = (side: string) =>
        expect(this.canvas()).toHaveAttribute('data-mammoth-scoreboard-side', side)
}
