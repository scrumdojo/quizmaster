import type { CallToolResult, ReadResourceResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod/v4'

import type { QuestionRequest } from '../../shared/types/question.ts'
import type { QuizRequest } from '../../shared/types/quiz.ts'

export const emptyInputSchema = z.object({})

const questionTypeSchema = z.enum(['single', 'multiple', 'numerical'])
const quizModeSchema = z.enum(['learn', 'exam'])
const difficultySchema = z.enum(['easy', 'hard', 'keep-question'])

const nonEmptyString = (field: string) => z.string().trim().min(1, `${field} must not be empty.`)
const idSchema = (field: string) =>
    z.number().int(`${field} must be an integer.`).positive(`${field} must be positive.`)
const nullableDateTimeSchema = z
    .string()
    .trim()
    .refine(value => value === '' || !Number.isNaN(Date.parse(value)), 'Must be an ISO date-time string.')
    .transform(value => (value === '' ? null : value))
    .nullable()

const workspaceGuidShape = {
    workspaceGuid: nonEmptyString('workspaceGuid'),
}

export const workspaceGuidInputSchema = z.object(workspaceGuidShape)

export const createWorkspaceInputSchema = z.object({
    title: nonEmptyString('title'),
})

export const questionIdInputSchema = z.object({
    ...workspaceGuidShape,
    questionId: idSchema('questionId'),
})

const questionPayloadShape = {
    question: nonEmptyString('question'),
    answers: z.array(z.string()),
    correctAnswers: z.array(z.number().int().nonnegative()),
    explanations: z.array(z.string()),
    questionExplanation: z.string().default(''),
    questionType: questionTypeSchema,
    isEasy: z.boolean().default(false),
    imageUrl: z.string().nullable().optional(),
    tolerance: z.number().default(0),
    tags: z.array(z.string()).default([]),
}

export const questionPayloadSchema = z.object(questionPayloadShape)

export const createQuestionInputSchema = z.object({
    ...workspaceGuidShape,
    ...questionPayloadShape,
})

export const updateQuestionInputSchema = z.object({
    ...workspaceGuidShape,
    questionId: idSchema('questionId'),
    ...questionPayloadShape,
})

export const quizIdInputSchema = z.object({
    quizId: idSchema('quizId'),
})

export const workspaceQuizIdInputSchema = z.object({
    ...workspaceGuidShape,
    quizId: idSchema('quizId'),
})

const quizPayloadShape = {
    title: nonEmptyString('title'),
    description: z.string().default(''),
    startAt: nullableDateTimeSchema.default(null),
    endAt: nullableDateTimeSchema.default(null),
    questionIds: z.array(z.number().int().positive()),
    mode: quizModeSchema,
    difficulty: difficultySchema,
    passScore: z.number().int().min(0).max(100),
    timeLimit: z.number().int().positive(),
    randomQuestionCount: z.number().int().nonnegative().default(0),
}

type QuizInputForValidation = z.output<z.ZodObject<typeof quizPayloadShape>>

const addQuizIssues = (value: QuizInputForValidation, ctx: z.RefinementCtx) => {
    if (value.startAt && value.endAt && Date.parse(value.endAt) < Date.parse(value.startAt)) {
        ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'endAt must not be before startAt.' })
    }
    if (value.randomQuestionCount > 0 && value.randomQuestionCount > value.questionIds.length) {
        ctx.addIssue({
            code: 'custom',
            path: ['randomQuestionCount'],
            message: 'randomQuestionCount cannot exceed the number of selected questions.',
        })
    }
}

export const createQuizInputSchema = z
    .object({
        ...workspaceGuidShape,
        ...quizPayloadShape,
    })
    .superRefine(addQuizIssues)

export const updateQuizInputSchema = z
    .object({
        ...workspaceGuidShape,
        quizId: idSchema('quizId'),
        ...quizPayloadShape,
    })
    .superRefine(addQuizIssues)

export const generateQuestionDraftInputSchema = z.object({
    ...workspaceGuidShape,
    question: nonEmptyString('question'),
    questionType: questionTypeSchema,
})

export type CreateQuestionInput = z.output<typeof createQuestionInputSchema>
export type UpdateQuestionInput = z.output<typeof updateQuestionInputSchema>
export type CreateQuizInput = z.output<typeof createQuizInputSchema>
export type UpdateQuizInput = z.output<typeof updateQuizInputSchema>

