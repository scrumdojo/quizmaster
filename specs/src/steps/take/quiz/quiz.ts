import { advanceServerClock } from '#steps/clock.ts'
import { expectTextToBe } from '#steps/common.ts'
import { Given, When, Then } from '#steps/fixture.ts'
import { expectQuestion } from '#steps/question/expects.ts'
import { expectNavigationButtons } from '#steps/quiz/expects.ts'
import { continueQuizStart, openQuiz, startQuiz } from '#steps/quiz/ops.ts'

const parseTimerTextToSeconds = (timer: string) => {
    const [minutes = '0', seconds = '0'] = timer.split(':')
    return Number.parseInt(minutes, 10) * 60 + Number.parseInt(seconds, 10)
}

const formatTimerSeconds = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

Given('I open quiz {string}', async function (quizBookmark: string) {
    await openQuiz(this, quizBookmark)
})

Given('I open quiz {string} for cohort {string}', async function (quizBookmark: string, cohortName: string) {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.shareQuiz(quizBookmark)
    const cohortHref = await this.quizSharePage.cohortLink(cohortName)
    await this.page.goto(cohortHref)
    this.activeQuizBookmark = quizBookmark
})

Given('I open quiz questions for {string}', async function (quizBookmark: string) {
    const quizUrl = this.quizBookmarks[quizBookmark]
    await this.page.goto(`${quizUrl}/questions`)
})

Given('I start quiz {string}', async function (quizBookmark: string) {
    await startQuiz(this, quizBookmark)
})

Given('I start the quiz', async function () {
    const onWelcomePage = await this.quizWelcomePage.startButton().isVisible().catch(() => false)
    const onNicknamePage = await this.quizNicknamePage.isVisible()

    if (!onWelcomePage && !onNicknamePage) {
        if (!this.activeQuizBookmark) {
            throw new Error('No active quiz bookmark available for quiz start')
        }
        await openQuiz(this, this.activeQuizBookmark)
    }

    await continueQuizStart(this)
})

Then('I see question {string}', async function (bookmark: string) {
    const question = this.questionBookmarks[bookmark]
    await expectQuestion(this.takeQuestionPage, question)
})

Then('I do not see question {string}', async function (bookmark: string) {
    const question = this.questionBookmarks[bookmark]
    await this.takeQuestionPage.expectQuestionTextNotToBe(question.text)
})

When('I proceed to the next question', async function () {
    await this.questionPage.next()
})

When('I skip the question', async function () {
    const nextButton = this.questionPage.nextButtonLocator()
    const evaluateButton = this.questionPage.evaluateButtonLocator()
    const visible = await nextButton
        .or(evaluateButton)
        .first()
        .waitFor({ state: 'visible', timeout: 5000 })
        .then(() => true)
        .catch(() => false)
    if (visible) {
        if (await nextButton.isVisible()) {
            await nextButton.click()
        } else {
            await evaluateButton.click()
        }
    }
})

When('I go back to previous question', async function () {
    await this.questionPage.back()
})

When('I evaluate the quiz', async function () {
    await this.questionPage.evaluate()
})

Then('I see the timeout message', async function () {
    await expectTextToBe(this.questionPage.dialogTextLocator(), "Time's up")
})

Then('I see buttons {string}', async function (buttonList: string) {
    await expectNavigationButtons(
        this.questionPage,
        buttonList.split(',').map(b => b.trim()),
    )
})

Then('progress shows {int} of {int}', async function (current: number, max: number) {
    await this.questionPage.expectProgress(current, max)
})

When('{int} seconds pass', async function (seconds: number) {
    await this.questionPage.timerLocator().waitFor({ state: 'visible' })
    const timerBefore = ((await this.questionPage.timerLocator().textContent()) ?? '00:00').trim()
    const remainingBefore = parseTimerTextToSeconds(timerBefore)
    const remainingAfter = Math.max(0, remainingBefore - seconds)

    await advanceServerClock(this, seconds)
    await this.page.evaluate(ms => {
        window.__advanceQuizClock?.(ms)
    }, seconds * 1000)

    await expectTextToBe(this.questionPage.timerLocator(), formatTimerSeconds(remainingAfter))

    if (remainingAfter === 0) {
        await this.questionPage.dialogTextLocator().waitFor({ state: 'visible' })
    }
})

Then('I see the countdown timer {string}', async function (timer: string) {
    await expectTextToBe(this.questionPage.timerLocator(), timer)
})

Then('I see answer {string} checked', async function (answer: string) {
    await this.takeQuestionPage.expectAnswerChecked(answer)
})

Then('I see the submit button as active', async function () {
    await this.takeQuestionPage.expectSubmitEnabled()
})

Then('I see the submit button as inactive', async function () {
    await this.takeQuestionPage.expectSubmitDisabled()
})
