import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import type { QuestionDraft } from '#shared/types/question.ts'
import { toText } from '#steps/common.ts'
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
    selectAIQuestionType,
    submitQuestion,
    attemptSubmitQuestion,
    enterTag,
    createQuestion,
    type AIQuestionTypeChoice,
} from '#steps/make/question/ops.ts'
import { ensureWorkspace } from '#steps/make/workspace/ops.ts'
import {
    expectAnswer,
    expectDeleteButtonsState,
    expectEmptyAnswers,
    expectErrorCount,
    expectErrorMessages,
} from '#steps/question/expects.ts'
import { parseAnswerTable, parseQuestionRow } from '#steps/shared/parsers.ts'

const stubbedAiResponse = {
    question: 'What is the capital of Czech Republic?',
    answers: ['Brno', 'Prague', 'Berlin', 'Ostrava', 'Bratislava'],
    correctAnswers: [1],
    explanations: ['No Brno', 'Yes', 'Germany', 'No', 'No'],
    questionExplanation: '',
    questionType: 'single',
    isEasy: false,
}

const AI_RESPONSE_TIMEOUT = 120_000

const aiPrompt = (world: { lastAiAssistantRequest?: { question: string } }) => {
    const prompt = world.lastAiAssistantRequest?.question
    expect(prompt, 'Expected AI assistant request to be captured').toBeDefined()
    return prompt ?? ''
}

const questionSpecToDraft = (row: Record<string, string | undefined>): QuestionDraft => {
    const spec = parseQuestionRow(row)

    if (spec.numericalAnswer !== undefined) {
        return {
            question: spec.text,
            answers: [spec.numericalAnswer],
            correctAnswers: [0],
            explanations: [''],
            questionExplanation: spec.explanation ?? '',
            questionType: 'numerical',
            isEasy: false,
            tolerance: spec.tolerance ? Number.parseFloat(spec.tolerance) : undefined,
            tags: [],
        }
    }

    const correctAnswers = spec.answers.flatMap((answer, index) => (answer.correct ? [index] : []))
    return {
        question: spec.text,
        answers: spec.answers.map(answer => answer.text),
        correctAnswers,
        explanations: spec.answers.map(answer => answer.explanation ?? ''),
        questionExplanation: spec.explanation ?? '',
        questionType: correctAnswers.length > 1 ? 'multiple' : 'single',
        isEasy: false,
        tags: [],
    }
}

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

Given('Robin AI will return these generated questions:', async function (dataTable: DataTable) {
    const drafts = dataTable.hashes().map(questionSpecToDraft)
    if (drafts.length === 0) throw new Error('Robin AI stub requires at least one generated question.')

    await this.page.route('**/ai-assistant', async route => {
        this.lastAiAssistantRequest = route.request().postDataJSON() as {
            question: string
            questionType: string
            excludedQuestionId?: number
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(drafts[0]),
        })
    })

    await this.page.route('**/ai-assistant/batch', async route => {
        this.lastAiAssistantRequest = route.request().postDataJSON() as {
            question: string
            questionType: string
            excludedQuestionId?: number
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(drafts),
        })
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

Then('Robin AI message composer is docked to the bottom of the chat', async function () {
    await this.robinSheetPage.expectComposerDockedToBottom()
})

Then('I do not see Robin AI send button', async function () {
    await this.robinSheetPage.expectGenerateButtonNotVisible()
})

Then('Robin AI message composer is empty', async function () {
    await this.robinSheetPage.expectPromptValue('')
})

Then('I see Robin AI chat message {string}', async function (message: string) {
    await this.robinSheetPage.expectChatMessageVisible(message)
})

Then('I do not see generated questions in Robin chat', async function () {
    await this.robinSheetPage.expectNoGeneratedQuestions()
})

Then('AI received current question context', async function () {
    const prompt = aiPrompt(this)
    expect(prompt).toContain('add two more incorrect answers')
    expect(prompt).toContain('What is the capital of Czech Republic?')
    expect(prompt).toContain('Brno')
    expect(prompt).toContain('Prague')
    expect(prompt).toContain('Berlin')
    expect(prompt).toContain('No Brno')
    expect(prompt).toContain('Yes')
    expect(prompt).toContain('Germany')
    expect(prompt).toContain('1')
    expect(this.lastAiAssistantRequest?.excludedQuestionId).toBe(this.questionIds[this.activeQuestionBookmark])
})

Then('AI received current question context with question {string}', async function (question: string) {
    expect(aiPrompt(this)).toContain(question)
})

Then('AI received current question context with answer {string}', async function (answer: string) {
    expect(aiPrompt(this)).toContain(answer)
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
        this.page.waitForResponse(response => response.url().includes('/ai-assistant') && response.ok(), {
            timeout: AI_RESPONSE_TIMEOUT,
        }),
        this.robinSheetPage.generate(),
    ])
})

