import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod/v4'

import { QuizmasterClient, QuizmasterClientError } from './quizmaster-client.ts'
import {
    createQuestionInputSchema,
    createQuizInputSchema,
    createWorkspaceInputSchema,
    emptyInputSchema,
    questionIdInputSchema,
    toolErrorResult,
    toolResult,
    toQuestionRequest,
    toQuizRequest,
    updateQuestionInputSchema,
    updateQuizInputSchema,
    workspaceGuidInputSchema,
    workspaceQuizIdInputSchema,
    zodErrorDetails,
} from './schemas.ts'

export const QUIZMASTER_TOOL_NAMES = [
    'quizmaster_health',
    'quizmaster_create_workspace',
    'quizmaster_get_workspace',
    'quizmaster_list_questions',
    'quizmaster_get_question',
    'quizmaster_create_question',
    'quizmaster_update_question',
    'quizmaster_delete_question',
    'quizmaster_list_quizzes',
    'quizmaster_get_quiz',
    'quizmaster_create_quiz',
    'quizmaster_update_quiz',
    'quizmaster_delete_quiz',
    'quizmaster_get_quiz_stats',
] as const

type ToolInputSchema = z.ZodObject<Record<string, z.ZodType>>
type ToolHandler<TSchema extends ToolInputSchema> = (input: z.output<TSchema>) => Promise<object>

const readOnlyAnnotations = {
    readOnlyHint: true,
    destructiveHint: false,
} as const

const writeAnnotations = {
    readOnlyHint: false,
    destructiveHint: false,
} as const

const destructiveAnnotations = {
    readOnlyHint: false,
    destructiveHint: true,
} as const

const errorDetails = (error: QuizmasterClientError): Record<string, unknown> => ({
    ...error.details,
})

const withToolErrors = async (callback: () => Promise<object>): Promise<CallToolResult> => {
    try {
        return toolResult(await callback())
    } catch (error) {
        if (error instanceof z.ZodError) {
            return toolErrorResult(
                'input-validation',
                'Tool input did not satisfy Quizmaster validation rules.',
                zodErrorDetails(error),
            )
        }
        if (error instanceof QuizmasterClientError) {
            return toolErrorResult(error.code, error.message, errorDetails(error))
        }
        const message = error instanceof Error ? error.message : 'Unexpected Quizmaster MCP tool failure.'
        return toolErrorResult('unexpected-error', message)
    }
}

const registerTool = <TSchema extends ToolInputSchema>(
    server: McpServer,
    name: (typeof QUIZMASTER_TOOL_NAMES)[number],
    schema: TSchema,
    config: {
        readonly title: string
        readonly description: string
        readonly annotations: typeof readOnlyAnnotations | typeof writeAnnotations | typeof destructiveAnnotations
    },
    handler: ToolHandler<TSchema>,
) => {
    server.registerTool(
        name,
        {
            title: config.title,
            description: config.description,
            inputSchema: schema.shape,
            annotations: config.annotations,
        },
        async args => await withToolErrors(async () => await handler(schema.parse(args))),
    )
}

