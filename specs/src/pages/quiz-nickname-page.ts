import { expect, type Page } from '@playwright/test'

export class QuizNicknamePage {
    constructor(private page: Page) {}

    private nicknameInputLocator = () => this.page.locator('#quiz-nickname-input')
    private startQuizButtonLocator = () => this.page.locator('button#start-quiz')

    waitForLoaded = () => expect(this.nicknameInputLocator()).toBeVisible()
    isVisible = async () => this.nicknameInputLocator().isVisible().catch(() => false)
    expectNicknameInputVisible = () => expect(this.nicknameInputLocator()).toBeVisible()
    fillNickname = (nickname: string) => this.nicknameInputLocator().fill(nickname)
    startQuiz = async () => {
        await expect(this.startQuizButtonLocator()).toBeEnabled()
        await this.startQuizButtonLocator().click({ force: true })
    }
}
