import { Then, When } from '#steps/fixture.ts'

When('I select the {string} app theme', async function (label: string) {
    await this.appPage.selectAppTheme(label)
})

Then('the app theme is {string}', async function (theme: string) {
    await this.appPage.expectAppTheme(theme)
})

Then('the app theme selector is visible', async function () {
    await this.appPage.expectAppThemeSettingsAlwaysVisible()
})

Then('the app theme FAB label reads {string}', async function (label: string) {
    await this.appPage.expectAppThemeFabLabel(label)
})

When('I open the app theme dropdown', async function () {
    await this.appPage.openThemeSettings()
})

Then('I see all app theme options in the dropdown', async function () {
    await this.appPage.expectAppThemeDropdownOptionsVisible()
})
