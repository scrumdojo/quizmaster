import { Button, Field, TextInput, Row, CheckField, HelpTooltip } from '#fe/shared'
import { ErrorMessage } from '#fe/shared/forms/validations.tsx'

import type { AnswerState } from './question-form-state.ts'
import TrashButton from './trash-button.tsx'

interface AnswerRowProps {
    readonly state: AnswerState
    readonly isMultipleChoice: boolean
    readonly showExplanations: boolean
    onDelete: () => void
    deleteDisabled: boolean
}

export const AnswerRow = ({ state, isMultipleChoice, onDelete, deleteDisabled, showExplanations }: AnswerRowProps) => (
    <div className="answer-row">
        <input
            type={isMultipleChoice ? 'checkbox' : 'radio'}
            checked={state.isCorrect}
            onChange={state.toggleCorrect}
        />
        <div>
            <TextInput placeholder="answer" className="text" value={state.answer} onChange={state.setAnswer} />
            {showExplanations && (
                <TextInput
                    placeholder="explanation"
                    className="explanation"
                    value={state.explanation}
                    onChange={state.setExplanation}
                />
            )}
        </div>
        <TrashButton onClick={onDelete} disabled={deleteDisabled} />
    </div>
)

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
    const handleToggleExplanations = () => setShowExplanations(showExplanations => !showExplanations)

    return (
        <Field
            label="Enter your answers"
            required
            note={<span id="correct-answer-note">Use the radio buttons or checkboxes to mark correct answers.</span>}
        >
            <div className="answer-controls">
                <CheckField
                    id="show-explanation"
                    label="Show explanations"
                    onToggle={handleToggleExplanations}
                    checked={showExplanations}
                />
                <HelpTooltip label="Show explanations">
                    Explanations are shown with answer feedback. Fill all answer explanations or leave them all empty.
                </HelpTooltip>
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
                    Add Answer
                </Button>
            </Row>
            <ErrorMessage errorCode="no-correct-answer" />
            <ErrorMessage errorCode="empty-answer" />
            <ErrorMessage errorCode="empty-answer-explanation" />
            <ErrorMessage errorCode="few-correct-answers" />
        </Field>
    )
}
