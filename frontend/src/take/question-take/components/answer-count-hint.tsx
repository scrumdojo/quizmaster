import { useLanguage } from '#fe/i18n/language-context.tsx'

interface AnswerCountHintProps {
    readonly count: number
}

export const AnswerCountHint = ({ count }: AnswerCountHintProps) => {
    const { t } = useLanguage()
    return (
        <div>
            {t.take.correctAnswersCountPrefix} <strong className="correct-answers-count">{count}</strong>
        </div>
    )
}