When('I ask AI:', async function (dataTable: DataTable) {
    await enterAIPrompt(this, toText(dataTable))
    // Wait on the actual API response, not the textarea content. The latter
    // is unreliable on regenerate (the previous response makes "not empty"
    // resolve immediately, before the new response arrives).
    await Promise.all([
        this.page.waitForResponse(response => response.url().includes('/ai-assistant') && response.ok(), {
            timeout: AI_RESPONSE_TIMEOUT,
        }),
        this.robinSheetPage.generate(),
    ])
})

When('I ask AI to generate multiple questions:', async function (dataTable: DataTable) {
    await enterAIPrompt(this, toText(dataTable))
    await Promise.all([
        this.page.waitForResponse(response => response.url().includes('/ai-assistant/batch') && response.ok(), {
            timeout: AI_RESPONSE_TIMEOUT,
        }),
        this.robinSheetPage.generate(),
    ])
})

When('I save the generated questions', async function () {
    await this.robinSheetPage.saveGeneratedQuestions()
})

When('I use the generated question', async function () {
    await this.robinSheetPage.useGeneratedQuestion()
})

When('I enter Robin AI message {string}', async function (message: string) {
    await this.robinSheetPage.enterPrompt(message)
})

When('I press Enter to send the Robin AI message', async function () {
    await this.robinSheetPage.sendPromptByEnter()
})

When('I ask stubbed AI to {string}', async function (instruction: string) {
    await this.page.route('**/ai-assistant', async route => {
        this.lastAiAssistantRequest = route.request().postDataJSON() as {
            question: string
            questionType: string
            excludedQuestionId?: number
        }
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(stubbedAiResponse),
        })
    })
    await enterAIPrompt(this, instruction)
    await Promise.all([
        this.page.waitForResponse(response => response.url().includes('/ai-assistant') && response.ok(), {
            timeout: AI_RESPONSE_TIMEOUT,
        }),
        this.robinSheetPage.generate(),
    ])
    await this.page.unroute('**/ai-assistant')
})

When(
    /I ask AI for (single choice|multiple choice|numerical) question:/,
    async function (choice: string, dataTable: DataTable) {
        await selectAIQuestionType(this, choice as AIQuestionTypeChoice)
        await enterAIPrompt(this, toText(dataTable))
        await Promise.all([
            this.page.waitForResponse(response => response.url().includes('/ai-assistant') && response.ok(), {
                timeout: AI_RESPONSE_TIMEOUT,
            }),
            this.robinSheetPage.generate(),
        ])
    },
)

When(
    /I ask AI for (single choice|multiple choice|numerical) questions:/,
    async function (choice: string, dataTable: DataTable) {
        await selectAIQuestionType(this, choice as AIQuestionTypeChoice)
        await enterAIPrompt(this, toText(dataTable))
        await Promise.all([
            this.page.waitForResponse(response => response.url().includes('/ai-assistant/batch') && response.ok(), {
                timeout: AI_RESPONSE_TIMEOUT,
            }),
            this.robinSheetPage.generate(),
        ])
    },
)

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
