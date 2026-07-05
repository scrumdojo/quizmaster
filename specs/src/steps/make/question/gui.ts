import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { Given, Then, When } from '#steps/fixture.ts'
import {
    enterAnswers,
    enterAIPrompt,
    enterAnswer,
    enterAnswerExplanation,
    enterAnswerText,
    enterLastAnswerText,
    enterImageUrl,
    enterQuestion,
    enterQuestionExplanation,
    markAnswerCorrectness,
    submitQuestion,
    attemptSubmitQuestion,
    enterTag,
    createQuestion,
} from '#steps/make/question/ops.ts'
import { ensureWorkspace } from '#steps/make/workspace/ops.ts'
import {
    expectAnswer,
    expectDeleteButtonsState,
    expectEmptyAnswers,
    expectErrorCount,
    expectErrorMessages,
} from '#steps/question/expects.ts'
import { parseAnswerTable } from '#steps/shared/parsers.ts'

const AI_RESPONSE_TIMEOUT = 120_000

Given('I start creating a new question', async function () {
    await ensureWorkspace(this)
    await this.workspacePage.createNewQuestion()
    this.questionWip = { text: '', answers: [] }
})

Given('I start editing question {string}', async function (bookmark: string) {
    this.questionWip = this.questionBookmarks[bookmark]
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.editQuestion(this.questionWip.text)
    this.activeQuestionBookmark = bookmark
})

Given('the workspace already contains the question {string}', async function (question: string) {
    await createQuestion(this, {
        text: question,
        answers: [
            { text: 'Correct answer', correct: true },
            { text: 'Incorrect answer', correct: false },
        ],
    })
})

When('I enable explanations', async function () {
    await this.questionEditPage.enableExplanations()
})

When('I disable explanations', async function () {
    await this.questionEditPage.disableExplanations()
})

When('I select numerical question type', async function () {
    await this.questionEditPage.setNumericalChoice()
})

// Title assertions

Then('I see question edit page', async function () {
    await this.questionEditPage.expectEditPageVisible()
})

Then('I see the question creation page', async function () {
    await this.questionEditPage.expectCreatePageVisible()
})

// Field assertions

Then('I see empty question text', async function () {
    await this.questionEditPage.expectQuestionValue('')
})

Then('I see question text {string}', async function (question: string) {
    await this.questionEditPage.expectQuestionValue(question)
})

When('I enter tag {string}', async function (tag: string) {
    await enterTag(this, tag)
})

Then('I see tag {string}', async function (tag: string) {
    await this.questionEditPage.expectTagValue(tag)
})

Then('I see empty tag', async function () {
    await this.questionEditPage.expectEmptyTag()
})

Then(/I see explanations are (enabled|disabled)/, async function (value: string) {
    if (value === 'enabled') {
        await this.questionEditPage.expectExplanationsChecked()
    } else {
        await this.questionEditPage.expectExplanationsUnchecked()
    }
})

Then(/the question is (single choice|multiple choice|numerical)/, async function (value: string) {
    const expectedType = value === 'numerical' ? 'numerical' : value === 'multiple choice' ? 'multiple' : 'single'
    await this.questionEditPage.expectQuestionType(expectedType)
})

Then('I see numerical answer field', async function () {
    await this.questionEditPage.expectNumericalAnswerVisible()
})

Then('I do not see answer fields', async function () {
    await this.questionEditPage.expectAnswerRowCount(0)
})

Then('I do not see Add Answer button', async function () {
    await this.questionEditPage.expectAddAnswerNotVisible()
})

Then('I see numerical correct answer {string}', async function (value: string) {
    await this.questionEditPage.expectNumericalCorrectAnswer(value)
})

Then('I see non-empty numerical correct answer', async function () {
    await this.questionEditPage.expectNumericalCorrectAnswerNotEmpty()
})

Then('I see tolerance {string}', async function (value: string) {
    await this.questionEditPage.expectNumericalTolerance(value)
})

