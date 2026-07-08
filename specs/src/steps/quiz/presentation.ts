import { Given, Then } from '#steps/fixture'
import { fetchWorkspaceQuizViaRest } from '#steps/shared/api.ts'

Then('I see that no questions have been released for quiz {string}', async function (quizName: string) {
    const quiz = await fetchWorkspaceQuizViaRest(this, quizName)
    await this.quizSharePage.expectReleasedQuestionsCount(0, quiz.questions.length)
})

Given('I release the next question for quiz {string}', async function (_arg: string) {
    // Step: * I release the next question for quiz "Keynote Quiz"
    // From: features/make/quiz/Quiz.Share.Presentation.feature:25:5
})

Then('I see that question {int} of quiz {string} has been released', async function (_arg: number, _arg1: string) {
    // Step: Then I see that question 1 of quiz "Keynote Quiz" has been released
    // From: features/make/quiz/Quiz.Share.Presentation.feature:26:5
})

Then('I see that question {int} of quiz {string} has not been released', async function (_arg: number, _arg1: string) {
    // Step: And I see that question 2 of quiz "Keynote Quiz" has not been released
    // From: features/make/quiz/Quiz.Share.Presentation.feature:27:5
})

Then('I see that all questions of quiz {string} have been released', async function (_arg: string) {
    // Step: Then I see that all questions of quiz "Keynote Quiz" have been released
    // From: features/make/quiz/Quiz.Share.Presentation.feature:44:5
})

Then('I cannot release the next question for quiz {string}', async function (_arg: string) {
    // Step: And I cannot release the next question for quiz "Keynote Quiz"
    // From: features/make/quiz/Quiz.Share.Presentation.feature:45:5
})

Then('I see that I am waiting for the presenter', async function () {
    await this.questionPage.expectWaitingForPresenter()
})
