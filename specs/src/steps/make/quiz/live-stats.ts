import type { DataTable } from '@cucumber/cucumber'

import { Given, Step } from '#steps/fixture.ts'
import {
    answerParticipantQuestionsCorrectly,
    seedInProgressCohortAttempt,
    startParticipantInCohort,
} from '#steps/make/quiz/live-stats-ops.ts'
import type { QuizmasterWorld } from '#steps/world'

Given(
    'cohort {string} has in-progress answers for quiz {string}',
    async function (this: QuizmasterWorld, cohortName: string, quizName: string, data: DataTable) {
        const row = data.hashes()[0]
        await seedInProgressCohortAttempt(this, quizName, cohortName, Number.parseInt(row.correct, 10))
    },
)

Step(
    'a participant in cohort {string} starts quiz {string}',
    async function (this: QuizmasterWorld, cohortName: string, quizName: string) {
        await startParticipantInCohort(this, cohortName, quizName)
    },
)

Step(
    'another participant in cohort {string} starts quiz {string}',
    async function (this: QuizmasterWorld, cohortName: string, quizName: string) {
        await startParticipantInCohort(this, cohortName, quizName)
    },
)

Step('the participant answers {int} questions correctly', async function (this: QuizmasterWorld, count: number) {
    await answerParticipantQuestionsCorrectly(this, count)
})

Step('the other participant answers {int} questions correctly', async function (this: QuizmasterWorld, count: number) {
    await answerParticipantQuestionsCorrectly(this, count)
})
