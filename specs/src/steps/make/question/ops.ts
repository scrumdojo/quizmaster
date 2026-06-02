import type { QuestionEditPage } from '#pages/index.ts'
import { NUM_DEFAULT_ANSWERS } from '#shared/defaults/question.ts'
import { ensureWorkspaceGuid } from '#steps/make/workspace/ops.ts'
import { createQuestionViaRest } from '#steps/shared/api.ts'
import { hasExplanations, isMultipleChoiceSpec, type AnswerSpec, type QuestionSpec } from '#steps/shared/specs.ts'
import type { QuizmasterWorld } from '#steps/world'

// ── Form helpers ────────────────────────────────────────

export const enterQuestion = async (world: QuizmasterWorld, question: string) => {
    await world.questionEditPage.enterQuestion(question)
    world.updateQuestionWip({ text: question })
}

export const enterTag = async (world: QuizmasterWorld, tag: string) => {
    await world.questionEditPage.enterTag(tag)
    world.updateQuestionWip({ tag })
}

export const enterAIPrompt = async (world: QuizmasterWorld, prompt: string) => {
    await world.robinSheetPage.enterPrompt(prompt)
}

export type AIQuestionTypeChoice = 'single choice' | 'multiple choice' | 'numerical'

export const selectAIQuestionType = async (world: QuizmasterWorld, choice: AIQuestionTypeChoice) => {
    if (choice === 'single choice') await world.robinSheetPage.askForSingleChoice()
    else if (choice === 'multiple choice') await world.robinSheetPage.askForMultipleChoice()
    else await world.robinSheetPage.askForNumericalChoice()
}

export const enterAnswerText = async (world: QuizmasterWorld, index: number, answer: string) => {
    await world.questionEditPage.enterAnswerText(index, answer)
    world.updateAnswerWip(index, { text: answer })
}

export const enterLastAnswerText = async (world: QuizmasterWorld, answer: string) => {
    const index = (await world.questionEditPage.answerRowCount()) - 1
    await world.questionEditPage.enterAnswerText(index, answer)
    world.updateAnswerWip(index, { text: answer })
}

export const markAnswerCorrectness = async (world: QuizmasterWorld, index: number, isCorrect: boolean) => {
    await world.questionEditPage.setAnswerCorrectness(index, isCorrect)
    world.updateAnswerWip(index, { correct: isCorrect })
}

export const enterAnswerExplanation = async (world: QuizmasterWorld, index: number, explanation: string) => {
    await world.questionEditPage.enterAnswerExplanation(index, explanation)
    world.updateAnswerWip(index, { explanation })
}

export const enterAnswer = async (
    world: QuizmasterWorld,
    index: number,
    answer: string,
    isCorrect: boolean,
    explanation: string | undefined,
) => {
    await world.questionEditPage.enterAnswer(index, answer, isCorrect, explanation)
    world.updateAnswerWip(index, { text: answer, correct: isCorrect, explanation })
}

const fillAnswers = async (page: QuestionEditPage, answers: AnswerSpec[]) => {
    if (answers.length === 0) return

    if (isMultipleChoiceSpec(answers)) await page.setMultipleChoice()
    if (hasExplanations(answers)) await page.enableExplanations()

    for (let i = 0; i < answers.length; i++) {
        if (i >= NUM_DEFAULT_ANSWERS) await page.addAdditionalAnswer()
        const a = answers[i]
        await page.enterAnswer(i, a.text, a.correct, a.explanation)
    }
}

export const enterAnswers = async (world: QuizmasterWorld, answers: AnswerSpec[]) => {
    await fillAnswers(world.questionEditPage, answers)
    for (let i = 0; i < answers.length; i++) {
        world.updateAnswerWip(i, answers[i])
    }
}

export const enterQuestionExplanation = async (world: QuizmasterWorld, explanation: string) => {
    await world.questionEditPage.enterQuestionExplanation(explanation)
    world.updateQuestionWip({ explanation })
}

export const enterImageUrl = async (world: QuizmasterWorld, imageUrl: string) => {
    await world.questionEditPage.enterImageUrl(imageUrl)
    world.updateQuestionWip({ image: imageUrl })
}

export async function submitQuestion(this: QuizmasterWorld) {
    await this.questionEditPage.submit()
}

// ── createQuestion pipeline ─────────────────────────────

export const createQuestion = async (world: QuizmasterWorld, spec: QuestionSpec) => {
    await ensureWorkspaceGuid(world)
    const id = await createQuestionViaRest(world, world.workspaceGuid, spec)
    const key = spec.bookmark ?? spec.text
    world.bookmarkQuestion(key, spec)
    world.questionIds[key] = id
}
