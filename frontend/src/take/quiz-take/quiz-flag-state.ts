import { useState } from 'react'

import { flagQuizQuestion } from '#fe/take/api/stats.ts'

interface QuizFlagState {
    readonly has: (questionIdx: number) => boolean
    readonly toggle: (quizId: number, attemptId: number, questionId: number, questionIdx: number) => Promise<void>
}

export const useQuizFlagState = (): QuizFlagState => {
    const [flaggedIdxs, setFlaggedIdxs] = useState<ReadonlySet<number>>(new Set())

    const has = (questionIdx: number) => flaggedIdxs.has(questionIdx)

    const toggle = async (quizId: number, attemptId: number, questionId: number, questionIdx: number) => {
        const nowFlagged = !flaggedIdxs.has(questionIdx)
        await flagQuizQuestion(quizId, attemptId, questionId, nowFlagged)
        setFlaggedIdxs(prev => {
            const next = new Set(prev)
            if (nowFlagged) {
                next.add(questionIdx)
            } else {
                next.delete(questionIdx)
            }
            return next
        })
    }

    return { has, toggle }
}
