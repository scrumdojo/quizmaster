import { useRef, useState } from 'react'

import { flagQuizQuestion } from '#fe/take/api/stats.ts'

interface QuizFlagState {
    readonly has: (questionIdx: number) => boolean
    readonly toggle: (quizId: number, attemptId: number, questionId: number, questionIdx: number) => Promise<void>
    readonly waitForPendingSaves: () => Promise<void>
}

export const useQuizFlagState = (): QuizFlagState => {
    const [flaggedIdxs, setFlaggedIdxs] = useState<ReadonlySet<number>>(new Set())
    const pendingSaves = useRef(new Set<Promise<void>>())

    const has = (questionIdx: number) => flaggedIdxs.has(questionIdx)

    const toggle = async (quizId: number, attemptId: number, questionId: number, questionIdx: number) => {
        const nowFlagged = !flaggedIdxs.has(questionIdx)
        const save = flagQuizQuestion(quizId, attemptId, questionId, nowFlagged)
        pendingSaves.current.add(save)
        try {
            await save
            setFlaggedIdxs(prev => {
                const next = new Set(prev)
                if (nowFlagged) {
                    next.add(questionIdx)
                } else {
                    next.delete(questionIdx)
                }
                return next
            })
        } finally {
            pendingSaves.current.delete(save)
        }
    }

    const waitForPendingSaves = async () => {
        while (pendingSaves.current.size > 0) {
            await Promise.allSettled(pendingSaves.current)
        }
    }

    return { has, toggle, waitForPendingSaves }
}