Then('I see non-empty tolerance', async function () {
    await this.questionEditPage.expectNumericalToleranceNotEmpty()
})

Then('tolerance is greater than {string}', async function (threshold: string) {
    await this.questionEditPage.expectNumericalToleranceGreaterThan(Number.parseFloat(threshold))
})

Then('tolerance is less than {string}', async function (threshold: string) {
    await this.questionEditPage.expectNumericalToleranceLessThan(Number.parseFloat(threshold))
})

Then('I see note {string}', async function (value: string) {
    await this.questionEditPage.expectNumericalAnswerNote(value)
})

Then('I see a note explaining the available question types', async function () {
    await this.questionEditPage.expectQuestionTypeNote()
})

Then('the note explains that single choice requires one correct answer', async function () {
    await this.questionEditPage.expectQuestionTypeNoteContains('Single choice requires one correct answer.')
})

Then('the note explains that multiple choice requires at least two correct answers', async function () {
    await this.questionEditPage.expectQuestionTypeNoteContains('Multiple choice requires at least two correct answers.')
})

Then('the note explains that numerical questions require a numeric answer', async function () {
    await this.questionEditPage.expectQuestionTypeNoteContains('Numerical questions require a numeric answer.')
})

Then('I see a note explaining how to mark correct answers', async function () {
    await this.questionEditPage.expectCorrectAnswerNote()
})

Then('I see a note explaining numerical tolerance', async function () {
    await this.questionEditPage.expectToleranceNote()
})

Then('the note explains that zero tolerance requires an exact answer', async function () {
    await this.questionEditPage.expectToleranceNoteContains('Zero tolerance requires an exact answer.')
})

Then(/easy is (on|off)/, async function (value: string) {
    if (value === 'on') {
        await this.questionEditPage.expectEasyChecked()
    } else {
        await this.questionEditPage.expectEasyUnchecked()
    }
})

Then(/easy is (available|not available)/, async function (value: string) {
    if (value === 'available') {
        await this.questionEditPage.expectEasyVisible()
    } else {
        await this.questionEditPage.expectEasyNotVisible()
    }
})

Then('I do not see AI section', async function () {
    await this.robinSheetPage.expectPromptNotVisible()
})

Then('I see AI section', async function () {
    await this.robinSheetPage.expectPromptVisible()
})

Then('I see explanation fields', async function () {
    await this.questionEditPage.expectExplanationFieldsExist()
})

Then('I do not see explanation fields', async function () {
    await this.questionEditPage.expectNoExplanationFields()
})

Then('I see {int} generated questions in Robin chat', async function (count: number) {
    await this.robinSheetPage.expectGeneratedQuestionCount(count)
})

Then('I see generated question {int} in Robin chat', async function (index: number) {
    await this.robinSheetPage.expectGeneratedQuestionVisible(index)
    await this.robinSheetPage.expectGeneratedQuestionNumber(index)
})

Then('generated question {int} in Robin chat is {string}', async function (index: number, title: string) {
    await this.robinSheetPage.expectGeneratedQuestionTitle(index, title)
})

Then(
    'I see these answers for generated question {int} in Robin chat:',
    async function (index: number, dataTable: DataTable) {
        const answers = parseAnswerTable(dataTable.raw())
        for (const answer of answers) {
            await this.robinSheetPage.expectGeneratedAnswer(index, answer.text, answer.correct)
        }
    },
)

Then('generated question {int} in Robin chat has {int} answers', async function (index: number, count: number) {
    await this.robinSheetPage.expectGeneratedQuestionAnswerCount(index, count)
})

Then(
    'generated question {int} in Robin chat has at least {int} answers',
    async function (index: number, count: number) {
        await this.robinSheetPage.expectGeneratedQuestionAnswerCountAtLeast(index, count)
    },
)

Then(
    'generated question {int} in Robin chat has {int} highlighted correct answers',
    async function (index: number, count: number) {
        await this.robinSheetPage.expectGeneratedQuestionCorrectAnswerCount(index, count)
    },
)

