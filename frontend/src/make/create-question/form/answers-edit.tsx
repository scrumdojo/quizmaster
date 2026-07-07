import { useLanguage } from '#fe/i18n/language-context.tsx'
import { Button, Field, TextInput, Row, CheckField, HelpTooltip, TrashButton } from '#fe/shared'
import { ErrorMessage } from '#fe/shared/forms/validations.tsx'

import type { AnswerState } from './question-form-state.ts'

interface AnswerRowProps {
    readonly state: AnswerState
    readonly isMultipleChoice: boolean
    readonly showExplanations: boolean
    onDelete: () => void
    deleteDisabled: boolean
}

export const AnswerRow = ({ state, isMultipleChoice, onDelete, deleteDisabled, showExplanations }: AnswerRowProps) => {
    const { t } = useLanguage()
    return (
        <div className="answer-row">
            <input
                type={isMultipleChoice ? 'checkbox' : 'radio'}
                checked={state.isCorrect}
                onChange={state.toggleCorrect}
            />
            <div>
                <TextInput
                    placeholder={t.question.answerPlaceholder}
                    className="text"
                    value={state.answer}
                    onChange={state.setAnswer}
                />
                {showExplanations && (
                    <TextInput
                        placeholder={t.question.explanationPlaceholder}
                        className="explanation"
                        value={state.explanation}
                        onChange={state.setExplanation}
                    />
                )}
            </div>
            <TrashButton onClick={onDelete} disabled={deleteDisabled} />
        </div>
    )
}

interface AnswersProps {
    readonly answerStates: readonly AnswerState[]
    readonly isMultipleChoice: boolean
    readonly addAnswer: () => void
    readonly showExplanations: boolean
    readonly setShowExplanations: (show: boolean | ((show: boolean) => boolean)) => void
    readonly removeAnswer: (idx: number) => void
}

export const AnswersEdit = ({
    answerStates,
    isMultipleChoice,
    addAnswer,
    showExplanations,
    setShowExplanations,
    removeAnswer,
}: AnswersProps) => {
    const { t } = useLanguage()
    const handleToggleExplanations = () => setShowExplanations(showExplanations => !showExplanations)

    return (
        <Field
            label={t.question.answersFieldLabel}
            required
            note={<span id="correct-answer-note">{t.question.answersNote}</span>}
        >
            <div className="answer-controls">
                <CheckField
                    id="show-explanation"
                    label={t.question.showExplanationsLabel}
                    onToggle={handleToggleExplanations}
                    checked={showExplanations}
                />
                <HelpTooltip label={t.question.showExplanationsLabel}>{t.question.showExplanationsTooltip}</HelpTooltip>
            </div>
            {answerStates.map((state, idx) => (
                <AnswerRow
                    key={state.id}
                    state={state}
                    isMultipleChoice={isMultipleChoice}
                    onDelete={() => removeAnswer(idx)}
                    deleteDisabled={answerStates.length < 3}
                    showExplanations={showExplanations}
                />
            ))}
            <Row>
                <Button onClick={addAnswer} className="secondary button" id="add-answer">
                    {t.question.addAnswer}
                </Button>
            </Row>
            <ErrorMessage errorCode="no-correct-answer" />
            <ErrorMessage errorCode="empty-answer" />
            <ErrorMessage errorCode="empty-answer-explanation" />
            <ErrorMessage errorCode="few-correct-answers" />
        </Field>
    )
}
