import { postJson } from '#fe/shared/api/helpers.ts'
import type { QuestionDraft, QuestionType } from '#fe/shared/model/question.ts'

interface AiAssistantRequest {
    readonly question: string
    readonly questionType: QuestionType
    readonly excludedQuestionId?: number
}

export interface AiChatMessage {
    readonly role: 'user' | 'assistant'
    readonly content?: string
    readonly drafts?: readonly QuestionDraft[]
}

export interface AiChatRequest {
    readonly messages: readonly AiChatMessage[]
    readonly excludedQuestionId?: number
}

export interface AiChatResponse {
    readonly drafts: readonly QuestionDraft[]
    readonly notice?: string
}

export const postAiAssistant = async (workspaceGuid: string, request: AiAssistantRequest) =>
    await postJson<AiAssistantRequest, QuestionDraft>(`/api/workspaces/${workspaceGuid}/ai-assistant`, request)

export const postAiAssistantBatch = async (workspaceGuid: string, request: AiAssistantRequest) =>
    await postJson<AiAssistantRequest, readonly QuestionDraft[]>(
        `/api/workspaces/${workspaceGuid}/ai-assistant/batch`,
        request,
    )

export const postAiAssistantChat = async (workspaceGuid: string, request: AiChatRequest) =>
    await postJson<AiChatRequest, AiChatResponse>(`/api/workspaces/${workspaceGuid}/ai-assistant/chat`, request)
