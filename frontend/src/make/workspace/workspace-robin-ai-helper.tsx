import { useState } from 'react'
import { createPortal } from 'react-dom'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { Translations } from '#fe/i18n/types.ts'
import { saveQuestion } from '#fe/make/api/question.ts'
import { questionDraftToRequest } from '#fe/make/create-question/robin-ai/question-draft-mappers.ts'
import { RobinFab } from '#fe/make/create-question/robin-ai/robin-fab.tsx'
import { RobinSheet } from '#fe/make/create-question/robin-ai/robin-sheet.tsx'
import type { QuestionDraft } from '#fe/shared/model/question.ts'

const saveWorkspaceRobinDraft =
    (workspaceGuid: string, onQuestionsSaved: () => Promise<void>, t: Translations) =>
    async (draft: QuestionDraft): Promise<string> => {
        await saveQuestion(workspaceGuid, questionDraftToRequest(draft))
        await onQuestionsSaved()
        return t.robin.savedOneQuestion
    }

const saveAllWorkspaceRobinDrafts =
    (workspaceGuid: string, onQuestionsSaved: () => Promise<void>, t: Translations) =>
    async (drafts: readonly QuestionDraft[]): Promise<string> => {
        await Promise.all(drafts.map(draft => saveQuestion(workspaceGuid, questionDraftToRequest(draft))))
        await onQuestionsSaved()
        return t.robin.savedManyQuestions(drafts.length)
    }

interface WorkspaceRobinAiHelperProps {
    readonly workspaceId: string
    readonly onQuestionsSaved: () => Promise<void>
}

export const WorkspaceRobinAiHelper = ({ workspaceId, onQuestionsSaved }: WorkspaceRobinAiHelperProps) => {
    const { t } = useLanguage()
    const [sheetOpen, setSheetOpen] = useState(false)

    return createPortal(
        <>
            <RobinFab onOpen={() => setSheetOpen(true)} />
            {sheetOpen && (
                <RobinSheet
                    saveDraft={saveWorkspaceRobinDraft(workspaceId, onQuestionsSaved, t)}
                    saveDrafts={saveAllWorkspaceRobinDrafts(workspaceId, onQuestionsSaved, t)}
                    workspaceId={workspaceId}
                    onClose={() => setSheetOpen(false)}
                />
            )}
        </>,
        document.body,
    )
}
