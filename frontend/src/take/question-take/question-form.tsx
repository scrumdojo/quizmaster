import './question-form.scss'
import { useEffect } from 'react'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import { Form } from '#fe/shared'
import type { Question, QuestionTake } from '#fe/take/model/question.ts'
import { countDecimalDigits } from '#fe/take/model/question.ts'

import { AnswerCountHint } from './components/answer-count-hint.tsx'
import { ChoiceAnswerList } from './components/choice-answer-list.tsx'
import { NumericalAnswerInput } from './components/numerical-answer-input.tsx'
import { QuestionFeedback } from './components/question-feedback.tsx'
import { QuestionHeader } from './components/question-header.tsx'
import { QuestionImage } from './components/question-image.tsx'
import { SubmitButton } from './components/submit-button.tsx'
import { useQuestionTakeState } from './question-take-state.ts'
import { useQuestionKeyboardShortcuts } from './use-keyboard-shortcuts.ts'

interface QuestionFormProps {
    readonly question: Question | QuestionTake
}

export const QuestionForm = ({ question }: QuestionFormProps) => {
    const { t } = useLanguage()
    useEffect(() => {
        window.__setPhotoQuestion?.(question.id)
        return () => window.__setPhotoQuestion?.(null)
    }, [question.id])

    const state = useQuestionTakeState(question)
    const displayQuestion = state.feedbackQuestion ?? question
    const answers = displayQuestion.answers
    const correctAnswerCount =
        'correctAnswers' in displayQuestion ? displayQuestion.correctAnswers.length : displayQuestion.correctAnswerCount
    const questionExplanation = state.feedbackQuestion?.questionExplanation ?? ''

    const decimalDigits =
        state.isNumerical && answers[0]
            ? countDecimalDigits(answers[0])
            : 'requiredDecimalDigits' in question
              ? question.requiredDecimalDigits
              : 0

    useQuestionKeyboardShortcuts({
        enabled: !state.isNumerical,
        onDigitPressed: idx => {
            if (idx >= 0 && idx < answers.length) {
                if (!state.isMultipleChoice) state.selectAndSubmit(idx)
                else state.onSelectedAnswerChange(idx, true)
            }
        },
        onEnterPressed: state.attemptSubmit,
    })

    return (
        <Form onSubmit={state.attemptSubmit} id="question-form">
            <div className="question-fieldset">
                <QuestionHeader text={question.question} />

                {state.showAnswerCount && <AnswerCountHint count={correctAnswerCount} />}
                {question.imageUrl && <QuestionImage url={question.imageUrl} />}

                {state.isNumerical ? (
                    <>
                        <NumericalAnswerInput value={state.numericalAnswer} onChange={state.onNumericalAnswerChange} />
                        {decimalDigits > 0 && <p>{t.question.decimalDigitsHint(decimalDigits)}</p>}
                    </>
                ) : (
                    <ChoiceAnswerList
                        question={displayQuestion}
                        showFeedback={state.showFeedback}
                        onSelectedAnswerChange={state.onSelectedAnswerChange}
                        isAnswerChecked={state.isAnswerChecked}
                    />
                )}

                {!state.submitted && !state.submitting && <SubmitButton disabled={!state.hasAnswer} />}
                {state.showResultFeedback && (
                    <QuestionFeedback status={state.status} score={state.score} explanation={questionExplanation} />
                )}
            </div>
        </Form>
    )
}
