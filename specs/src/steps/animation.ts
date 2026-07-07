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

When('I switch the animation to the photo theme', async function () {
    await this.appPage.switchToPhoto()
})

Then('a background photo is shown', async function () {
    await this.appPage.expectPhotoVisible()
})

Then('the background photo category is {string}', async function (category: string) {
    await this.appPage.expectPhotoCategory(category)
})

Then('the background photo category is one of the fun categories', async function () {
    await this.appPage.expectPhotoCategoryIsOneOfTheFunCategories()
})

Then('I remember the background photo category', async function () {
    await this.appPage.capturePhotoCategory()
})

Then('the background photo category is unchanged', async function () {
    await this.appPage.expectPhotoCategoryUnchangedSinceCaptured()
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

Then('hovering over a mammoth shows a spear cursor', async function () {
    await this.appPage.expectMammothSpriteSpearCursor()
})

Then('hovering over a hunter shows a paw cursor', async function () {
    await this.appPage.expectHunterSpritePawCursor()
})

Then('a giant mammoth with 100 lives can appear', async function () {
    await this.appPage.expectGiantMammothEnabled()
})

Then('the giant mammoth stomps nearby hunters', async function () {
    await this.appPage.expectGiantMammothStomp()
})

Then('the giant mammoth throws stones at hunters', async function () {
    await this.appPage.expectGiantMammothThrowsStones()
})

Then('mammoths can attack and kill hunters', async function () {
    await this.appPage.expectMammothsAttackHunters()
})

Then('each hunter carries 10 spears', async function () {
    await this.appPage.expectHunterSpears()
})

Then('hunters return to base to resupply when out of spears', async function () {
    await this.appPage.expectHunterResupply()
})

When('I select battle only mode', async function () {
    await this.appPage.selectBattleOnly()
})

Then('the workspace interface is hidden', async function () {
    await this.appPage.expectInterfaceHidden()
})

Then('the background animation is visible', async function () {
    await this.appPage.expectAnimationVisible()
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

Then('mammoths are contained within the screen', async function () {
    await this.appPage.expectMammothContained()
})

Then('basic mammoths have 10 lives', async function () {
    await this.appPage.expectMammothHealth()
})

Then('mammoths can dodge incoming attacks', async function () {
    await this.appPage.expectMammothDodge()
})

Then('dodges are visually shown', async function () {
    await this.appPage.expectMammothDodgeVisual()
})

Then('cave throat singing audio plays during the battle', async function () {
    await this.appPage.expectBattleAudio()
})
