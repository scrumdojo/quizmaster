export interface PollRequest {
    readonly question: string
    readonly answers: readonly string[]
    readonly answerImages?: readonly (string | null)[]
}

export interface PollUpdateAnswer {
    readonly id: number | null
    readonly text: string
    readonly imageUrl: string | null
}

export interface PollUpdateRequest {
    readonly question: string
    readonly answers: readonly PollUpdateAnswer[]
}

export interface PollAnswer {
    readonly id: number
    readonly text: string
    readonly imageUrl: string | null
}

export interface PollListItem {
    readonly id: number
    readonly question: string
}

export interface PollTake {
    readonly id: number
    readonly question: string
    readonly answers: readonly PollAnswer[]
}

export interface PollResultItem {
    readonly answerId: number
    readonly text: string
    readonly voteCount: number
}

export interface PollResultsResponse {
    readonly pollId: number
    readonly answers: readonly PollResultItem[]
}

export interface PollVoteRequest {
    readonly selectedAnswerId: number
}
