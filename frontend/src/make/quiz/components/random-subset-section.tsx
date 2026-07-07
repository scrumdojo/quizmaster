import { useLanguage } from '#fe/i18n/language-context.tsx'
import { CheckField, FieldNote, NumberInput } from '#fe/shared'
import { ErrorMessage } from '#fe/shared/forms/validations.tsx'

interface RandomSubsetSectionProps {
    readonly enabled: boolean
    readonly onEnabledChange: (value: boolean) => void
    readonly count: number
    readonly onCountChange: (value: number) => void
}

export const RandomSubsetSection = ({ enabled, onEnabledChange, count, onCountChange }: RandomSubsetSectionProps) => {
    const { t } = useLanguage()
    return (
        <>
            <CheckField
                id="isRandomized"
                label={t.quiz.randomSubsetLabel}
                checked={enabled}
                onToggle={onEnabledChange}
            />
            {enabled && (
                <>
                    <FieldNote id="random-subset-note">{t.quiz.randomSubsetNote}</FieldNote>
                    <span className="inline-label">
                        <div className="random-count-input">
                            <NumberInput id="quiz-randomQuestionCount" value={count} onChange={onCountChange} />
                        </div>
                        {t.quiz.questionsPerTakeLabel}
                    </span>
                </>
            )}
            <ErrorMessage errorCode="too-many-randomized-questions" />
        </>
    )
}
