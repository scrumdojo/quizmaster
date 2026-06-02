import { useState } from 'react'
import { createPortal } from 'react-dom'

import { postAiAssistant } from '#fe/make/api/ai-assistant.ts'
import type { QuestionRequest } from '#fe/make/api/question.ts'
import type { QuestionDraft, QuestionType } from '#fe/shared/model/question.ts'
import './robin-ai.scss'
import { questionToPatch } from './question-draft-mappers.ts'
import { RobinFab } from './robin-fab.tsx'
import { RobinSheet } from './robin-sheet.tsx'
import type { RobinFormBinding, RobinGenerateRequest } from './use-robin-prompt-form.ts'

interface RobinAiHelperProps {
    readonly form: RobinFormBinding
    readonly workspaceId: string
    readonly currentQuestion?: () => QuestionRequest
    readonly currentQuestionId?: number
}

const typeInstructionFor = (questionType: QuestionType) => {
    const typeInstructionByQuestionType: Record<QuestionType, string> = {
        single: 'This must remain a single choice question with exactly 1 correct answer.',
        multiple: 'This must remain a multiple choice question with at least 2 correct answers.',
        numerical: 'This must remain a numerical question with exactly 1 correct numeric answer.',
    }

    return typeInstructionByQuestionType[questionType]
}

const buildEditAiPrompt = (prompt: string, currentQuestion: QuestionRequest) =>
    [
        'Update this existing quiz question according to the user request.',
        'Apply only the requested change and preserve every field the request does not need to change.',
        'Return the complete updated question using the normal response fields.',
        'Do not include context-only fields such as id, workspaceGuid, imageUrl, tags, isEasy, or questionType in the response.',
        'User request:',
        prompt.trim(),
        'Current question JSON:',
        JSON.stringify(currentQuestion, null, 2),
        typeInstructionFor(currentQuestion.questionType),
    ].join('\n\n')

const editGenerateRequest =
    (currentQuestion: () => QuestionRequest, currentQuestionId?: number) => async (request: RobinGenerateRequest) => {
        const question = currentQuestion()
        return {
            drafts: [
                await postAiAssistant(request.workspaceGuid, {
                    question: buildEditAiPrompt(request.question, question),
                    questionType: question.questionType,
                    excludedQuestionId: currentQuestionId,
                }),
            ],
        }
    }

export const RobinAiHelper = ({ form, workspaceId, currentQuestion, currentQuestionId }: RobinAiHelperProps) => {
    const [sheetOpen, setSheetOpen] = useState(false)
    const [questionType, setQuestionType] = useState<QuestionType>(() => form.snapshot().questionType ?? 'single')
    const handleGenerated = (drafts: readonly QuestionDraft[]) => {
        const [draft] = drafts
        if (!draft) return
        form.applyPatch(questionToPatch(draft))
    }

    return createPortal(
        <>
            <RobinFab onOpen={() => setSheetOpen(true)} />
            {sheetOpen && (
                <RobinSheet
                    onGenerated={handleGenerated}
                    generateRequest={
                        currentQuestion ? editGenerateRequest(currentQuestion, currentQuestionId) : undefined
                    }
                    workspaceId={workspaceId}
                    questionType={questionType}
                    onQuestionTypeChange={setQuestionType}
                    onClose={() => setSheetOpen(false)}
                    mode="classic"
                />
            )}
        </>,
        document.body,
    )
}
