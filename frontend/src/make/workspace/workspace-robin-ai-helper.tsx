import { useState } from 'react'
import { createPortal } from 'react-dom'

import { postAiAssistant, postAiAssistantBatch } from '#fe/make/api/ai-assistant.ts'
import { saveQuestion } from '#fe/make/api/question.ts'
import { questionDraftToRequest } from '#fe/make/create-question/robin-ai/question-draft-mappers.ts'
import { RobinFab } from '#fe/make/create-question/robin-ai/robin-fab.tsx'
import { RobinSheet } from '#fe/make/create-question/robin-ai/robin-sheet.tsx'
import type {
    RobinGenerateRequest,
    RobinGenerationResult,
} from '#fe/make/create-question/robin-ai/use-robin-prompt-form.ts'
import type { RobinUndoBuffer } from '#fe/make/create-question/robin-ai/use-robin-undo-buffer.ts'
import type { QuestionDraft, QuestionType } from '#fe/shared/model/question.ts'

const noUndo: RobinUndoBuffer = {
    hasPrevious: false,
    capture: () => {},
    restore: () => {},
}

const normalizePrompt = (prompt: string) =>
    prompt
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^\p{Letter}\p{Number}\s]/gu, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase()

const wantsMultipleQuestions = (prompt: string): boolean => {
    const words = normalizePrompt(prompt).split(' ').filter(Boolean)
    for (let index = 0; index < words.length - 1; index += 1) {
        const count = Number.parseInt(words[index] ?? '', 10)
        if (!Number.isFinite(count) || count <= 1) continue

        const targetWord = words[index + 1] ?? ''
        if (targetWord.startsWith('question') || targetWord.startsWith('otaz')) {
            return true
        }
    }
    return false
}

const generateWorkspaceRobinDrafts = async (request: RobinGenerateRequest): Promise<RobinGenerationResult> => {
    const aiRequest = {
        question: request.question,
        questionType: request.questionType,
    }
    if (wantsMultipleQuestions(request.question)) {
        return { drafts: await postAiAssistantBatch(request.workspaceGuid, aiRequest) }
    }
    return { drafts: [await postAiAssistant(request.workspaceGuid, aiRequest)] }
}

const saveWorkspaceRobinDrafts =
    (workspaceGuid: string, onQuestionsSaved: () => Promise<void>) =>
    async (drafts: readonly QuestionDraft[]): Promise<string> => {
        await Promise.all(drafts.map(draft => saveQuestion(workspaceGuid, questionDraftToRequest(draft))))
        await onQuestionsSaved()
        return `Saved ${drafts.length} question${drafts.length === 1 ? '' : 's'} to workspace.`
    }

interface WorkspaceRobinAiHelperProps {
    readonly workspaceId: string
    readonly onQuestionsSaved: () => Promise<void>
}

export const WorkspaceRobinAiHelper = ({ workspaceId, onQuestionsSaved }: WorkspaceRobinAiHelperProps) => {
    const [sheetOpen, setSheetOpen] = useState(false)
    const [questionType, setQuestionType] = useState<QuestionType>('single')

    const handleGenerated = async (_drafts: readonly QuestionDraft[]) => {}

    return createPortal(
        <>
            <RobinFab onOpen={() => setSheetOpen(true)} />
            {sheetOpen && (
                <RobinSheet
                    onGenerated={handleGenerated}
                    generateRequest={generateWorkspaceRobinDrafts}
                    saveDrafts={saveWorkspaceRobinDrafts(workspaceId, onQuestionsSaved)}
                    undo={noUndo}
                    workspaceId={workspaceId}
                    questionType={questionType}
                    onQuestionTypeChange={setQuestionType}
                    onClose={() => setSheetOpen(false)}
                    closeOnGenerated={false}
                    mode="chat"
                />
            )}
        </>,
        document.body,
    )
}
