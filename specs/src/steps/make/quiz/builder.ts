import type { DataTable } from '@cucumber/cucumber'

import { Given } from '#steps/fixture.ts'
import { createQuestion } from '#steps/make/question/ops.ts'
import { addCohortViaShareScreen, createQuiz } from '#steps/make/quiz/ops.ts'
import type { QuizSpec } from '#steps/shared/specs.ts'
import { parseKey } from '#steps/world'

const KNOWN_PROPS = new Set([
    'description',
    'mode',
    'pass score',
    'time limit',
    'difficulty',
    'size',
    'start date',
    'end date',
])

const RELATIVE_DATE_PATTERN = /^today(?:\s*([+-])\s*(\d+))?$/i

const pad = (value: number) => String(value).padStart(2, '0')

const formatDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const resolveDateTimeInput = (value: string, boundary: 'start' | 'end') => {
    const normalized = value.trim()
    const match = normalized.match(RELATIVE_DATE_PATTERN)

    if (!match) return normalized

    const [, operator, offsetRaw] = match
    const offset = offsetRaw ? Number.parseInt(offsetRaw, 10) : 0
    const delta = operator === '-' ? -offset : offset
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + delta)

    return `${formatDate(date)}T${boundary === 'start' ? '00:00' : '23:59'}`
}

const applyProperties = (spec: QuizSpec, properties?: DataTable) => {
    if (!properties) return
    for (const [key, value] of properties.raw()) {
        if (!KNOWN_PROPS.has(key)) throw new Error(`Unknown quiz property: "${key}"`)
        if (key === 'description') spec.description = value
        if (key === 'mode') spec.mode = value
        if (key === 'pass score') spec.passScore = value
        if (key === 'time limit') spec.timeLimit = value
        if (key === 'difficulty') spec.difficulty = value
        if (key === 'size') spec.size = value
        if (key === 'start date') spec.startAt = resolveDateTimeInput(value, 'start')
        if (key === 'end date') spec.endAt = resolveDateTimeInput(value, 'end')
    }
}

Given('quiz {string} with {int} questions', async function (quizName: string, n: number, properties?: DataTable) {
    const dummyQuestion = (i: number) => ({
        text: `Question ${i}?`,
        answers: [
            { text: 'A', correct: true },
            { text: 'B', correct: false },
        ],
        bookmark: `Q${i}`,
    })

    for (let i = 1; i <= n; i++) {
        await createQuestion(this, dummyQuestion(i))
    }
    const spec: QuizSpec = { name: quizName, questions: Object.keys(this.questionBookmarks) }
    applyProperties(spec, properties)
    await createQuiz(this, spec)
})

Given('quiz {string} with all questions', async function (quizName: string, properties?: DataTable) {
    const spec: QuizSpec = { name: quizName, questions: Object.keys(this.questionBookmarks) }
    applyProperties(spec, properties)
    await createQuiz(this, spec)
})

Given(
    'quiz {string} with questions {string}',
    async function (quizName: string, bookmarkList: string, properties?: DataTable) {
        const spec: QuizSpec = { name: quizName, questions: parseKey(bookmarkList) }
        applyProperties(spec, properties)
        await createQuiz(this, spec)
    },
)

Given(
    'quiz {string} with weighted questions',
    async function (quizName: string, data: DataTable) {
        const rows = data.hashes() as Array<{ question: string; weight: string }>
        const questions = rows.map(r => r.question)
        const weights = rows.map(r => Number.parseInt(r.weight, 10))
        const spec: QuizSpec = { name: quizName, questions, weights, passScore: '50' }
        await createQuiz(this, spec)
    },
)

Given('quiz {string} has a cohort named {string}', async function (quizName: string, cohortName: string) {
    await addCohortViaShareScreen(this, quizName, cohortName)
})
