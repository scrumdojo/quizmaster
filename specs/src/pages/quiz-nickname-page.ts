import { expect, type Page } from '@playwright/test'

export class QuizNicknamePage {
    constructor(private page: Page) {}

    expectNicknameInputVisible = () => expect(this.page.locator('input[type="text"]').first()).toBeVisible()
}
