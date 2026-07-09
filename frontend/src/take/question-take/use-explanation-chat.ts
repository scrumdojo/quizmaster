import { useState } from 'react'

import { ApiError } from '#fe/shared/api/helpers.ts'
import type { ExplanationChatMessage } from '#fe/take/api/question.ts'
import { postExplanationChat } from '#fe/take/api/question.ts'
import type { QuestionAnswer } from '#fe/take/model/question.ts'

export interface ExplanationChatEntry {
    readonly role: 'user' | 'assistant'
    readonly text: string
}

// Backend validation failures carry a stable code (see CodedResponseStatusException);
// translate those into a clearer message, and fall back to the raw message otherwise —
// e.g. network errors or backend failures that don't have a code (OpenRouter call failed).
const errorMessageFor = (e: unknown): string => {
    if (e instanceof ApiError && e.code) {
        const knownMessages: Record<string, string> = {
            'ai-token-not-configured': 'The AI assistant is not configured. Please try again later.',
            'empty-chat-messages': 'Your question could not be sent. Please try again.',
            'invalid-last-message': 'Your question could not be sent. Please try again.',
        }
        const known = knownMessages[e.code]
        if (known) return known
    }
    return e instanceof Error && e.message ? e.message : 'AI assistant request failed.'
}

export const useExplanationChat = (questionId: number, givenAnswer: QuestionAnswer) => {
    const [promptText, setPromptText] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [transcript, setTranscript] = useState<readonly ExplanationChatMessage[]>([])
    const [messages, setMessages] = useState<readonly ExplanationChatEntry[]>([])

    const ask = async () => {
        const submittedPrompt = promptText.trim()
        if (!submittedPrompt || loading) return
        setError('')
        setLoading(true)
        setPromptText('')
        try {
            const nextTranscript = [...transcript, { role: 'user' as const, content: submittedPrompt }]
            const response = await postExplanationChat(questionId, { givenAnswer, messages: nextTranscript })
            setTranscript([...nextTranscript, { role: 'assistant', content: response.reply }])
            setMessages(previous => [
                ...previous,
                { role: 'user', text: submittedPrompt },
                { role: 'assistant', text: response.reply },
            ])
        } catch (e) {
            setError(errorMessageFor(e))
        } finally {
            setLoading(false)
        }
    }

    return { promptText, setPromptText, loading, error, messages, ask }
}
