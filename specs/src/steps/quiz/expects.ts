import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import type {
    QuestionPage,
    QuizCreatePage,
    QuizScorePage,
    QuizStatsPage,
    QuizWelcomePage,
    TakeQuestionPage,
} from '#pages/index.ts'
import type { AnswerSpec } from '#steps/shared/specs.ts'

export const expectQuizResult = async (
    page: QuizScorePage,
    expectedCorrectAnswers: string,
    expectedTotalQuestions: number,
    expectedPercentage: number,
    expectedTextResult: string,
    expectedPassScore: number,
) => {
    await page.expectCorrectAnswers(expectedCorrectAnswers)
    await page.expectTotalQuestions(expectedTotalQuestions)
    await page.expectPercentageResult(expectedPercentage)
    await page.expectTextResult(expectedTextResult)
    await page.expectPassScore(expectedPassScore)
}

export const expectAllOptionsForQuestion = async (
    page: QuizScorePage,
    question: string,
    expectedAnswers: AnswerSpec[],
) => {
    const answers = await page.answers(question)
    expect(answers.length).toBe(expectedAnswers.length)
    for (const answer of expectedAnswers) {
        expect(answers).toContain(answer.text)
    }
}

export const expectNavigationButtons = async (questionPage: QuestionPage, expectedButtons: string[]) => {
    const buttonLocatorMap: Record<string, () => ReturnType<typeof questionPage.backButtonLocator>> = {
        Back: () => questionPage.backButtonLocator(),
        Next: () => questionPage.nextButtonLocator(),
        Evaluate: () => questionPage.evaluateButtonLocator(),
    }

    for (const name of expectedButtons) {
        const locator = buttonLocatorMap[name]
        if (!locator) throw new Error(`Unknown button: "${name}"`)
        await expect(locator()).toBeVisible()
    }

    await expect(questionPage.navigationButtonsLocator()).toHaveCount(expectedButtons.length)
}

export const expectAnswersChecked = async (takeQuestionPage: TakeQuestionPage, answers: string[], checked: boolean) => {
    for (const answer of answers) {
        if (checked) {
            await expect(takeQuestionPage.answerCheckLocator(answer)).toBeChecked()
        } else {
            await expect(takeQuestionPage.answerCheckLocator(answer)).not.toBeChecked()
        }
    }
}

const parseStatsData = (data: DataTable) => {
    const rawRows = data.raw()
    const [headerRow = [], ...bodyRows] = rawRows
    const headerCells = headerRow.map(c => c.trim())
    const filteredBodyRows = bodyRows
        .filter(row => row.some(cell => cell.trim() !== ''))
        .map(row => row.map(cell => cell.trim()))
    return { headerCells, bodyRows: filteredBodyRows }
}

export const parseTableData = (data: DataTable) => parseStatsData(data)

export const expectSummaryStatsTable = async (quizStatsPage: QuizStatsPage, data: DataTable) => {
    const { headerCells, bodyRows } = parseStatsData(data)
    await quizStatsPage.expectLabeledTable('summary', 'Summary', headerCells, bodyRows)
}

export const expectAttemptStatsTable = async (quizStatsPage: QuizStatsPage, data: DataTable) => {
    const { headerCells, bodyRows } = parseStatsData(data)
    await quizStatsPage.expectLabeledTable('attempt', 'Attempts', headerCells, bodyRows)
}

export const expectCohortLeaderboardTable = async (quizWelcomePage: QuizWelcomePage, data: DataTable) => {
    const { headerCells, bodyRows } = parseTableData(data)
    await quizWelcomePage.expectCohortLeaderboard('Cohort leaderboard', headerCells, bodyRows)
}

export const expectQuestionStatsTable = async (quizStatsPage: QuizStatsPage, data: DataTable) => {
    const { headerCells, bodyRows } = parseStatsData(data)
    await quizStatsPage.expectLabeledTable('question', 'Questions', headerCells, bodyRows)
}

export const expectCorrectAnswersCounts = (correctAnswersCounts: Record<string, string>, rows: string[][]) => {
    for (const [bookmark, expected] of rows) {
        expect(correctAnswersCounts[bookmark]).toBe(expected)
    }
}

export const expectQuizFormErrors = async (quizCreatePage: QuizCreatePage, expectedErrors: string[]) => {
    for (const error of expectedErrors) {
        await expect.poll(() => quizCreatePage.hasError(error)).toBe(true)
    }
}

export const expectIndividualsLeaderboardTable = async (quizWelcomePage: QuizWelcomePage, data: DataTable) => {
    const { headerCells, bodyRows } = parseTableData(data)
    await quizWelcomePage.expectIndividualsLeaderboard('Individuals leaderboard', headerCells, bodyRows)
}
