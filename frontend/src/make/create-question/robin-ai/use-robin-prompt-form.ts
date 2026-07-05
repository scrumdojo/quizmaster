import { useState } from 'react'

import { postAiAssistantChat } from '#fe/make/api/ai-assistant.ts'
import type { AiChatMessage } from '#fe/make/api/ai-assistant.ts'
import type { QuestionDraft } from '#fe/shared/model/question.ts'

import type { QuestionFormStatePatch } from '../form/question-form-state.ts'

export interface RobinFormBinding {
    readonly snapshot: () => QuestionFormStatePatch
    readonly applyPatch: (patch: QuestionFormStatePatch) => void
}

export interface RobinChatMessage {
    readonly role: 'user' | 'assistant'
    readonly text: string
    // A notice is an assistant bubble carrying a refusal (e.g. duplicate rejection),
    // rendered distinctly so specs can assert it without depending on its wording.
    readonly notice?: boolean
}

interface UseRobinPromptFormArgs {
    readonly saveDraft?: (draft: QuestionDraft) => Promise<string>
    readonly saveDrafts?: (drafts: readonly QuestionDraft[]) => Promise<string>
    readonly workspaceId: string
    readonly excludedQuestionId?: number
    readonly initialDraft?: QuestionDraft
}

// Editing seeds the conversation as if Robin had already drafted the existing question,
// so refining it needs no special wire format — it is just the next chat turn.
const seedTranscript = (initialDraft: QuestionDraft | undefined): readonly AiChatMessage[] =>
    initialDraft
        ? [
              { role: 'user', content: 'Here is the existing question to refine.' },
              { role: 'assistant', drafts: [initialDraft] },
          ]
        : []

export const useRobinPromptForm = ({
    saveDraft,
    saveDrafts,
    workspaceId,
    excludedQuestionId,
    initialDraft,
}: UseRobinPromptFormArgs) => {
    const [promptText, setPromptText] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [draftVersions, setDraftVersions] = useState<readonly (readonly QuestionDraft[])[]>(() =>
        initialDraft ? [[initialDraft]] : [],
    )
    const [transcript, setTranscript] = useState<readonly AiChatMessage[]>(() => seedTranscript(initialDraft))
    const [chatMessages, setChatMessages] = useState<readonly RobinChatMessage[]>([])

    const generatedDrafts = draftVersions.flat()

    const generate = async () => {
        const submittedPrompt = promptText.trim()
        if (!submittedPrompt) return
        setError('')
        setLoading(true)
        setPromptText('')
        try {
            const messages = [...transcript, { role: 'user' as const, content: submittedPrompt }]
            const response = await postAiAssistantChat(workspaceId, { messages, excludedQuestionId })
            setTranscript([...messages, { role: 'assistant', drafts: response.drafts }])
            if (response.drafts.length > 0) {
                setDraftVersions(versions => [...versions, response.drafts])
            }
            setChatMessages(previous => [
                ...previous,
                { role: 'user', text: submittedPrompt },
                ...(response.notice ? [{ role: 'assistant' as const, text: response.notice, notice: true }] : []),
            ])
        } catch (e) {
            const message = e instanceof Error ? e.message : 'AI assistant request failed.'
            setError(message || 'AI assistant request failed.')
        } finally {
            setLoading(false)
        }
    }

    const saveOne = async (draft: QuestionDraft) => {
        if (saving || !saveDraft) return
        setError('')
        setSaving(true)
        try {
            const assistantMessage = await saveDraft(draft)
            setChatMessages(previous => [...previous, { role: 'assistant', text: assistantMessage }])
        } catch (e) {
            const message = e instanceof Error ? e.message : 'AI assistant request failed.'
            setError(message || 'AI assistant request failed.')
        } finally {
            setSaving(false)
        }
    }

    const save = async () => {
        if (saving || !saveDrafts || generatedDrafts.length === 0) return
        setError('')
        setSaving(true)
        try {
            const assistantMessage = await saveDrafts(generatedDrafts)
            setDraftVersions([])
            setTranscript([])
            setChatMessages(previous => [...previous, { role: 'assistant', text: assistantMessage }])
        } catch (e) {
            const message = e instanceof Error ? e.message : 'AI assistant request failed.'
            setError(message || 'AI assistant request failed.')
        } finally {
            setSaving(false)
        }
    }

    return {
        promptText,
        setPromptText,
        loading,
        saving,
        error,
        generate,
        save,
        saveOne,
        generatedDrafts,
        draftVersions,
        chatMessages,
    }
}
