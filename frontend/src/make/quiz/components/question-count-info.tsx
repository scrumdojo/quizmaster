import { useLanguage } from '#fe/i18n/language-context.tsx'

interface QuestionCountInfoProps {
    readonly selectedCount: number
    readonly totalCount: number
}

export const QuestionCountInfo = ({ selectedCount, totalCount }: QuestionCountInfoProps) => {
    const { t } = useLanguage()
    return (
        <>
            <div className="question-count-info">
                <span className="inline-label">
                    <div className="bold-count" id="selected-question-count-for-quiz">
                        {selectedCount}
                    </div>
                    {t.quiz.selectedQuestionsLabel}
                </span>
            </div>
            <div className="question-count-info">
                <span className="inline-label">
                    <div className="bold-count" id="total-question-count-for-quiz">
                        {totalCount}
                    </div>
                    {t.quiz.totalQuestionsLabel}
                </span>
            </div>
        </>
    )
}
