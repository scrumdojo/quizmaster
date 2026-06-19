import { When, Then } from '#steps/fixture.ts'

When('I flag question {string} as problematic', async function () {
    await this.questionPage.flag()
})

When('flag saves are delayed', async function () {
    this.delayedFlagSave = await this.questionPage.delayFlagSave()
})

When('I try to evaluate the quiz while the flag save is pending', async function () {
    if (!this.delayedFlagSave) throw new Error('No delayed flag save is active')

    await this.delayedFlagSave.waitForStarted()
    await this.questionPage.evaluate()
})

When('the delayed flag save completes', async function () {
    if (!this.delayedFlagSave) throw new Error('No delayed flag save is active')

    await this.delayedFlagSave.release()
    this.delayedFlagSave = undefined
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
