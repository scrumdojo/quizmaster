import './question-summary.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { AnswerStatus, Question, QuestionAnswer } from '#fe/take/model/question.ts'
import { Answer, QuestionExplanation } from '#fe/take/question-take'
import { NumericalResult } from '#fe/take/question-take/components/numerical-result.tsx'

interface QuestionSummaryProps {
    readonly question: Question
    readonly status: AnswerStatus
    readonly answer?: QuestionAnswer
}

export const QuestionSummary = ({ question, status, answer }: QuestionSummaryProps) => {
    const { t } = useLanguage()
    const isMultipleChoice = question.correctAnswers.length > 1
    const selectedIdxs = answer?.type === 'choice' ? answer.selectedIdxs : undefined
    const isNumerical = question.questionType === 'numerical'
    const numericalUserInput = answer?.type === 'numerical' ? answer.value.toString() : ''
    const isCorrect = (idx: number) => question.correctAnswers.includes(idx)
    const isAnswerChecked = (idx: number) => selectedIdxs?.includes(idx) ?? false

    return (
        <fieldset
            key={question.id}
            id={`question-${question.id}`}
            className="question-fieldset"
            name={`question-${question.id}`}
        >
            <legend>
                <strong id={`question-name-${question.id}`}>{question.question}</strong>
            </legend>
            {isNumerical ? (
                <NumericalResult question={question} userInput={numericalUserInput} status={status} />
            ) : (
                <ul id={`question-answers-${question.id}`} className="answers">
                    {question.answers.map((answer, idx) => (
                        <Answer
                            key={answer}
                            isMultipleChoice={isMultipleChoice}
                            idx={idx}
                            questionId={question.id}
                            answer={answer}
                            isCorrect={isCorrect(idx)}
                            explanation={question.explanations[idx]}
                            showFeedback={true}
                            onAnswerChange={() => {}}
                            disabled={true}
                            isAnswerChecked={isAnswerChecked}
                        />
                    ))}
                </ul>
            )}
            {question.questionExplanation && (
                <div className="question-explanation-row">
                    <span className="explanation-label">{t.take.questionExplanationLabel}</span>
                    <QuestionExplanation text={question.questionExplanation} />
                </div>
            )}
        </fieldset>
    )
}
