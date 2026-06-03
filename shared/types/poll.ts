export interface PollAnswer {
    readonly id: number
    readonly text: string
}

export interface PollTake {
    readonly id: number
    readonly question: string
    readonly answers: readonly PollAnswer[]
}

export interface PollVoteRequest {
    readonly selectedAnswerId: number
}
