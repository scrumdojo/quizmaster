import { useState } from 'react'

import type { ExplanationChatMessage } from '#fe/take/api/question.ts'
import { postExplanationChat } from '#fe/take/api/question.ts'

export interface ExplanationChatEntry {
    readonly role: 'user' | 'assistant'
    readonly text: string
}

export const useExplanationChat = (questionId: number) => {
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
            const response = await postExplanationChat(questionId, { messages: nextTranscript })
            setTranscript([...nextTranscript, { role: 'assistant', content: response.reply }])
            setMessages(previous => [
                ...previous,
                { role: 'user', text: submittedPrompt },
                { role: 'assistant', text: response.reply },
            ])
        } catch (e) {
            const message = e instanceof Error ? e.message : 'AI assistant request failed.'
            setError(message || 'AI assistant request failed.')
        } finally {
            setLoading(false)
        }
    }

    return { promptText, setPromptText, loading, error, messages, ask }
}