Then(
    'generated question {int} in Robin chat has at least {int} highlighted correct answers',
    async function (index: number, count: number) {
        await this.robinSheetPage.expectGeneratedQuestionCorrectAnswerCountAtLeast(index, count)
    },
)

Then('generated question {int} in Robin chat shows a numerical answer', async function (index: number) {
    await this.robinSheetPage.expectGeneratedQuestionNumericalAnswerVisible(index)
})

Then(
    'generated question {int} in Robin chat has numerical answer {string}',
    async function (index: number, value: string) {
        await this.robinSheetPage.expectGeneratedQuestionNumericalAnswer(index, value)
    },
)

Then(
    'generated question {int} in Robin chat has numerical answer {float}',
    async function (index: number, value: number) {
        await this.robinSheetPage.expectGeneratedQuestionNumericalAnswer(index, String(value))
    },
)

Then('generated question {int} in Robin chat shows tolerance', async function (index: number) {
    await this.robinSheetPage.expectGeneratedQuestionToleranceVisible(index)
})

Then(
    'generated question {int} in Robin chat has tolerance greater than {string}',
    async function (index: number, threshold: string) {
        await this.robinSheetPage.expectGeneratedQuestionToleranceGreaterThan(index, Number.parseFloat(threshold))
    },
)

Then(
    'generated question {int} in Robin chat has tolerance less than {string}',
    async function (index: number, threshold: string) {
        await this.robinSheetPage.expectGeneratedQuestionToleranceLessThan(index, Number.parseFloat(threshold))
    },
)

Then('generated question {int} in Robin chat shows question explanation', async function (index: number) {
    await this.robinSheetPage.expectGeneratedQuestionExplanationVisible(index)
})

Then('I see 2 default empty answers', async function () {
    await this.questionEditPage.expectAnswerRowCount(2)

    await expectEmptyAnswers(this.questionEditPage, 0)
    await expectEmptyAnswers(this.questionEditPage, 1)

    await expectDeleteButtonsState(this.questionEditPage)
})

Then(/I see answer (\d+) as (correct|incorrect)/, async function (index: number, correctness: string) {
    if (correctness === 'correct') {
        await this.questionEditPage.expectAnswerCorrect(index - 1)
    } else {
        await this.questionEditPage.expectAnswerIncorrect(index - 1)
    }
})

Then('I see the answers fields', async function (data: DataTable) {
    const answers = data.raw()

    await this.questionEditPage.expectAnswerRowCount(answers.length)

    let i = 0
    for (const [answer, star, explanation] of answers) {
        await expectAnswer(this.questionEditPage, i++, answer, star === '*', explanation)
    }
})

Then('I see empty question explanation', async function () {
    await this.questionEditPage.expectQuestionExplanation('')
})

Then('I see question explanation {string}', async function (explanation: string) {
    await this.questionEditPage.expectQuestionExplanation(explanation)
})

Then('I see non-empty question explanation', async function () {
    await this.questionEditPage.expectQuestionExplanationNotEmpty()
})

Then('I see at least {int} answers', async function (count: number) {
    await this.questionEditPage.expectAnswerRowCountGreaterThanOrEqual(count)
})

Then('exactly {int} answer is marked correct', async function (count: number) {
    await this.questionEditPage.expectCorrectAnswerCount(count)
})

Then('at least {int} answers are marked correct', async function (count: number) {
    await this.questionEditPage.expectCorrectAnswerCountGreaterThanOrEqual(count)
})

Then('all answers have explanations', async function () {
    await this.questionEditPage.expectAllAnswersHaveExplanations()
})

Then('all explanation fields are empty', async function () {
    await this.questionEditPage.expectAllAnswerExplanationsEmpty()
})

Then('Question field is not empty', async function () {
    await this.questionEditPage.expectQuestionValueNotEmpty()
})

const normalizeQuestionText = (question: string) =>
    question
        .trim()
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()

