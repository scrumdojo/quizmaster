export interface PollAnswer {
    readonly id: number
    readonly text: string
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