export const registerQuizmasterTools = (server: McpServer, client: QuizmasterClient) => {
    registerTool(
        server,
        'quizmaster_health',
        emptyInputSchema,
        {
            title: 'Check Quizmaster Health',
            description: 'Checks whether the configured Quizmaster backend is reachable.',
            annotations: readOnlyAnnotations,
        },
        async () => await client.health(),
    )

    registerTool(
        server,
        'quizmaster_create_workspace',
        createWorkspaceInputSchema,
        {
            title: 'Create Workspace',
            description: 'Creates a new Quizmaster workspace.',
            annotations: writeAnnotations,
        },
        async input => await client.createWorkspace(input),
    )

    registerTool(
        server,
        'quizmaster_get_workspace',
        workspaceGuidInputSchema,
        {
            title: 'Get Workspace',
            description: 'Reads one Quizmaster workspace.',
            annotations: readOnlyAnnotations,
        },
        async input => await client.getWorkspace(input.workspaceGuid),
    )

    registerTool(
        server,
        'quizmaster_list_questions',
        workspaceGuidInputSchema,
        {
            title: 'List Questions',
            description: 'Lists questions in a Quizmaster workspace.',
            annotations: readOnlyAnnotations,
        },
        async input => ({ questions: await client.listQuestions(input.workspaceGuid) }),
    )

    registerTool(
        server,
        'quizmaster_get_question',
        questionIdInputSchema,
        {
            title: 'Get Question',
            description: 'Reads a full workspace-scoped question.',
            annotations: readOnlyAnnotations,
        },
        async input => await client.getQuestion(input.workspaceGuid, input.questionId),
    )

    registerTool(
        server,
        'quizmaster_create_question',
        createQuestionInputSchema,
        {
            title: 'Create Question',
            description: 'Creates a question in a Quizmaster workspace.',
            annotations: writeAnnotations,
        },
        async input => await client.createQuestion(input.workspaceGuid, toQuestionRequest(input)),
    )

    registerTool(
        server,
        'quizmaster_update_question',
        updateQuestionInputSchema,
        {
            title: 'Update Question',
            description: 'Updates an existing question in a Quizmaster workspace.',
            annotations: writeAnnotations,
        },
        async input => await client.updateQuestion(input.workspaceGuid, input.questionId, toQuestionRequest(input)),
    )

    registerTool(
        server,
        'quizmaster_delete_question',
        questionIdInputSchema,
        {
            title: 'Delete Question',
            description: 'Deletes a question from a Quizmaster workspace.',
            annotations: destructiveAnnotations,
        },
        async input => {
            await client.deleteQuestion(input.workspaceGuid, input.questionId)
            return { deleted: true, questionId: input.questionId }
        },
    )

    registerTool(
        server,
        'quizmaster_list_quizzes',
        workspaceGuidInputSchema,
        {
            title: 'List Quizzes',
            description: 'Lists quizzes in a Quizmaster workspace.',
            annotations: readOnlyAnnotations,
        },
        async input => ({ quizzes: await client.listQuizzes(input.workspaceGuid) }),
    )

    registerTool(
        server,
        'quizmaster_get_quiz',
        workspaceQuizIdInputSchema,
        {
            title: 'Get Quiz',
            description: 'Reads a full workspace-scoped quiz.',
            annotations: readOnlyAnnotations,
        },
        async input => await client.getQuiz(input.workspaceGuid, input.quizId),
    )

    registerTool(
        server,
        'quizmaster_create_quiz',
        createQuizInputSchema,
        {
            title: 'Create Quiz',
            description: 'Creates a quiz in a Quizmaster workspace.',
            annotations: writeAnnotations,
        },
        async input => await client.createQuiz(input.workspaceGuid, toQuizRequest(input)),
    )

    registerTool(
        server,
        'quizmaster_update_quiz',
        updateQuizInputSchema,
        {
            title: 'Update Quiz',
            description: 'Updates a quiz in a Quizmaster workspace.',
            annotations: writeAnnotations,
        },
        async input => await client.updateQuiz(input.workspaceGuid, input.quizId, toQuizRequest(input)),
    )

    registerTool(
        server,
        'quizmaster_delete_quiz',
        workspaceQuizIdInputSchema,
        {
            title: 'Delete Quiz',
            description: 'Deletes a quiz from a Quizmaster workspace.',
            annotations: destructiveAnnotations,
        },
        async input => {
            await client.deleteQuiz(input.workspaceGuid, input.quizId)
            return { deleted: true, quizId: input.quizId }
        },
    )

    registerTool(
        server,
        'quizmaster_get_quiz_stats',
        workspaceQuizIdInputSchema,
        {
            title: 'Get Quiz Stats',
            description: 'Reads statistics for a workspace quiz.',
            annotations: readOnlyAnnotations,
        },
        async input => await client.getQuizStats(input.workspaceGuid, input.quizId),
    )
}
