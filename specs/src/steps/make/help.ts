import { Then, When } from '#steps/fixture.ts'

When('I focus the help tooltip for {string}', async function (field: string) {
    await this.appPage.focusHelpTooltip(field)
})

When('I dismiss the help tooltip', async function () {
    await this.appPage.dismissHelpTooltip()
})

Then('I see help text {string}', async function (text: string) {
    await this.appPage.expectHelpText(text)
})

Then('I do not see help text {string}', async function (text: string) {
    await this.appPage.expectHelpTextHidden(text)
})

When(
    'I focus the help tooltip for the {string} action on question {string}',
    async function (_action: string, question: string) {
        await this.workspacePage.focusInQuizHelp(question)
    },
)

When('I focus the help tooltip for the {string} action', async function (_action: string) {
    await this.workspacePage.focusDryRunHelp()
})

Then('I see help text explaining that the action lists quizzes using the question', async function () {
    await this.appPage.expectHelpText('Lists the quizzes that use this question.')
})

Then('I see help text explaining that dry run ignores scheduling', async function () {
    await this.appPage.expectHelpText('Dry run ignores scheduling. Other quiz rules still apply.')
})

Then('I see help text explaining that other quiz rules still apply', async function () {
    await this.appPage.expectHelpText('Dry run ignores scheduling. Other quiz rules still apply.')
})

When('I focus the help tooltip for statistics column {string}', async function (column: string) {
    await this.quizStatsPage.focusColumnHelp(column)
})
