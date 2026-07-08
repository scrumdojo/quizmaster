import { expect, type Page } from '@playwright/test'

export class QuizBuzzerLobbyPage {
    constructor(private page: Page) {}

    private containerLocator = () => this.page.locator('#quiz-buzzer-lobby')
    private countdownLocator = () => this.page.locator('#buzzer-countdown')

    waitForLoaded = () => expect(this.containerLocator()).toBeVisible()
    expectCountdown = (value: string) => expect(this.countdownLocator()).toHaveText(value)
    expectNoCountdown = () => expect(this.countdownLocator()).toHaveCount(0)
}
