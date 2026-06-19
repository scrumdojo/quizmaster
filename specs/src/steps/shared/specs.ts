export interface AnswerSpec {
    text: string
    correct: boolean
    explanation?: string
}

export type AnswerSpecs = readonly AnswerSpec[]

export interface QuestionSpec {
    text: string
    answers: AnswerSpec[]
    numericalAnswer?: string
    tolerance?: string
    explanation?: string
    image?: string
    tag?: string
    easy?: boolean
    bookmark?: string
}

export type QuestionAnswersSpec = Pick<QuestionSpec, 'answers' | 'numericalAnswer' | 'tolerance'>

export const isNumericalSpec = (spec: QuestionSpec): boolean => spec.numericalAnswer !== undefined

export const isMultipleChoiceSpec = (answers: AnswerSpecs): boolean => answers.filter(a => a.correct).length > 1

export const hasExplanations = (answers: AnswerSpecs): boolean => answers.some(a => a.explanation !== undefined)

export type QuizMode = 'learn' | 'exam'
export type Difficulty = 'easy' | 'hard' | 'keep-question'

export interface QuizSpec {
    name: string
    questions: string[]
    weights?: number[]
    description?: string
    mode?: string
    passScore?: string
    timeLimit?: string
    difficulty?: string
    size?: string
    startAt?: string
    endAt?: string
    bookmark?: string
}

export interface PollSpec {
    question: string
    answers: string[]
    bookmark?: string
}
