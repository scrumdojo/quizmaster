import type { QuizmasterWorld } from '#steps/world'

export const openQuiz = async (world: QuizmasterWorld, quizBookmark: string) => {
    const quizUrl = world.quizBookmarks[quizBookmark]
    await world.page.goto(quizUrl)
}

export const ensureFakeClockInstalled = async (world: QuizmasterWorld) => {
    if (!world.clockInstalled) {
        await world.page.clock.install({ time: new Date() })
        world.clockInstalled = true
    }
}

export const startQuiz = async (world: QuizmasterWorld, quizBookmark: string) => {
    await ensureFakeClockInstalled(world)
    await openQuiz(world, quizBookmark)
    await world.quizWelcomePage.start()
    world.activeQuizBookmark = quizBookmark
}

export const answerNth = async (world: QuizmasterWorld, n: number) => {
    await world.takeQuestionPage.waitForLoaded()
    await world.takeQuestionPage.selectAnswerNth(n)
    await world.takeQuestionPage.submit()
}

export const answerCorrectly = async (world: QuizmasterWorld) => answerNth(world, 0)
export const answerIncorrectly = async (world: QuizmasterWorld) => answerNth(world, 1)

export const answerPartiallyCorrectly = async (world: QuizmasterWorld) => answerNth(world, 2)


export const repeatAsync = async (n: number, fn: () => Promise<void>) => {
    for (let i = 0; i < n; i++) await fn()
}

export const finishQuizInSeconds = async (world: QuizmasterWorld, seconds: number) => {
    await world.page.clock.fastForward(seconds * 1000)
    await world.questionPage.evaluateButtonLocator().click()
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

        await world.takeQuestionPage.selectAnswerNth(0)
        await world.takeQuestionPage.submit()
    }
}
