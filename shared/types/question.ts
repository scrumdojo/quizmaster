import type { AnswerIdxs, QuestionType } from './enums.ts'

export interface QuestionRequest {
    readonly question: string
    readonly answers: readonly string[]
    readonly correctAnswers: readonly number[]
    readonly explanations: readonly string[]
    readonly questionExplanation: string
    readonly questionType: QuestionType
    readonly isEasy: boolean
    readonly imageUrl?: string
    readonly tolerance?: number
    readonly tags: readonly string[]
}

export interface Question {
    readonly id: number
    readonly question: string
    readonly imageUrl?: string
    readonly tolerance?: number
    readonly answers: string[]
    readonly explanations: string[]
    readonly questionExplanation: string
    readonly correctAnswers: AnswerIdxs
    readonly questionType: QuestionType
    workspaceGuid: string | null
    isEasy: boolean
    readonly tags: string[]
}

export interface QuestionTake {
    readonly id: number
    readonly question: string
    readonly imageUrl?: string
    readonly answers: string[]
    readonly questionType: QuestionType
    readonly isEasy: boolean
    readonly tags: readonly string[]
    readonly correctAnswerCount: number
    readonly requiredDecimalDigits: number
}

export type AnswerStatus = 'UNANSWERED' | 'CORRECT' | 'PARTIAL' | 'INCORRECT'

export interface QuestionEvaluation {
    readonly status: AnswerStatus
    readonly score: number
    readonly question?: Question
    readonly missedBefore: boolean
}

// Robin chat drafts carry isEasy/tags only when the model actually produced them.
export type QuestionDraft = Omit<Question, 'id' | 'workspaceGuid' | 'isEasy' | 'tags'> & {
    readonly isEasy?: boolean
    readonly tags?: readonly string[]
}
