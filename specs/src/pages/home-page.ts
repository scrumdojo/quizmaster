import { expect, type Page } from '@playwright/test'

export class HomePage {
    constructor(private page: Page) {}

    // Navigate to the home page
    goto = () => this.page.goto('/')

    // Wait for the home page to load
    waitForLoaded = () => this.page.waitForSelector('h1:has-text("Welcome to Quizmaster! You rock.")')

    // Locators for the links
    createWorkspaceLink = () => this.page.locator('a[href="/workspace/new"]')
    workspaceLink = (title: string) => this.page.locator('.home-workspaces__link', { hasText: title })
    private workspaceListLocator = () => this.page.locator('.home-workspaces__list')
    private workspaceFilterSubmitLocator = () => this.page.locator('#workspace-filter-form button[type="submit"]')

    // Retrying assertions
    expectCreateWorkspaceLinkVisible = () => expect(this.createWorkspaceLink()).toBeVisible()
    expectNoWorkspacesListed = () => expect(this.workspaceListLocator()).toHaveCount(0)

    openWorkspace = (title: string) => this.workspaceLink(title).click()
    submitWorkspaceFilter = () => this.workspaceFilterSubmitLocator().click()
}
