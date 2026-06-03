import { DecimalInput, Field, NumberInput } from '#fe/shared'
import { ErrorMessage } from '#fe/shared/forms/validations.tsx'
import { countDecimalDigits } from '#fe/shared/model/question.ts'

interface NumericalAnswerEditProps {
    readonly answer: string
    readonly onAnswerChange: (value: string) => void
    readonly tolerance: number
    readonly onToleranceChange: (value: number) => void
}

export const NumericalAnswerEdit = ({
    answer,
    onAnswerChange,
    tolerance,
    onToleranceChange,
}: NumericalAnswerEditProps) => {
    const decimalDigits = countDecimalDigits(answer)

    return (
        <>
            <Field label="Correct numerical answer" required>
                <DecimalInput id="numerical-correct-answer" value={answer} onChange={onAnswerChange} />
                <ErrorMessage errorCode="empty-numerical-answer" />
                <ErrorMessage errorCode="invalid-numerical-answer" />
                {decimalDigits > 0 && (
                    <p className="field-note">{decimalDigits} decimal digits will be required in the answer.</p>
                )}
            </Field>
            <Field
                label="Tolerance"
                note={
                    <span id="numerical-tolerance-note">
                        Answers within the correct answer plus or minus the tolerance are accepted. Zero tolerance
                        requires an exact answer.
                    </span>
                }
            >
                <NumberInput
                    id="numerical-tolerance"
                    min={0}
                    step="any"
                    value={tolerance}
                    onChange={onToleranceChange}
                />
            </Field>
        </>
    )
}
