import { useState } from 'react'
import { createPortal } from 'react-dom'

import { saveQuestion } from '#fe/make/api/question.ts'
import { questionDraftToRequest } from '#fe/make/create-question/robin-ai/question-draft-mappers.ts'
import { RobinFab } from '#fe/make/create-question/robin-ai/robin-fab.tsx'
import { RobinSheet } from '#fe/make/create-question/robin-ai/robin-sheet.tsx'
import type { QuestionDraft } from '#fe/shared/model/question.ts'

const saveWorkspaceRobinDraft =
    (workspaceGuid: string, onQuestionsSaved: () => Promise<void>) =>
    async (draft: QuestionDraft): Promise<string> => {
        await saveQuestion(workspaceGuid, questionDraftToRequest(draft))
        await onQuestionsSaved()
        return 'Saved question to workspace.'
    }

const saveAllWorkspaceRobinDrafts =
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

    return createPortal(
        <>
            <RobinFab onOpen={() => setSheetOpen(true)} />
            {sheetOpen && (
                <RobinSheet
                    saveDraft={saveWorkspaceRobinDraft(workspaceId, onQuestionsSaved)}
                    saveDrafts={saveAllWorkspaceRobinDrafts(workspaceId, onQuestionsSaved)}
                    workspaceId={workspaceId}
                    onClose={() => setSheetOpen(false)}
                />
            )}
        </>,
        document.body,
    )
}
