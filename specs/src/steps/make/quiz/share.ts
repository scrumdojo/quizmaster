import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { Given, Then, When } from '#steps/fixture.ts'
import {
    expectCohortRowsInOrder,
    expectQuizTakeLinkFor,
    expectShareScreenError,
    expectUniqueTakeLinks,
} from '#steps/make/quiz/expects.ts'
import { seedFinishedCohortAttemptViaUI } from '#steps/make/quiz/ops.ts'
import { fetchWorkspaceQuizViaRest } from '#steps/shared/api.ts'

When('I navigate to share quiz {string}', async function (quizName: string) {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.shareQuiz(quizName)
})

Then('I see the quiz take link for {string}', async function (quizName: string) {
    const quiz = await fetchWorkspaceQuizViaRest(this, quizName)
    const origin = new URL(this.page.url()).origin
    await expectQuizTakeLinkFor(this.quizSharePage, `/quiz/${quiz.id}`, origin)
})

Then('I see no cohorts', async function () {
    await this.quizSharePage.expectNoCohorts()
})

When('I follow the quiz take link', async function () {
    await this.quizSharePage.clickTakeLink()
})

Then('I see the {string} welcome page', async function (quizName: string) {
    await this.quizWelcomePage.expectHeader('Welcome to the quiz')
    await this.quizWelcomePage.expectName(quizName)
})

Then('I see cohorts in alphabetical order', async function (data: DataTable) {
    await expectCohortRowsInOrder(
        this.quizSharePage,
        data.raw().map(row => row[0]),
    )
})

Then('I see a unique quiz take link for each cohort', async function () {
    await expectUniqueTakeLinks(this.quizSharePage)
})

Then('I see error {string} on the share screen', async function (testId: string) {
    await expectShareScreenError(this.quizSharePage, testId)
})

When('I show the QR code for the quiz take link', async function () {
    await this.quizSharePage.showQuizTakeQr()
})

When('I hide the QR code for the quiz take link', async function () {
    await this.quizSharePage.hideQuizTakeQr()
})

Then('I see the QR code for the quiz take link', async function () {
    await this.quizSharePage.expectQuizTakeQrVisible()
})

Then('I do not see the QR code for the quiz take link', async function () {
    await this.quizSharePage.expectQuizTakeQrHidden()
})

Then('the QR code value matches the quiz take link', async function () {
    expect(await this.quizSharePage.quizTakeQrValue()).toBe(await this.quizSharePage.takeLink())
})

When('I show the QR code for cohort {string}', async function (cohortName: string) {
    await this.quizSharePage.showCohortQr(cohortName)
})

Then('I see the QR code for cohort {string}', async function (cohortName: string) {
    await this.quizSharePage.expectCohortQrVisible(cohortName)
})

Then('I do not see the QR code for cohort {string}', async function (cohortName: string) {
    await this.quizSharePage.expectCohortQrHidden(cohortName)
})

Then('the QR code value matches the take link for cohort {string}', async function (cohortName: string) {
    expect(await this.quizSharePage.cohortQrValue()).toBe(await this.quizSharePage.cohortLink(cohortName))
})

When('I copy the quiz take link', async function () {
    await this.quizSharePage.copyQuizTakeLink()
})

Then('the clipboard contains the quiz take link', async function () {
    expect(await this.quizSharePage.clipboardText()).toBe(await this.quizSharePage.takeLink())
})

Then('I see that the quiz take link was copied', async function () {
    await this.quizSharePage.expectQuizTakeCopied()
})

When('I copy the take link for cohort {string}', async function (cohortName: string) {
    await this.quizSharePage.copyCohortLink(cohortName)
})

Then('the clipboard contains the take link for cohort {string}', async function (cohortName: string) {
    expect(await this.quizSharePage.clipboardText()).toBe(await this.quizSharePage.cohortLink(cohortName))
})

Then('the clipboard does not contain the take link for cohort {string}', async function (cohortName: string) {
    expect(await this.quizSharePage.clipboardText()).not.toBe(await this.quizSharePage.cohortLink(cohortName))
})

Then('I see that the take link for cohort {string} was copied', async function (cohortName: string) {
    await this.quizSharePage.expectCohortCopied(cohortName)
})

When('I rename cohort {string} to {string}', async function (from: string, to: string) {
    this.rememberedCohortLink = await this.quizSharePage.cohortLink(from)
    await this.quizSharePage.renameCohort(from, to)
})

When('I start renaming cohort {string}', async function (cohortName: string) {
    await this.quizSharePage.startRenameCohort(cohortName)
})

When('I cancel renaming cohort {string}', async function (cohortName: string) {
    await this.quizSharePage.cancelRenameCohort(cohortName)
})

Then('the take link for cohort {string} uses the same cohort guid as before', async function (cohortName: string) {
    expect(await this.quizSharePage.cohortLink(cohortName)).toBe(this.rememberedCohortLink)
})

When('I delete cohort {string}', async function (cohortName: string) {
    await this.quizSharePage.deleteCohort(cohortName)
})

Given('cohort {string} has an attempt for quiz {string}', async function (cohortName: string, quizName: string) {
    await seedFinishedCohortAttemptViaUI(this, quizName, cohortName, 1)
})

Then('I cannot delete cohort {string}', async function (cohortName: string) {
    await this.quizSharePage.expectDeleteDisabled(cohortName)
})

Then('I see a note explaining that the general take link does not assign a cohort', async function () {
    await this.quizSharePage.expectGeneralTakeLinkNote()
})

Then('I see a note explaining that cohort attempts contribute to the cohort leaderboard', async function () {
    await this.quizSharePage.expectCohortTakeLinkNote()
})

Then('I see a note explaining that cohorts with attempts cannot be deleted', async function () {
    await this.quizSharePage.expectCohortDeleteNote('Boyz')
})
