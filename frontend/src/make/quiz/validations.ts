export type ErrorCode =
    | 'empty-title'
    | 'time-limit-above-max'
    | 'time-limit-invalid-format'
    | 'score-above-max'
    | 'few-questions'
    | 'too-many-randomized-questions'

export interface QuizFormState {
    readonly title: string
    readonly description: string
    readonly timeLimit: number
    readonly passScore: number
    readonly selectedIds: ReadonlySet<number>
    readonly randomQuestionCount: number
}

export function validateQuizForm(state: QuizFormState): Set<ErrorCode> {
    const errors = new Set<ErrorCode>()

    if (!state.title) errors.add('empty-title')
    if (state.timeLimit > 21600) errors.add('time-limit-above-max')
    if (Number.isNaN(state.timeLimit)) errors.add('time-limit-invalid-format')
    if (state.passScore > 100) errors.add('score-above-max')
    if (state.selectedIds.size < 2) errors.add('few-questions')
    if (state.randomQuestionCount > 0 && state.randomQuestionCount > state.selectedIds.size)
        errors.add('too-many-randomized-questions')

    return errors
}
