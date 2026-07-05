import { useState } from 'react'

import { postAiAssistantChat } from '#fe/make/api/ai-assistant.ts'
import type { QuestionDraft, QuestionType } from '#fe/shared/model/question.ts'

import type { QuestionFormStatePatch } from '../form/question-form-state.ts'

export interface RobinFormBinding {
    readonly snapshot: () => QuestionFormStatePatch
    readonly applyPatch: (patch: QuestionFormStatePatch) => void
}

export interface RobinChatMessage {
    readonly role: 'user' | 'assistant'
    readonly text: string
}

export interface RobinGenerationResult {
    readonly drafts: readonly QuestionDraft[]
}

export interface RobinGenerateRequest {
    readonly workspaceGuid: string
    readonly question: string
    readonly questionType: QuestionType
    readonly currentDrafts: readonly QuestionDraft[]
}

interface UseRobinPromptFormArgs {
    readonly generateRequest?: (request: RobinGenerateRequest) => Promise<RobinGenerationResult>
    readonly saveDrafts?: (drafts: readonly QuestionDraft[]) => Promise<string>
    readonly workspaceId: string
    readonly questionType: QuestionType
}

const generateChatDrafts = async ({
    workspaceGuid,
    question,
}: RobinGenerateRequest): Promise<RobinGenerationResult> => {
    const response = await postAiAssistantChat(workspaceGuid, {
        messages: [{ role: 'user', content: question }],
    })
    return { drafts: response.drafts }
}

export const useRobinPromptForm = ({
    generateRequest = generateChatDrafts,
    saveDrafts,
    workspaceId,
    questionType,
}: UseRobinPromptFormArgs) => {
    const [promptText, setPromptText] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [generatedDrafts, setGeneratedDrafts] = useState<readonly QuestionDraft[]>([])
    const [chatMessages, setChatMessages] = useState<readonly RobinChatMessage[]>([])

    const generate = async () => {
        const submittedPrompt = promptText.trim()
        if (!submittedPrompt) return
        setError('')
        setLoading(true)
        setPromptText('')
        try {
            const response = await generateRequest({
                workspaceGuid: workspaceId,
                question: submittedPrompt,
                questionType,
                currentDrafts: generatedDrafts,
            })
            setGeneratedDrafts(response.drafts)
            setChatMessages(messages => [...messages, { role: 'user', text: submittedPrompt }])
        } catch (e) {
            const message = e instanceof Error ? e.message : 'AI assistant request failed.'
            setError(message || 'AI assistant request failed.')
        } finally {
            setLoading(false)
        }
    }

    const save = async () => {
        if (saving || !saveDrafts || generatedDrafts.length === 0) return
        setError('')
        setSaving(true)
        try {
            const assistantMessage = await saveDrafts(generatedDrafts)
            setGeneratedDrafts([])
            setChatMessages(messages => [...messages, { role: 'assistant', text: assistantMessage }])
        } catch (e) {
            const message = e instanceof Error ? e.message : 'AI assistant request failed.'
            setError(message || 'AI assistant request failed.')
        } finally {
            setSaving(false)
        }
    }

    return { promptText, setPromptText, loading, saving, error, generate, save, generatedDrafts, chatMessages }
}
