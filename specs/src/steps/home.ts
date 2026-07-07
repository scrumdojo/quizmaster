import { Given, When, Then } from '#steps/fixture.ts'
import type { QuizmasterWorld } from '#steps/world/world.ts'

Given('I am on the home page', async function (this: QuizmasterWorld) {
    await this.homePage.goto()
    await this.homePage.waitForLoaded()
})

When('I start creating a new workspace', async function () {
    await this.homePage.createWorkspaceLink().click()
})

When('I open workspace {string} from home', async function (this: QuizmasterWorld, title: string) {
    await this.homePage.openWorkspace(title)
})

When('I search workspaces from home', async function (this: QuizmasterWorld) {
    await this.homePage.submitWorkspaceFilter()
})

Then('I can create a new workspace', async function (this: QuizmasterWorld) {
    await this.homePage.expectCreateWorkspaceLinkVisible()
})

Then('I do not see any workspace listed on home', async function (this: QuizmasterWorld) {
    await this.homePage.expectNoWorkspacesListed()
})