export const toQuestionRequest = (input: CreateQuestionInput | UpdateQuestionInput): QuestionRequest => ({
    question: input.question,
    answers: input.answers,
    correctAnswers: input.correctAnswers,
    explanations: input.explanations,
    questionExplanation: input.questionExplanation,
    questionType: input.questionType,
    isEasy: input.questionType === 'multiple' ? input.isEasy : false,
    imageUrl: input.imageUrl ?? undefined,
    tolerance: input.tolerance,
    tags: input.tags,
})

export const toQuizRequest = (input: CreateQuizInput | UpdateQuizInput): QuizRequest => ({
    title: input.title,
    description: input.description,
    startAt: input.startAt,
    endAt: input.endAt,
    questionIds: input.questionIds,
    mode: input.mode,
    difficulty: input.difficulty,
    passScore: input.passScore,
    timeLimit: input.timeLimit,
    randomQuestionCount: input.randomQuestionCount,
})

export type QuizmasterResource =
    | { readonly kind: 'domain-language' }
    | { readonly kind: 'workspace'; readonly workspaceGuid: string }
    | { readonly kind: 'workspace-questions'; readonly workspaceGuid: string }
    | { readonly kind: 'workspace-quizzes'; readonly workspaceGuid: string }
    | { readonly kind: 'workspace-question'; readonly workspaceGuid: string; readonly questionId: number }
    | { readonly kind: 'workspace-quiz'; readonly workspaceGuid: string; readonly quizId: number }
    | { readonly kind: 'workspace-quiz-stats'; readonly workspaceGuid: string; readonly quizId: number }

const parsePath = (url: URL): readonly string[] =>
    url.pathname
        .split('/')
        .filter(Boolean)
        .map(segment => decodeURIComponent(segment))

const parseResourceId = (value: string, field: string): number => {
    if (!/^[1-9]\d*$/.test(value)) throw new Error(`${field} must be a positive integer.`)
    const parsed = Number(value)
    if (!Number.isSafeInteger(parsed)) throw new Error(`${field} is too large.`)
    return parsed
}

export const parseQuizmasterUri = (uri: string): QuizmasterResource => {
    const url = new URL(uri)
    if (url.protocol !== 'quizmaster:') throw new Error('Quizmaster resources must use the quizmaster:// scheme.')

    const host = decodeURIComponent(url.hostname)
    const path = parsePath(url)

    if (host === 'domain-language' && path.length === 0) return { kind: 'domain-language' }

    if (host === 'workspace') {
        const [workspaceGuid, collection, id, child] = path
        if (!workspaceGuid) throw new Error('Workspace resource URI must include a workspaceGuid.')
        if (path.length === 1) return { kind: 'workspace', workspaceGuid }
        if (path.length === 2 && collection === 'questions') return { kind: 'workspace-questions', workspaceGuid }
        if (path.length === 2 && collection === 'quizzes') return { kind: 'workspace-quizzes', workspaceGuid }
        if (path.length === 3 && collection === 'question' && id) {
            return { kind: 'workspace-question', workspaceGuid, questionId: parseResourceId(id, 'questionId') }
        }
        if (path.length === 3 && collection === 'quiz' && id) {
            return { kind: 'workspace-quiz', workspaceGuid, quizId: parseResourceId(id, 'quizId') }
        }
        if (path.length === 4 && collection === 'quiz' && id && child === 'stats') {
            return { kind: 'workspace-quiz-stats', workspaceGuid, quizId: parseResourceId(id, 'quizId') }
        }
    }

    throw new Error(`Unsupported Quizmaster resource URI: ${uri}`)
}

export const structuredOutputSchema = z.record(z.string(), z.unknown())

const asStructuredContent = (value: object): Record<string, unknown> => value as Record<string, unknown>

export const toolResult = (structuredContent: object): CallToolResult => ({
    structuredContent: asStructuredContent(structuredContent),
    content: [
        {
            type: 'text',
            text: JSON.stringify(structuredContent, null, 2),
        },
    ],
})

export const toolErrorResult = (code: string, message: string, details?: Record<string, unknown>): CallToolResult => {
    const structuredContent = {
        error: {
            code,
            message,
            ...(details ? { details } : {}),
        },
    }

    return {
        isError: true,
        structuredContent,
        content: [
            {
                type: 'text',
                text: message,
            },
        ],
    }
}

export const zodErrorDetails = (error: z.ZodError): Record<string, unknown> => ({
    issues: error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
    })),
})

export const jsonResource = (uri: URL, value: unknown): ReadResourceResult => ({
    contents: [
        {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(value, null, 2),
        },
    ],
})

export const markdownResource = (uri: URL, text: string): ReadResourceResult => ({
    contents: [
        {
            uri: uri.href,
            mimeType: 'text/markdown',
            text,
        },
    ],
})
