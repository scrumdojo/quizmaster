import { CheckField, FieldNote, NumberInput } from '#fe/shared'
import { ErrorMessage } from '#fe/shared/forms/validations.tsx'

interface RandomSubsetSectionProps {
    readonly enabled: boolean
    readonly onEnabledChange: (value: boolean) => void
    readonly count: number
    readonly onCountChange: (value: number) => void
}

export const RandomSubsetSection = ({ enabled, onEnabledChange, count, onCountChange }: RandomSubsetSectionProps) => (
    <>
        <CheckField id="isRandomized" label="Serve a random subset" checked={enabled} onToggle={onEnabledChange} />
        {enabled && (
            <>
                <FieldNote id="random-subset-note">
                    Each attempt receives the configured number of questions from the selected pool.
                </FieldNote>
                <span className="inline-label">
                    <div className="random-count-input">
                        <NumberInput id="quiz-randomQuestionCount" value={count} onChange={onCountChange} />
                    </div>
                    Questions per take
                </span>
            </>
        )}
        <ErrorMessage errorCode="too-many-randomized-questions" />
    </>
)
