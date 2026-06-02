import { Given, When, Then } from '#steps/fixture.ts'

When('I continue to Nickname page', async function () {
    const nicknameUrl = world.quizBookmarks[quizBookmark]
    await world.page.goto(quizUrl)
})
