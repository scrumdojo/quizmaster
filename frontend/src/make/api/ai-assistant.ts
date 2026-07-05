import { postJson } from '#fe/shared/api/helpers.ts'
import type { QuestionDraft } from '#fe/shared/model/question.ts'

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

export const postAiAssistantChat = async (workspaceGuid: string, request: AiChatRequest) =>
    await postJson<AiChatRequest, AiChatResponse>(`/api/workspaces/${workspaceGuid}/ai-assistant/chat`, request)
