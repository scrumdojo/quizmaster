import type { KeyboardEvent } from 'react'

import { Alert, Button, Field, QuestionTypeRadioSet, TextArea } from '#fe/shared'
import type { QuestionType } from '#fe/shared/model/question.ts'
import type { QuestionDraft } from '#fe/shared/model/question.ts'

import { useRobinPromptForm } from './use-robin-prompt-form.ts'
import type { RobinGenerateRequest, RobinGenerationResult } from './use-robin-prompt-form.ts'

interface RobinSheetProps {
    readonly generateRequest?: (request: RobinGenerateRequest) => Promise<RobinGenerationResult>
    readonly saveDrafts?: (drafts: readonly QuestionDraft[]) => Promise<string>
    readonly onUseDraft?: (draft: QuestionDraft) => void
    readonly workspaceId: string
    readonly questionType: QuestionType
    readonly onQuestionTypeChange: (type: QuestionType) => void
    readonly onClose: () => void
}

export const RobinSheet = ({
    generateRequest,
    saveDrafts,
    onUseDraft,
    workspaceId,
    questionType,
    onQuestionTypeChange,
    onClose,
}: RobinSheetProps) => {
    const { promptText, setPromptText, loading, saving, error, generate, save, generatedDrafts, chatMessages } =
        useRobinPromptForm({
            generateRequest,
            saveDrafts,
            workspaceId,
            questionType,
        })

    const submitPrompt = () => {
        if (loading || promptText.trim().length === 0) return
        void generate()
    }

    const onPromptKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
        event.preventDefault()
        submitPrompt()
    }

    return (
        <div className="robin-sheet robin-sheet--chat" data-testid="robin-sheet">
            <div className="header">
                <span className="title">Ask Robin AI</span>
                <button type="button" className="close-button" onClick={onClose}>
                    ✕
                </button>
            </div>
            <div className="robin-sheet__content">
                {error && (
                    <Alert type="error" dataTestId="ai-assistant-error">
                        {error}
                    </Alert>
                )}
                {chatMessages.length > 0 && (
                    <div className="robin-chat-messages">
                        {chatMessages.map((message, index) => (
                            <div
                                key={`${message.role}-${index}-${message.text}`}
                                className={`robin-chat-message robin-chat-message--${message.role}`}
                                data-testid="robin-chat-message"
                            >
                                {message.text}
                            </div>
                        ))}
                    </div>
                )}
                {generatedDrafts.length > 0 && (
                    <div className="generated-questions" data-testid="robin-generated-questions">
                        {generatedDrafts.map((draft, index) => {
                            const questionNumber = index + 1
                            const numericalAnswer = draft.questionType === 'numerical' ? draft.answers[0] : undefined
                            return (
                                <article
                                    key={`${questionNumber}-${draft.question}`}
                                    className="generated-question"
                                    data-testid="robin-generated-question"
                                >
                                    <div className="generated-question__header">
                                        <span
                                            className="generated-question__number"
                                            data-testid="robin-generated-question-number"
                                        >
                                            {questionNumber}.
                                        </span>
                                        <h3
                                            className="generated-question__title"
                                            data-testid="robin-generated-question-title"
                                        >
                                            {draft.question}
                                        </h3>
                                    </div>

                                    {draft.questionType === 'numerical' ? (
                                        <div className="generated-question__numerical">
                                            <div data-testid="robin-generated-numerical-answer">{numericalAnswer}</div>
                                            {draft.tolerance !== undefined && (
                                                <div data-testid="robin-generated-tolerance">{draft.tolerance}</div>
                                            )}
                                        </div>
                                    ) : (
                                        <ol className="generated-question__answers">
                                            {draft.answers.map((answer, answerIndex) => {
                                                const correct = draft.correctAnswers.includes(answerIndex)
                                                return (
                                                    <li
                                                        key={`${questionNumber}-${answer}`}
                                                        className={correct ? 'is-correct' : undefined}
                                                        data-testid="robin-generated-answer"
                                                    >
                                                        <span>{answer}</span>
                                                        {correct && (
                                                            <strong data-testid="robin-generated-answer-correct">
                                                                Correct
                                                            </strong>
                                                        )}
                                                    </li>
                                                )
                                            })}
                                        </ol>
                                    )}

                                    {draft.questionExplanation && (
                                        <p
                                            className="generated-question__explanation"
                                            data-testid="robin-generated-question-explanation"
                                        >
                                            {draft.questionExplanation}
                                        </p>
                                    )}

                                    {onUseDraft && (
                                        <Button
                                            id="robin-use-button"
                                            className="secondary button"
                                            onClick={() => onUseDraft(draft)}
                                        >
                                            Use this question
                                        </Button>
                                    )}
                                </article>
                            )
                        })}
                    </div>
                )}
                {saveDrafts && generatedDrafts.length > 0 && (
                    <Button
                        id="robin-save-button"
                        className="secondary button"
                        onClick={() => void save()}
                        disabled={saving || loading}
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                )}
            </div>
            <div className="robin-sheet__composer" data-testid="robin-composer">
                <Field
                    label="Question type"
                    required
                    note="Single choice requires one correct answer. Multiple choice requires at least two correct answers. Numerical questions require a numeric answer."
                >
                    <QuestionTypeRadioSet
                        name="robin-question-type"
                        value={questionType}
                        onChange={onQuestionTypeChange}
                    />
                </Field>
                <TextArea
                    id="robin-prompt-text"
                    placeholder="What do you want to ask?"
                    value={promptText}
                    onChange={setPromptText}
                    onKeyDown={onPromptKeyDown}
                />
                <span className="example">Press Enter to send. Use Shift+Enter for a new line.</span>
                {loading && <span className="example">Robin is thinking...</span>}
            </div>
        </div>
    )
}
