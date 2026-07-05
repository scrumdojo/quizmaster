import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GetPromptResult } from '@modelcontextprotocol/sdk/types.js'
import { z } from 'zod/v4'

export const QUIZMASTER_PROMPT_NAMES = [
    'quizmaster_create_question',
    'quizmaster_review_workspace',
    'quizmaster_create_quiz_from_tags',
] as const

const questionTypeSchema = z.enum(['single', 'multiple', 'numerical']).optional()
const quizModeSchema = z.enum(['learn', 'exam']).optional()
const difficultySchema = z.enum(['easy', 'hard', 'keep-question']).optional()

const promptText = (text: string): GetPromptResult => ({
    messages: [
        {
            role: 'user',
            content: {
                type: 'text',
                text,
            },
        },
    ],
})

export const registerQuizmasterPrompts = (server: McpServer) => {
    server.registerPrompt(
        'quizmaster_create_question',
        {
            title: 'Create Quizmaster Question',
            description: 'Guide an assistant through creating a high-quality Quizmaster question.',
            argsSchema: {
                workspaceGuid: z.string(),
                topic: z.string(),
                questionType: questionTypeSchema,
                tags: z.string().optional(),
            },
        },
        args =>
            promptText(`Create a high-quality Quizmaster question for workspace "${args.workspaceGuid}".

Topic: ${args.topic}
Question type: ${args.questionType ?? 'ask the user to choose single, multiple, or numerical'}
Tags: ${args.tags ?? 'none provided'}

Before saving:
- Ask for any missing topic or question type details.
- Draft the question yourself; Quizmaster exposes no AI drafting tool.
- Validate the draft against Quizmaster question rules.
- Ask the user to approve the final wording.
- Call quizmaster_create_question only after approval.`),
    )

    server.registerPrompt(
        'quizmaster_review_workspace',
        {
            title: 'Review Quizmaster Workspace',
            description: 'Review a workspace for quiz-authoring quality.',
            argsSchema: {
                workspaceGuid: z.string(),
            },
        },
        args =>
            promptText(`Review Quizmaster workspace "${args.workspaceGuid}" for quiz-authoring quality.

Use these tools and resources:
- Read the workspace with quizmaster_get_workspace.
- Read its questions with quizmaster_list_questions and full question details where needed.
- Read its quizzes with quizmaster_list_quizzes and quizmaster_get_quiz where needed.

Report:
- missing or weak explanations
- weak distractors
- untagged questions
- quizzes with no questions

Suggest improvements first. Do not call write or delete tools unless the user explicitly confirms each change.`),
    )

    server.registerPrompt(
        'quizmaster_create_quiz_from_tags',
        {
            title: 'Create Quizmaster Quiz From Tags',
            description: 'Create a quiz from existing questions filtered by tags.',
            argsSchema: {
                workspaceGuid: z.string(),
                title: z.string(),
                tags: z.string(),
                mode: quizModeSchema,
                difficulty: difficultySchema,
            },
        },
        args =>
            promptText(`Create a Quizmaster quiz in workspace "${args.workspaceGuid}" from questions matching these tags: ${args.tags}.

Requested title: ${args.title}
Mode: ${args.mode ?? 'exam unless the user prefers learn'}
Difficulty: ${args.difficulty ?? 'keep-question unless the user prefers easy or hard'}

Workflow:
- Call quizmaster_list_questions for the workspace.
- Select matching question IDs from the tag list.
- Ask the user to confirm title, mode, difficulty, pass score, time limit, selected questions, and randomQuestionCount.
- Call quizmaster_create_quiz with the workspaceGuid argument only after confirmation.`),
    )
}
