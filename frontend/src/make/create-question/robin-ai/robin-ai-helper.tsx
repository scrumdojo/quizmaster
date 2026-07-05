import { useState } from 'react'
import { createPortal } from 'react-dom'

import type { QuestionRequest } from '#fe/make/api/question.ts'
import type { QuestionDraft, QuestionType } from '#fe/shared/model/question.ts'
import './robin-ai.scss'
import { questionRequestToDraft, questionToPatch } from './question-draft-mappers.ts'
import { RobinFab } from './robin-fab.tsx'
import { RobinSheet } from './robin-sheet.tsx'
import type { RobinFormBinding } from './use-robin-prompt-form.ts'

interface RobinAiHelperProps {
    readonly form: RobinFormBinding
    readonly workspaceId: string
    readonly currentQuestion?: () => QuestionRequest
    readonly currentQuestionId?: number
}

export const RobinAiHelper = ({ form, workspaceId, currentQuestion, currentQuestionId }: RobinAiHelperProps) => {
    const [sheetOpen, setSheetOpen] = useState(false)
    const [questionType, setQuestionType] = useState<QuestionType>(() => form.snapshot().questionType ?? 'single')
    const handleUseDraft = (draft: QuestionDraft) => {
        form.applyPatch(questionToPatch(draft))
        setSheetOpen(false)
    }

    return createPortal(
        <>
            <RobinFab onOpen={() => setSheetOpen(true)} />
            {sheetOpen && (
                <RobinSheet
                    onUseDraft={handleUseDraft}
                    initialDraft={currentQuestion ? questionRequestToDraft(currentQuestion()) : undefined}
                    excludedQuestionId={currentQuestionId}
                    workspaceId={workspaceId}
                    questionType={questionType}
                    onQuestionTypeChange={setQuestionType}
                    onClose={() => setSheetOpen(false)}
                />
            )}
        </>,
        document.body,
    )
}
