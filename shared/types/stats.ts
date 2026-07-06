export interface AttemptStatsRecord {
    readonly id: number
    readonly durationSeconds: number | null
    readonly correctAnswers: number
    readonly incorrectAnswers: number
    readonly partiallyCorrectAnswers: number
    readonly totalQuestions: number
    readonly score: number
    readonly status: string
}
export interface QuestionStatsRecord {
    readonly question: string
    readonly answered: number
    readonly correctAnswers: number
    readonly partiallyCorrectAnswers: number
    readonly incorrectAnswers: number
    readonly unanswered: number
    readonly flagged: number
}
export interface TagStatsRecord {
    readonly tag: string
    readonly questions: number
    readonly answered: number
    readonly correctAnswers: number
    readonly partiallyCorrectAnswers: number
    readonly incorrectAnswers: number
    readonly unanswered: number
}
export interface SummaryStats {
    readonly started: number
    readonly finished: number
    readonly unfinished: number
    readonly timeout: number
}
export interface QuizStatsResponse {
    readonly summary: SummaryStats
    readonly attempts: readonly AttemptStatsRecord[]
    readonly questions?: readonly QuestionStatsRecord[]
    readonly questionStats?: readonly QuestionStatsRecord[]
    readonly questionStatistics?: readonly QuestionStatsRecord[]
    readonly tagStatistics?: readonly TagStatsRecord[]
}
