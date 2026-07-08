import { resolveQuizId, startCohortAttemptViaRest, submitChoiceViaRest } from '#steps/make/quiz/live-stats-ops.ts'
import type { QuizmasterWorld } from '#steps/world'

export const answerNamedQuestionInCohort = async (
    world: QuizmasterWorld,
    cohortName: string,
    quizName: string,
    questionText: string,
    mode: 'correctly' | 'partially',
) => {
    world.nextParticipantNumber += 1
    const start = await startCohortAttemptViaRest(
        world,
        quizName,
        cohortName,
        `Participant ${world.nextParticipantNumber}`,
    )
    const quizId = resolveQuizId(world, quizName)
    const questionId = world.questionIds[questionText]
    if (!questionId) throw new Error(`No question id bookmarked for "${questionText}"`)
    const question = world.questionBookmarks[questionText]
    if (!question) throw new Error(`No question bookmark for "${questionText}"`)

    const correctIdxs = question.answers.flatMap((answer, index) => (answer.correct ? [index] : []))
    const selectedIdxs = mode === 'correctly' ? correctIdxs : correctIdxs.slice(0, 1)

    await submitChoiceViaRest(world, quizId, start.attemptId, questionId, selectedIdxs)
}
