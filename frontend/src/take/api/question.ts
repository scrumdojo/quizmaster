import { fetchJson, postJson } from '#fe/shared/api/helpers.ts'
import type { QuestionAnswer, QuestionEvaluation, QuestionTake } from '#fe/take/model/question.ts'

export const fetchQuestion = async (questionId: string) => await fetchJson<QuestionTake>(`/api/question/${questionId}`)

export const submitQuestionAnswer = async (questionId: string, answer: QuestionAnswer) =>
    await postJson<QuestionAnswer, QuestionEvaluation>(`/api/question/${questionId}/submit`, answer)

export interface ExplanationChatMessage {
    readonly role: 'user' | 'assistant'
    readonly content: string
}

export interface ExplanationChatRequest {
    readonly messages: readonly ExplanationChatMessage[]
}

export interface ExplanationChatResponse {
    readonly reply: string
}

export const postExplanationChat = async (questionId: number, request: ExplanationChatRequest) =>
    await postJson<ExplanationChatRequest, ExplanationChatResponse>(
        `/api/question/${questionId}/explanation-chat`,
        request,
    )
