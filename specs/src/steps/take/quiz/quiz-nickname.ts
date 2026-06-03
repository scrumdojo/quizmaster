import { When, Then } from '#steps/fixture.ts'

When('I continue to Nickname page', async function () {
    await this.quizWelcomePage.start()
    await this.quizNicknamePage.waitForLoaded()
})

Then('I see the nickname input field', async function () {
    await this.quizNicknamePage.expectNicknameInputVisible()
})
