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

When('I switch the animation to Angels & Devils', async function () {
    await this.appPage.switchToAngels()
})

Then('the Angels scoreboard is on the {word} side', async function (side: string) {
    await this.appPage.expectAngelScoreboardSide(side)
})

Then('the Satans scoreboard is on the {word} side', async function (side: string) {
    await this.appPage.expectSatanScoreboardSide(side)
})

When('I hover over the mammoth animation option', async function () {
    await this.appPage.openAnimationSettings()
})

Then('the cursor changes to a spear', async function () {
    await this.appPage.expectMammothButtonSpearCursor()
})
