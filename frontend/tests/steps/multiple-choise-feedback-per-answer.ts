import { Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'
import { worldAs } from './common.ts'
import type QuizTakingPage from '../pages/quiz-taking-page'

interface MultipleChoiceWorld {
    quizTakingPage: QuizTakingPage
}

const world = worldAs<MultipleChoiceWorld>()

Then('quiz taker sees question with multiple choice', async () => {
    const questionType = await world.quizTakingPage.getQuestionType()
    expect(questionType).toBe('multiple choice')
})

Then('quiz taker sees the {string}', async (result: string) => {
    const feedback = await world.quizTakingPage.getFeedback()
    expect(feedback).toContain(result)
})
