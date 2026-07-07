import './correctness.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { AnswerStatus } from '#fe/take/model/question.ts'

interface CorrectnessProps {
    readonly status: AnswerStatus
}

export const Correctness = ({ status }: CorrectnessProps) => {
    const { t } = useLanguage()
    const labels: Record<AnswerStatus, { label: string; className: string }> = {
        CORRECT: { label: t.take.correctLabel, className: 'correct' },
        PARTIAL: { label: t.take.partiallyCorrectLabel, className: 'partial-correct' },
        INCORRECT: { label: t.take.incorrectLabel, className: 'incorrect' },
        UNANSWERED: { label: t.take.incorrectLabel, className: 'incorrect' },
    }
    const { label, className } = labels[status]
    return <span className={`feedback ${className}`}>{label}</span>
}

export const QuestionCorrectness = (props: CorrectnessProps) => (
    <p className="question-feedback">
        <Correctness {...props} />
    </p>
)
