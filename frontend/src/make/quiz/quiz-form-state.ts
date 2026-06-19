import { useMemo, useState } from 'react'

import type { QuizRequest } from '#fe/make/api/quiz.ts'
import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import { useStateSet } from '#fe/shared/helpers.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import type { QuizMode, Difficulty } from '#fe/shared/model/quiz.ts'
import {
    DEFAULT_DIFFICULTY,
    DEFAULT_MODE,
    DEFAULT_PASS_SCORE,
    DEFAULT_RANDOM_COUNT,
    DEFAULT_TIME_LIMIT,
} from '#shared/defaults/quiz.ts'

export type QuizEditFormData = QuizRequest

const formatDateTimeInputValue = (value?: string | null) => value?.slice(0, 16) ?? ''
const toApiDateTimeValue = (value: string) => value || null

const buildInitialWeights = (quiz?: Quiz): Map<number, number> => {
    const map = new Map<number, number>()
    if (quiz?.questions && quiz.questionWeights) {
        quiz.questions.forEach((q, i) => {
            map.set(q.id, quiz.questionWeights![i] ?? 1)
        })
    }
    return map
}

export const useQuizFormState = (questions: readonly QuestionListItem[], quiz?: Quiz) => {
    const [title, setTitle] = useState(quiz?.title || '')
    const [description, setDescription] = useState(quiz?.description || '')
    const [startAt, setStartAt] = useState(formatDateTimeInputValue(quiz?.startAt))
    const [endAt, setEndAt] = useState(formatDateTimeInputValue(quiz?.endAt))
    const [selectedIds, toggleSelectedId] = useStateSet(quiz?.questions?.map(q => q.id))
    const [timeLimit, setTimeLimit] = useState(quiz?.timeLimit ?? DEFAULT_TIME_LIMIT)
    const [randomQuestionCount, setRandomQuestionCount] = useState(quiz?.randomQuestionCount ?? DEFAULT_RANDOM_COUNT)
    const [passScore, setPassScore] = useState(quiz?.passScore ?? DEFAULT_PASS_SCORE)
    const [filter, setFilter] = useState('')
    const [checkRandomize, setCheckRandomize] = useState(!!quiz?.randomQuestionCount)
    const [feedbackMode, setFeedbackMode] = useState<QuizMode>(quiz?.mode || DEFAULT_MODE)
    const [difficulty, setDifficulty] = useState<Difficulty>(quiz?.difficulty || DEFAULT_DIFFICULTY)
    const [weights, setWeights] = useState<Map<number, number>>(buildInitialWeights(quiz))

    const setWeight = (questionId: number, weight: number) => {
        setWeights(prev => new Map(prev).set(questionId, weight))
    }

    const filteredQuestions = useMemo(() => {
        const normalizedFilter = filter.trim().toLowerCase()
        if (normalizedFilter === '') return questions

        const tokens = normalizedFilter.split(/\s+/).filter(Boolean)

        return questions.filter(q => {
            const searchableText = [q.question, ...q.tags].join(' ').toLowerCase()
            return tokens.every(token => searchableText.includes(token))
        })
    }, [filter, questions])

    return {
        title,
        description,
        startAt,
        endAt,
        selectedIds,
        timeLimit,
        randomQuestionCount,
        passScore,
        filter,
        checkRandomize,
        filteredQuestions,
        feedbackMode,
        difficulty,
        weights,
        setTitle,
        setDescription,
        setStartAt,
        setEndAt,
        toggleSelectedId,
        setTimeLimit,
        setRandomQuestionCount,
        setPassScore,
        setFilter,
        setCheckRandomize,
        setFeedbackMode,
        setDifficulty,
        setWeight,
    }
}

export const stateToQuizApiData = (state: ReturnType<typeof useQuizFormState>): QuizEditFormData => {
    const questionIds = Array.from(state.selectedIds)
    const questionWeights = questionIds.map(id => state.weights.get(id) ?? 1)
    return {
        title: state.title,
        description: state.description,
        startAt: toApiDateTimeValue(state.startAt),
        endAt: toApiDateTimeValue(state.endAt),
        questionIds,
        questionWeights,
        mode: state.feedbackMode,
        difficulty: state.difficulty,
        passScore: state.passScore,
        timeLimit: state.timeLimit,
        randomQuestionCount: state.randomQuestionCount,
    }
}
