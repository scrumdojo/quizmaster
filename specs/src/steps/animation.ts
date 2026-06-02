import { When, Then } from '#steps/fixture.ts'

When('I turn off the background animation', async function () {
    await this.appPage.turnOffAnimation()
})

Then('the background animation is not visible', async function () {
    await this.appPage.expectAnimationHidden()
})

When('I switch the animation to the mammoths theme', async function () {
    await this.appPage.switchToMammoths()
})

Then('the background animation shows the mammoths theme', async function () {
    await this.appPage.expectAnimationTheme('mammoths')
})
