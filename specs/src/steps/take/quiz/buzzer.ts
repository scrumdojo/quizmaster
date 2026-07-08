import { AfterScenario, Then, When } from '#steps/fixture.ts'
import { expectQuestion } from '#steps/question/expects.ts'
import type { QuizmasterWorld } from '#steps/world'

const cohortLoginHref = async (world: QuizmasterWorld, quizBookmark: string, teamName: string) => {
    await world.workspacePage.goto(world.workspaceGuid)
    await world.workspacePage.shareQuiz(quizBookmark)
    return await world.quizSharePage.cohortLink(teamName)
}

When('{string} logs in to quiz {string}', async function (teamName: string, quizBookmark: string) {
    const cohortHref = await cohortLoginHref(this, quizBookmark, teamName)
    const team = await this.getOrCreateBuzzerTeam(teamName)

    await team.page.goto(cohortHref)
    await team.quizWelcomePage.start()
    await team.quizNicknamePage.waitForLoaded()
    await team.quizNicknamePage.fillNickname(teamName)
    await team.quizNicknamePage.startQuiz()
    await team.quizBuzzerLobbyPage.waitForLoaded()
})

Then('{string} does not see the countdown timer', async function (teamName: string) {
    const team = await this.getOrCreateBuzzerTeam(teamName)
    await team.quizBuzzerLobbyPage.expectNoCountdown()
})

Then('both teams see the countdown timer {string}', async function (value: string) {
    for (const team of Object.values(this.buzzerTeams)) {
        await team.quizBuzzerLobbyPage.expectCountdown(value)
    }
})

Then('both teams see question {string}', async function (bookmark: string) {
    const question = this.questionBookmarks[bookmark]
    for (const team of Object.values(this.buzzerTeams)) {
        await team.takeQuestionPage.waitForLoaded()
        await expectQuestion(team.takeQuestionPage, question)
    }
})

AfterScenario(async function () {
    for (const team of Object.values(this.buzzerTeams)) {
        await team.page.context().close()
    }
})
