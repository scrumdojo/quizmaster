import type { QuestionListItem } from './question-list-item.ts'

export interface QuestionPage {
    readonly content: readonly QuestionListItem[]
    readonly availableTags: readonly string[]
    readonly totalPages: number
    readonly totalElements: number
    readonly size: number
    readonly number: number
}
