import { useLanguage } from '#fe/i18n/language-context.tsx'
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
    const { t } = useLanguage()
    const decimalDigits = countDecimalDigits(answer)

    return (
        <>
            <Field label={t.question.numericalAnswerFieldLabel} required>
                <DecimalInput id="numerical-correct-answer" value={answer} onChange={onAnswerChange} />
                <ErrorMessage errorCode="empty-numerical-answer" />
                <ErrorMessage errorCode="invalid-numerical-answer" />
                {decimalDigits > 0 && <p className="field-note">{t.question.decimalDigitsHint(decimalDigits)}</p>}
            </Field>
            <Field
                label={t.question.toleranceFieldLabel}
                note={<span id="numerical-tolerance-note">{t.question.toleranceNote}</span>}
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
