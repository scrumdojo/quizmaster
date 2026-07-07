import { useLanguage } from '#fe/i18n/language-context.tsx'

interface QuestionScoreProps {
    readonly score: number
}

export const QuestionScore = (props: QuestionScoreProps) => {
    const { t } = useLanguage()
    return <p className="question-score">{t.take.scoreLabel(props.score)}</p>
}
