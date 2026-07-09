import { expect } from '@playwright/test'

import { Given, Then } from '#steps/fixture.ts'
import { cohortParticipantNickname } from '#steps/quiz/ops.ts'

Given(
    'I open the mistakes history for quiz {string} and cohort {string} directly',
    async function (quizName: string, cohortName: string) {
        const quizId = this.quizBookmarks[quizName].split('/').pop()
        await this.workspacePage.goto(this.workspaceGuid)
        await this.workspacePage.shareQuiz(quizName)
        const cohortHref = await this.quizSharePage.cohortLink(cohortName)
        const cohortGuid = cohortHref.split('/').pop() ?? ''
        const nickname = cohortParticipantNickname(cohortName)
        await this.page.goto(
            `/quiz/${quizId}/history?nickname=${encodeURIComponent(nickname)}&cohortGuid=${encodeURIComponent(cohortGuid)}`,
        )
    },
)

Then('I see question {string} in my mistakes history', async function (question: string) {
    const questions = await this.quizMistakesHistoryPage.mistakeQuestions()
    expect(questions).toContain(question)
})

Then('I do not see question {string} in my mistakes history', async function (question: string) {
    const questions = await this.quizMistakesHistoryPage.mistakeQuestions()
    expect(questions).not.toContain(question)
})

Then('I see no mistakes in my history', async function () {
    await this.quizMistakesHistoryPage.expectEmpty()
})
