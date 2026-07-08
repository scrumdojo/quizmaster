import type { Response as PlaywrightResponse } from '@playwright/test'

import { advanceServerClock } from '#steps/clock.ts'
import type { QuizmasterWorld } from '#steps/world'

export const openQuiz = async (world: QuizmasterWorld, quizBookmark: string) => {
    const quizUrl = world.quizBookmarks[quizBookmark]
    await world.page.goto(quizUrl)
}

const DEFAULT_NICKNAME = 'Spec Runner'

// Fixed nickname per cohort so repeated visits (e.g. seeding a finished attempt,
// then taking the quiz again as the same cohort) resolve to the same taker identity.
export const cohortParticipantNickname = (cohortName: string) => `Cohort ${cohortName}`

const waitForQuizStartTransition = async (world: QuizmasterWorld) => {
    await world.page.waitForURL(url => {
        const path = url.pathname
        return (
            /\/quiz\/\d+(?:\/cohort\/[^/]+)?\/nickname$/.test(path) ||
            /\/quiz\/\d+\/questions(?:\/\d+)?$/.test(path) ||
            /\/workspace\/[^/]+\/quiz\/\d+\/dry-run\/questions(?:\/\d+)?$/.test(path)
        )
    })
}

const waitForQuizQuestions = async (world: QuizmasterWorld) => {
    await world.page.waitForURL(url => {
        const path = url.pathname
        return (
            /\/quiz\/\d+\/questions(?:\/\d+)?$/.test(path) ||
            /\/workspace\/[^/]+\/quiz\/\d+\/dry-run\/questions(?:\/\d+)?$/.test(path)
        )
    })
}

const isQuizWelcomePath = (path: string) => /\/quiz\/\d+(?:\/cohort\/[^/]+)?$/.test(path)

export const continueQuizStart = async (world: QuizmasterWorld, nickname = DEFAULT_NICKNAME) => {
    const currentPath = new URL(world.page.url()).pathname

    if (isQuizWelcomePath(currentPath)) {
        await world.quizWelcomePage.waitForLoaded()
        await world.quizWelcomePage.start()
        await waitForQuizStartTransition(world)
    }

    if (new URL(world.page.url()).pathname.includes('/nickname')) {
        await world.quizNicknamePage.waitForLoaded()
        await world.quizNicknamePage.fillNickname(nickname)
        await world.quizNicknamePage.startQuiz()
        await waitForQuizQuestions(world)
    }

    await world.takeQuestionPage.waitForLoaded()
    world.lastAnsweredTitle = undefined
}

export const startQuiz = async (world: QuizmasterWorld, quizBookmark: string, nickname = DEFAULT_NICKNAME) => {
    await openQuiz(world, quizBookmark)
    world.activeQuizBookmark = quizBookmark
    await continueQuizStart(world, nickname)
}

const isQuizQuestionSubmitResponse = (response: PlaywrightResponse) => {
    const url = new URL(response.url())
    return (
        response.request().method() === 'POST' &&
        /\/api\/quiz\/\d+\/attempts\/\d+\/questions\/\d+\/submit$/.test(url.pathname) &&
        response.status() < 400
    )
}

const isQuizEvaluateResponse = (response: PlaywrightResponse) => {
    const url = new URL(response.url())
    return (
        response.request().method() === 'POST' &&
        /\/api\/quiz\/\d+\/attempts\/\d+\/evaluate$/.test(url.pathname) &&
        response.status() < 400
    )
}

const waitForAnswerSettled = async (world: QuizmasterWorld, questionTextBefore: string) => {
    const signals = [
        world.takeQuestionPage.questionFeedbackLocator().waitFor({ state: 'visible' }),
        world.questionPage.evaluateButtonLocator().waitFor({ state: 'visible' }),
        world.takeQuestionPage.expectQuestionTextNotToBe(questionTextBefore),
    ]

    await Promise.any(signals)
}

export const answerNth = async (world: QuizmasterWorld, n: number) => {
    await world.takeQuestionPage.waitForLoaded()
    const questionTextBefore = (await world.takeQuestionPage.questionText()) ?? ''
    const submitResponse = world.page.waitForResponse(isQuizQuestionSubmitResponse)

    await world.takeQuestionPage.selectAnswerNth(n)
    await world.takeQuestionPage.submit()
    await submitResponse
    await waitForAnswerSettled(world, questionTextBefore)
}

export const answerCorrectly = async (world: QuizmasterWorld) => answerNth(world, 0)
export const answerIncorrectly = async (world: QuizmasterWorld) => answerNth(world, 1)

export const repeatAsync = async (n: number, fn: () => Promise<void>) => {
    for (let i = 0; i < n; i++) await fn()
}

export const finishQuizInSeconds = async (world: QuizmasterWorld, seconds: number) => {
    await advanceServerClock(world, seconds)
    const evaluateResponse = world.page.waitForResponse(isQuizEvaluateResponse)
    await world.questionPage.evaluateButtonLocator().click()
    await evaluateResponse
    await world.workspacePage.goto(world.workspaceGuid)
}

export const progressThroughQuestions = async (world: QuizmasterWorld) => {
    const textToBookmark: Record<string, string> = {}
    for (const [bookmark, question] of Object.entries(world.questionBookmarks)) {
        textToBookmark[question.text] = bookmark
    }

    const questionCount = Object.keys(textToBookmark).length

    for (let i = 0; i < questionCount; i++) {
        await world.takeQuestionPage.waitForLoaded()

        const questionText = (await world.takeQuestionPage.questionText()) || ''
        const bookmark = textToBookmark[questionText] || questionText

        const countLocator = world.takeQuestionPage.correctAnswersCountLocator()
        const isVisible = await countLocator.isVisible()

        if (isVisible) {
            const count = await countLocator.textContent()
            world.correctAnswersCounts[bookmark] = count || '-'
        } else {
            world.correctAnswersCounts[bookmark] = '-'
        }

        const questionTextBefore = questionText

        await world.takeQuestionPage.selectAnswerNth(0)
        const submitResponse = world.page.waitForResponse(isQuizQuestionSubmitResponse)
        await world.takeQuestionPage.submit()
        await submitResponse
        await waitForAnswerSettled(world, questionTextBefore)
    }
}
