import type { Difficulty, QuizMode } from './enums.ts'
import type { Question, QuestionEvaluation, QuestionTake } from './question.ts'

export interface QuizRequest {
    readonly title: string
    readonly description: string
    readonly startAt: string | null
    readonly endAt: string | null
    readonly questionIds: readonly number[]
    readonly questionWeights?: readonly number[]
    readonly mode: QuizMode
    readonly difficulty: Difficulty
    readonly passScore: number
    readonly timeLimit: number
    readonly randomQuestionCount?: number
}

export interface QuizCohort {
    readonly guid: string
    readonly name: string
    readonly canDelete: boolean
}

export interface Quiz {
    readonly id: number
    readonly title: string
    readonly description: string
    readonly startAt: string | null
    readonly endAt: string | null
    readonly questions: readonly Question[]
    readonly questionWeights?: readonly number[]
    readonly mode: QuizMode
    readonly difficulty: Difficulty
    readonly passScore: number
    readonly timeLimit: number
    readonly randomQuestionCount?: number
    readonly cohorts?: readonly QuizCohort[]
}

export interface QuizTake {
    readonly id: number
    readonly title: string
    readonly description: string
    readonly startAt: string | null
    readonly endAt: string | null
    readonly questions: readonly QuestionTake[]
    readonly mode: QuizMode
    readonly difficulty: Difficulty
    readonly passScore: number
    readonly timeLimit: number
    readonly randomQuestionCount?: number
}

export interface QuizMetadata {
    readonly id: number
    readonly title: string
    readonly description: string
    readonly startAt: string | null
    readonly endAt: string | null
    readonly mode: QuizMode
    readonly difficulty: Difficulty
    readonly passScore: number
    readonly timeLimit: number
    readonly randomQuestionCount?: number
    readonly questionCount: number
}

export interface QuizLeaderboardCohort {
    readonly rank: number
    readonly cohort: string
    readonly score: number
}

export interface QuizLeaderboardIndividual {
    readonly rank: number
    readonly nickname: string
    readonly score: number
}

export interface QuizLeaderboardResponse {
    readonly cohorts: readonly QuizLeaderboardCohort[]
    readonly individuals: readonly QuizLeaderboardIndividual[]
}

export interface QuizLiveStatsCohort {
    readonly order: number
    readonly cohort: string
    readonly points: number
}

export interface QuizLiveStatsResponse {
    readonly cohorts: readonly QuizLiveStatsCohort[]
}

export type QuizSubmittedAnswer =
    | { readonly questionId: number; readonly type: 'choice'; readonly selectedIdxs: readonly number[] }
    | { readonly questionId: number; readonly type: 'numerical'; readonly value: number }

export interface QuizEvaluationResponse {
    readonly score: number
    readonly totalQuestions: number
    readonly weightedScore: number
    readonly totalWeight: number
    readonly questions?: readonly QuestionEvaluation[]
}

export interface QuizAttemptStartResponse {
    readonly attemptId: number
    readonly questions: readonly QuestionTake[]
}

export interface QuizAttemptStartRequest {
    readonly cohortGuid?: string
    readonly nickname?: string
}

export interface QuizBuzzerStatus {
    readonly status: 'waiting' | 'countdown' | 'started'
    readonly secondsRemaining: number | null
}
