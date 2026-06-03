import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { Then, When } from '#steps/fixture.ts'
import { expectQuizFormErrors } from '#steps/quiz/expects.ts'
import type { QuizMode } from '#steps/shared/specs.ts'

When('I start creating a new quiz', async function () {
    await this.workspacePage.createNewQuiz()
})

When('I filter questions in workspace by {string}', async function (s: string) {
    await this.workspacePage.enterQuestionFilterString(s)
})

When('I see quiz question {string} in workspace', async function (title: string) {
    if (title) await this.workspacePage.expectQuestionVisible(title)
})

When("I don't see quiz questions {string} in workspace", async function (title: string) {
    await this.workspacePage.expectQuestionNotVisible(title)
})

When('I filter quizzes in workspace by {string}', async function (s: string) {
    await this.workspacePage.enterQuizFilterString(s)
})

Then('I see quiz filter label {string}', async function (text: string) {
    await this.workspacePage.expectQuizFilterLabel(text)
})

When('I see quiz {string} in workspace', async function (title: string) {
    if (title.trim()) {
        await this.workspacePage.expectQuizVisible(title)
    }
})

When("I don't see quiz {string} in workspace", async function (title: string) {
    if (title.trim()) {
        await this.workspacePage.expectQuizNotVisible(title)
    }
})

Then('I see the quiz creation page', async function () {
    await this.page.waitForSelector('#create-quiz-page')
    const isVisible = await this.page.locator('#create-quiz-page').isVisible()
    expect(isVisible).toBe(true)
})

When('I enter quiz name {string}', async function (title: string) {
    await this.quizCreatePage.enterQuizName(title)
})

When('I set randomized question count to {int}', async function (finalCount: number) {
    await this.quizCreatePage.enterQuizFinalCount(String(finalCount))
})

Then('I see empty quiz title', async function () {
    await this.quizCreatePage.expectQuizTitleValue('')
})

Then('I see empty quiz description', async function () {
    await this.quizCreatePage.expectQuizDescriptionValue('')
})

Then('I see time limit {string} seconds', async function (timeLimit: string) {
    await this.quizCreatePage.expectTimeLimitValue(timeLimit)
})

Then('I see pass score {string}', async function (score: string) {
    await this.quizCreatePage.expectPassScoreValue(score)
})

When('I see quiz question {string}', async function (title: string) {
    await expect(this.quizCreatePage.getQuestion(title).first()).toBeVisible()
})

Then('I see tag badge {string} for quiz question {string}', async function (tag: string, question: string) {
    await this.quizCreatePage.expectQuestionTagBadge(question, tag)
})

Then('I do not see tag badge for quiz question {string}', async function (question: string) {
    await this.quizCreatePage.expectQuestionTagBadgeNotVisible(question)
})

When('questions belonging to the quiz are marked', async function (quiz: string) {
    await expect(this.quizCreatePage.getQuestion(quiz).first()).toBeVisible()
})

When("I don't see quiz questions {string}", async function (title: string) {
    await expect(this.quizCreatePage.getQuestion(title).first()).toBeHidden()
})

When('I enter quiz description {string}', async function (title: string) {
    await this.quizCreatePage.enterDescription(title)
})

When('I select question {string}', async function (question: string) {
    await this.quizCreatePage.selectQuestion(question)
})

When('I enable question randomization', async function () {
    await this.quizCreatePage.selectRandomizedFunction()
})

When(/I select (exam|learn) mode/, async function (mode: QuizMode) {
    await this.quizCreatePage.selectFeedbackMode(mode)
})

When('I submit the quiz', async function () {
    await this.quizCreatePage.submit()
})

When('I enter pass score {string}', async function (score: string) {
    await this.quizCreatePage.passScoreInput().fill(score)
})

When('I enter time limit {string}', async function (limit: string) {
    await this.quizCreatePage.timeLimitInput().fill(limit)
})

When('I set quiz availability start {string} and end {string}', async function (startDate: string, endDate: string) {
    await this.quizCreatePage.enterStartDateTime(startDate)
    await this.quizCreatePage.enterEndDateTime(endDate)
})

When('I filter questions by {string}', async function (s: string) {
    await this.quizCreatePage.enterFilterString(s)
})

Then('I clear score', async function () {
    await this.quizCreatePage.clearScore()
})

Then('I see error messages in quiz form', async function (table: DataTable) {
    await expectQuizFormErrors(
        this.quizCreatePage,
        table.raw().map(row => row[0]),
    )
})

Then('I see error {string} in quiz form', async function (error: string) {
    if (error === '') {
        const hasError = await this.quizCreatePage.hasAnyError()
        expect(hasError).toBe(false)
    } else {
        await expectQuizFormErrors(this.quizCreatePage, [error])
    }
})

Then('I see no error messages in quiz form', async function () {
    const hasError = await this.quizCreatePage.hasAnyError()
    expect(hasError).toBe(false)
})

Then('I see question is marked {string}', async function (question: string) {
    await expect(this.page.getByLabel(question)).toBeChecked()
})

Then('I see question is not marked {string}', async function (question: string) {
    await expect(this.page.getByLabel(question)).not.toBeChecked()
})

Then('form reacts correctly to all given inputs', async function (data: DataTable) {
    for (const row of data.hashes()) {
        await this.quizCreatePage.timeLimitInput().fill(row.timeLimit)
        await expect(this.quizCreatePage.formattedTimeLimitLabel()).toHaveText(row.formattedTimeLimit)
    }
})

// Quiz create page assertions (from quiz-create.ts)

Then('I see selected question count {int}', async function (expectedCount: number) {
    await this.quizCreatePage.expectSelectedQuestionCount(expectedCount)
})

Then('I see total question count {int}', async function (expectedCount: number) {
    await this.quizCreatePage.expectTotalQuestionCount(expectedCount)
})

// Quiz edit navigation

When('I navigate to edit quiz {string}', async function (quizName: string) {
    await this.workspacePage.editQuiz(quizName)
})

// ── Inline question creation ──────────────────────────────────────────────────

When('I click create new question in quiz form', async function () {
    await this.quizCreatePage.clickCreateNewQuestion()
})

Then('I see the inline question creation modal', async function () {
    await this.quizCreatePage.expectInlineQuestionModalVisible()
})

When('I fill in the inline question {string} with answer {string}', async function (question: string, answer: string) {
    await this.quizCreatePage.fillInlineQuestion(question, answer)
})

When('I save the inline question', async function () {
    await this.quizCreatePage.saveInlineQuestion()
})

Then('I am back on the quiz creation form', async function () {
    await this.quizCreatePage.expectOnQuizCreationForm()
})

Then('I see question {string} in the quiz question list', async function (question: string) {
    await this.quizCreatePage.expectQuestionInList(question)
})

// ── Cohorts ──────────────────────────────────────────

When('I create a new cohort {string}', async function (cohortName: string) {
    await this.quizSharePage.addCohort(cohortName)
})
