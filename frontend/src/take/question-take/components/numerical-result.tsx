import './numerical-result.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'
import { type AnswerStatus, type Question, numericalAnswer } from '#fe/take/model/question.ts'

interface NumericalResultProps {
    readonly question: Question
    readonly userInput: string
    readonly status: AnswerStatus
}

export const NumericalResult = ({ question, userInput, status }: NumericalResultProps) => {
    const { t } = useLanguage()
    const correctAnswer = question.answers[0]
    const answer = numericalAnswer(userInput)
    if (!answer || answer.type !== 'numerical') return null

    const userValue = answer.value
    const correctValue = Number.parseFloat(correctAnswer)
    const isCorrect = status === 'CORRECT'
    const isExact = userValue === correctValue

    if (isCorrect && isExact) {
        return (
            <div className="numerical-result">
                <div className="numerical-bar correct" data-testid="correct-bar">
                    <span className="bar-label correct-label">{t.take.correctAnswerLabel}</span> {correctAnswer}
                </div>
            </div>
        )
    }

    const userBarClass = isCorrect ? 'within-tolerance' : 'incorrect'

    return (
        <div className="numerical-result">
            <div className="numerical-bar correct" data-testid="correct-bar">
                <span className="bar-label correct-label">{t.take.correctAnswerLabel}</span> {correctAnswer}
                {!isCorrect && <span className="bar-note"> {t.take.missedNote}</span>}
            </div>
            <div className={`numerical-bar ${userBarClass}`} data-testid="user-bar">
                <span className="bar-label">{t.take.yourAnswerLabel}</span> {userValue}
                {isCorrect && <span className="bar-note"> {t.take.withinToleranceNote}</span>}
            </div>
        </div>
    )
}
