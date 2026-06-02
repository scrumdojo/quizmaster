import { When, Then } from '#steps/fixture.ts'
import { QuizmasterWorld } from '#steps/world'

When('I continue to Nickname page', async function (world: QuizmasterWorld) {
    const nicknameUrl = 'TODO'
    await world.page.goto(nicknameUrl)
})

Then('I see the nickname input field', async function () {
    await this.quizNicknamePage.expectNicknameInputVisible()
})
