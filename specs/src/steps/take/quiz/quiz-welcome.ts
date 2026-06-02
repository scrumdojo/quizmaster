import type { DataTable } from '@cucumber/cucumber'

import { Given, Then } from '#steps/fixture.ts'
import {
    addCohortViaShareScreen,
    seedFinishedCohortAttemptViaUI,
    seedFinishedIndividualAttemptViaUI,
} from '#steps/make/quiz/ops.ts'
import { expectCohortLeaderboardTable, expectIndividualsLeaderboardTable } from '#steps/quiz/expects.ts'

Then('I see the welcome page', async function () {
    await this.quizWelcomePage.expectHeader('Welcome to the quiz')
})

Then('I see quiz name {string}', async function (quizName: string) {
    await this.quizWelcomePage.expectName(quizName)
})

Then('I see quiz description {string}', async function (description: string) {
    await this.quizWelcomePage.expectDescription(description)
})

Then('I see question count {int}', async function (questionCount: number) {
    await this.quizWelcomePage.expectQuestionCount(questionCount)
})

Then('I see feedback type {string}', async function (feedbackType: string) {
    await this.quizWelcomePage.expectFeedback(feedbackType)
})

Then('I see pass score {int} %', async function (passScore: number) {
    await this.quizWelcomePage.expectPassScore(passScore)
})

Then('I see time limit set to {string} seconds', async function (timeLimit: string) {
    await this.quizWelcomePage.expectTimeLimit(timeLimit)
})

Then('I can start the quiz', async function () {
    await this.quizWelcomePage.expectStartEnabled()
})

Then('I see status message {string}', async function (message: string) {
    await this.quizWelcomePage.expectStatusMessage(message)
})

Then('I cannot start the quiz', async function () {
    await this.quizWelcomePage.expectStartDisabled()
})

Then('I see the cohort leaderboard', async function (data: DataTable) {
    await expectCohortLeaderboardTable(this.quizWelcomePage, data)
})

Given('quiz {string} has cohorts', async function (quizName: string, data: DataTable) {
    for (const row of data.hashes()) {
        await addCohortViaShareScreen(this, quizName, row.cohort)
    }
})

Given('quiz {string} has finished cohort attempts', async function (quizName: string, data: DataTable) {
    for (const row of data.hashes()) {
        await seedFinishedCohortAttemptViaUI(this, quizName, row.cohort, Number.parseInt(row.correct, 10))
    }
})

Given('quiz {string} has finished individuals attempts', async function (quizName: string, data: DataTable) {
    for (const row of data.hashes()) {
        await seedFinishedIndividualAttemptViaUI(this, quizName, row.nickname, Number.parseInt(row.correct, 10))
    }
})

Then('I see the individuals leaderboard', async function (data: DataTable) {
    await expectIndividualsLeaderboardTable(this.quizWelcomePage, data)
})
