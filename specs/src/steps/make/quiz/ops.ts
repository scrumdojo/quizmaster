import { ensureWorkspaceGuid } from '#steps/make/workspace/ops.ts'
import { answerNth } from '#steps/quiz/ops.ts'
import { createQuizViaRest } from '#steps/shared/api.ts'
import type { QuizSpec } from '#steps/shared/specs.ts'
import type { QuizmasterWorld } from '#steps/world'

export const createQuiz = async (world: QuizmasterWorld, spec: QuizSpec) => {
    await ensureWorkspaceGuid(world)
    const id = await createQuizViaRest(world, world.workspaceGuid, spec)
    world.bookmarkQuiz(spec.bookmark ?? spec.name, `/quiz/${id}`)

    // Re-load the workspace page so its quiz list reflects the REST-inserted quiz.
    // Several downstream GUI steps (e.g. "I see the quiz X in the workspace", "I take
    // quiz X", "I navigate to edit quiz X") read from whatever page is currently loaded.
    await world.page.goto(`/workspace/${world.workspaceGuid}`)
}

export const addCohortViaShareScreen = async (world: QuizmasterWorld, quizName: string, cohortName: string) => {
    if (!(await world.quizSharePage.isVisible())) {
        await world.workspacePage.goto(world.workspaceGuid)
        await world.workspacePage.shareQuiz(quizName)
    }
    await world.quizSharePage.addCohort(cohortName)
}

export const seedFinishedCohortAttemptViaUI = async (
    world: QuizmasterWorld,
    quizBookmark: string,
    cohortName: string,
    correctAnswers: number,
) => {
    await world.workspacePage.goto(world.workspaceGuid)
    await world.workspacePage.shareQuiz(quizBookmark)
    const cohortHref = await world.quizSharePage.cohortLink(cohortName)
    await world.page.goto(cohortHref)
    await world.quizWelcomePage.start()
    const totalQuestions = await world.questionPage.progressMax()
    for (let i = 0; i < totalQuestions; i++) {
        await answerNth(world, i < correctAnswers ? 0 : 1)
    }
    await world.questionPage.evaluate()
}

export const seedFinishedIndividualAttemptViaUI = async (
    world: QuizmasterWorld,
    quizBookmark: string,
    nickName: string,
    correctAnswers: number,
) => {
    await world.workspacePage.goto(world.workspaceGuid)
    await world.workspacePage.shareQuiz(quizBookmark)
    const takeHref = await world.quizSharePage.takeLink()
    await world.page.goto(takeHref)
    await world.quizWelcomePage.start()

    // TODO jako individual jdu vyplnit kviz, tzn. nekde vyplnim nickname a zodpovim otazky

    const totalQuestions = await world.questionPage.progressMax()
    for (let i = 0; i < totalQuestions; i++) {
        await answerNth(world, i < correctAnswers ? 0 : 1)
    }
    await world.questionPage.evaluate()
}
