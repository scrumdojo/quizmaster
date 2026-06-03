import type { AnswerSpec, QuestionAnswersSpec, QuestionSpec } from '#steps/shared/specs.ts'

const CHOICE_PATTERN = /^(.+?)(\s*\(\*\))?$/
const NUMERICAL_PATTERN = /^(-?\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)$/

const parseChoiceAnswers = (answersStr: string): AnswerSpec[] =>
    answersStr
        .split(',')
        .map(raw => raw.trim())
        .map(answerStr => {
            const [, text, correctMarker] = answerStr.match(CHOICE_PATTERN) ?? []
            const correct = !!correctMarker
            return {
                text,
                correct,
            }
        })

const parseAnswers = (answersStr: string): QuestionAnswersSpec => {
    const [, numericalAnswer, tolerance] = answersStr.match(NUMERICAL_PATTERN) ?? []
    return numericalAnswer ? { answers: [], numericalAnswer, tolerance } : { answers: parseChoiceAnswers(answersStr) }
}

export const parseAnswerTable = (rows: string[][]): AnswerSpec[] =>
    rows.map(([text, correct, explanation]) => ({
        text,
        correct: correct === '*',
        explanation: explanation || undefined,
    }))

export const parseQuestionRow = (row: Record<string, string | undefined>): QuestionSpec => {
    const text = row.question ?? ''

    return {
        text,
        ...parseAnswers(row.answers ?? ''),
        easy: row.easy === 'true',
        explanation: row.explanation,
        image: row.image,
        tag: row.tag,
        bookmark: row.bookmark || text,
    }
}
