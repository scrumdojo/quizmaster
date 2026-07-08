import { Then, When } from '#steps/fixture.ts'
import { answerNamedQuestionInCohort } from '#steps/make/quiz/epic-battle-ops.ts'
import type { QuizmasterWorld } from '#steps/world'

Then('I do not see the Epic Battle button', async function (this: QuizmasterWorld) {
    await this.quizSharePage.expectEpicBattleButtonHidden()
})

Then('I see the Epic Battle button', async function (this: QuizmasterWorld) {
    await this.quizSharePage.expectEpicBattleButtonVisible()
})

When('I open Epic Battle', async function (this: QuizmasterWorld) {
    await this.quizSharePage.openEpicBattle()
})

Then('I see the Epic Battle page for quiz {string}', async function (this: QuizmasterWorld, quizName: string) {
    await this.epicBattlePage.expectEpicBattlePageForQuiz(quizName)
})

Then('I see a Roman army for cohort {string}', async function (this: QuizmasterWorld, cohortName: string) {
    await this.epicBattlePage.expectArmyVisible(cohortName)
})

Then('I see the battle is even', async function (this: QuizmasterWorld) {
    await this.epicBattlePage.expectBattleEven()
})

Then(
    'I see the army for cohort {string} has landed {int} hit(s)',
    async function (this: QuizmasterWorld, cohortName: string, hits: number) {
        await this.epicBattlePage.expectArmyHits(cohortName, hits)
    },
)

Then(
    'I see the army for cohort {string} is winning the battle',
    async function (this: QuizmasterWorld, cohortName: string) {
        await this.epicBattlePage.expectArmyStatus(cohortName, 'winning')
    },
)

Then(
    'I see the army for cohort {string} is losing the battle',
    async function (this: QuizmasterWorld, cohortName: string) {
        await this.epicBattlePage.expectArmyStatus(cohortName, 'losing')
    },
)

Then('I see the two armies actively clashing', async function (this: QuizmasterWorld) {
    await this.epicBattlePage.expectArmiesClashing()
})

When(
    'a participant in cohort {string} answers question {string} correctly',
    async function (this: QuizmasterWorld, cohortName: string, questionText: string) {
        await answerNamedQuestionInCohort(this, cohortName, this.activeQuizBookmark, questionText, 'correctly')
    },
)

When(
    'a participant in cohort {string} answers question {string} partially',
    async function (this: QuizmasterWorld, cohortName: string, questionText: string) {
        await answerNamedQuestionInCohort(this, cohortName, this.activeQuizBookmark, questionText, 'partially')
    },
)
