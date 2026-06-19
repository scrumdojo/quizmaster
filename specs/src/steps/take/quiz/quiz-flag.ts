import { When, Then } from '#steps/fixture.ts'

When('I flag question {string} as problematic', async function () {
    await this.questionPage.flag()
})

Then('I see question {string} flagged as problematic', async function () {
    await this.questionPage.expectFlagged()
})

When('I remove the flag from question {string}', async function () {
    await this.questionPage.unflag()
})

Then('I do not see question {string} flagged as problematic', async function () {
    await this.questionPage.expectNotFlagged()
})
