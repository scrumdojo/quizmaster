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

Then('the active workspace tab has a spear cursor', async function () {
    await this.workspacePage.expectActiveTabSpearCursor()
})

Then('the animation settings control is visible', async function () {
    await this.appPage.expectAnimationSettingsAlwaysVisible()
})

Then('the background game FAB label reads {string}', async function (label: string) {
    await this.appPage.expectBackgroundGameFabLabel(label)
})

When('I open the background game dropdown', async function () {
    await this.appPage.openAnimationSettings()
})

Then('I see all animation options in the dropdown', async function () {
    await this.appPage.expectDropdownOptionsVisible()
})

When('I hover over the mammoth animation option', async function () {
    await this.appPage.openAnimationSettings()
})

Then('the cursor changes to a spear', async function () {
    await this.appPage.expectMammothButtonSpearCursor()
})

Then('mammoths can attack and kill hunters', async function () {
    await this.appPage.expectMammothsAttackHunters()
})

Then('clicking a hunter kills it with a footprint effect', async function () {
    await this.appPage.expectHunterClickKill()
})

Then('clicking a mammoth kills it with an explosion effect', async function () {
    await this.appPage.expectMammothClickKill()
})

Then('the Hunters scoreboard is on the {word} side', async function (side: string) {
    await this.appPage.expectHunterScoreboardSide(side)
})

Then('the Mammoths scoreboard is on the {word} side', async function (side: string) {
    await this.appPage.expectMammothScoreboardSide(side)
})
