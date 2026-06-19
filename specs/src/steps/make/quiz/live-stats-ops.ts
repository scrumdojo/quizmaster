import type { QuizAttemptStartResponse } from '#shared/types/quiz.ts'
import { fetchWorkspaceQuizViaRest } from '#steps/shared/api.ts'
import type { QuizmasterWorld } from '#steps/world'

const resolveQuizId = (world: QuizmasterWorld, quizName: string): number => {
    const bookmark = world.quizBookmarks[quizName]
    if (!bookmark) throw new Error(`No quiz bookmark for "${quizName}"`)
    const id = bookmark.split('/').pop()
    if (!id) throw new Error(`Could not extract quiz id from bookmark "${bookmark}"`)
    return Number.parseInt(id, 10)
}

const resolveCohortGuid = async (world: QuizmasterWorld, quizName: string, cohortName: string): Promise<string> => {
    const quiz = await fetchWorkspaceQuizViaRest(world, quizName)
    const cohort = quiz.cohorts?.find(entry => entry.name === cohortName)
    if (!cohort) {
        throw new Error(`Cohort "${cohortName}" not found on quiz "${quizName}"`)
    }
    return cohort.guid
}

const startCohortAttemptViaRest = async (
    world: QuizmasterWorld,
    quizName: string,
    cohortName: string,
    nickname: string,
): Promise<QuizAttemptStartResponse> => {
    const quizId = resolveQuizId(world, quizName)
    const cohortGuid = await resolveCohortGuid(world, quizName, cohortName)
    const url = `/api/quiz/${quizId}/attempts`
    const response = await world.page.request.post(url, {
        data: { cohortGuid, nickname },
    })
    if (!response.ok()) {
        throw new Error(`POST ${url} failed: ${response.status()} ${await response.text()}`)
    }
    return (await response.json()) as QuizAttemptStartResponse
}

const submitCorrectChoiceViaRest = async (
    world: QuizmasterWorld,
    quizId: number,
    attemptId: number,
    questionId: number,
) => {
    const url = `/api/quiz/${quizId}/attempts/${attemptId}/questions/${questionId}/submit`
    const response = await world.page.request.post(url, {
        data: { type: 'choice', selectedIdxs: [0] },
    })
    if (!response.ok()) {
        throw new Error(`POST ${url} failed: ${response.status()} ${await response.text()}`)
    }
}

export const seedInProgressCohortAttempt = async (
    world: QuizmasterWorld,
    quizName: string,
    cohortName: string,
    correctAnswers: number,
) => {
    world.nextParticipantNumber += 1
    const start = await startCohortAttemptViaRest(
        world,
        quizName,
        cohortName,
        `Seed participant ${world.nextParticipantNumber}`,
    )
    const quizId = resolveQuizId(world, quizName)
    for (let i = 0; i < correctAnswers; i++) {
        await submitCorrectChoiceViaRest(world, quizId, start.attemptId, start.questions[i].id)
    }
}

export const startParticipantInCohort = async (world: QuizmasterWorld, cohortName: string, quizName: string) => {
    world.nextParticipantNumber += 1
    const start = await startCohortAttemptViaRest(
        world,
        quizName,
        cohortName,
        `Participant ${world.nextParticipantNumber}`,
    )
    world.participantAttempt = {
        quizId: resolveQuizId(world, quizName),
        attemptId: start.attemptId,
        questions: start.questions,
        nextQuestionIndex: 0,
    }
}

export const answerParticipantQuestionsCorrectly = async (world: QuizmasterWorld, count: number) => {
    const attempt = world.participantAttempt
    if (!attempt) {
        throw new Error('No participant attempt is in progress')
    }

    for (let i = 0; i < count; i++) {
        const question = attempt.questions[attempt.nextQuestionIndex + i]
        if (!question) {
            throw new Error(`Participant attempt has only ${attempt.questions.length} questions`)
        }
        await submitCorrectChoiceViaRest(world, attempt.quizId, attempt.attemptId, question.id)
    }
    attempt.nextQuestionIndex += count
}
