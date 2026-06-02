import type { QuizListItem } from './quiz-list-item.ts'

export interface QuizPage {
    readonly content: readonly QuizListItem[]
    readonly totalPages: number
    readonly size: number
    readonly number: number
}