Then('the generated question in Robin chat should not ask {string}', async function (question: string) {
    await this.robinSheetPage.expectGeneratedQuestionVisible(1)
    const title = await this.robinSheetPage.generatedQuestionTitleText(1)
    expect(normalizeQuestionText(title)).not.toBe(normalizeQuestionText(question))
})

// Field edits

When('I enter question {string}', async function (question: string) {
    await enterQuestion(this, question)
})

When('I open Robin AI', async function () {
    await this.robinSheetPage.open()
})

When('I ask the application to create a exact question {string}', async function (topic: string) {
    await this.robinSheetPage.open()
    await enterAIPrompt(this, `Generate a exact question: ${topic}`)
    await Promise.all([
        this.page.waitForResponse(response => response.url().includes('/ai-assistant/chat') && response.ok(), {
            timeout: AI_RESPONSE_TIMEOUT,
        }),
        this.robinSheetPage.generate(),
    ])
})

When('I use the generated question', async function () {
    await this.robinSheetPage.useGeneratedQuestion()
})

When(/I mark the question as (single choice|multiple choice|numerical)/, async function (choice: string) {
    if (choice === 'single choice') {
        await this.questionEditPage.setSingleChoice()
    } else if (choice === 'multiple choice') {
        await this.questionEditPage.setMultipleChoice()
    } else {
        await this.questionEditPage.setNumericalChoice()
    }
})

When('I enter numerical correct answer {string}', async function (value: string) {
    await this.questionEditPage.enterNumericalCorrectAnswer(value)
})

When('I set tolerance to {string}', async function (value: string) {
    await this.questionEditPage.enterNumericalTolerance(value)
})

When('I enter answer {int} text {string}', async function (index: number, answer: string) {
    await enterAnswerText(this, index - 1, answer)
})

When("I enter the last answer's text {string}", async function (answer: string) {
    await enterLastAnswerText(this, answer)
})

When('I mark answer {int} as correct', async function (index: number) {
    await markAnswerCorrectness(this, index - 1, true)
})

When('I enter answer {int} explanation {string}', async function (index: number, explanation: string) {
    await enterAnswerExplanation(this, index - 1, explanation)
})

When('I enter answer {int} text {string} and mark it as correct', async function (index: number, answer: string) {
    await enterAnswer(this, index - 1, answer, true, undefined)
})

When(
    /I enter answer (\d+) text "([^"]*)", (correct|incorrect), with explanation "([^"]*)"/,
    async function (index: number, answer: string, correctness: string, explanation: string) {
        await enterAnswer(this, index - 1, answer, correctness === 'correct', explanation)
    },
)

Given('I enter answers', async function (data: DataTable) {
    await enterAnswers(this, parseAnswerTable(data.raw()))
})

When('I add another answer', async function () {
    await this.questionEditPage.addAdditionalAnswer()
})

When('I mark the question easy', async function () {
    await this.questionEditPage.setEasy()
})

When('I enter question explanation {string}', async function (explanation: string) {
    await enterQuestionExplanation(this, explanation)
})

When('I enter image URL {string}', async function (imageUrl: string) {
    await enterImageUrl(this, imageUrl)
})

Then('I see image preview', async function () {
    await expect(this.questionEditPage.imagePreviewLocator()).toBeAttached()
})

Then('I do not see image preview', async function () {
    await expect(this.questionEditPage.imagePreviewLocator()).not.toBeAttached()
})

// Save question

When('I attempt to submit the question', attemptSubmitQuestion)
When('I submit the question', submitQuestion)

// Error messages assertions

Then('I see error messages', async function (table: DataTable) {
    const expectedErrors: string[] = table.raw().map(row => row[0])

    await expectErrorMessages(this.questionEditPage, expectedErrors)
})

Then('I see no error messages', async function () {
    await expectErrorCount(this.questionEditPage, 0)
})

Then('I delete answer {int}', async function (answerNumber: number) {
    await this.questionEditPage.deleteAnswer(answerNumber - 1)
})

Then('I can delete {int} answers', async function (buttonCount: number) {
    await expectDeleteButtonsState(this.questionEditPage, buttonCount, false)
})
