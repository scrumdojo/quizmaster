import type React from 'react'

import { useLanguage } from '#fe/i18n/language-context.tsx'

import { Explanation } from './explanation.tsx'
import './answer.scss'

export interface AnswerProps {
    readonly isMultipleChoice: boolean
    readonly idx: number
    readonly questionId: number
    readonly answer: string
    readonly explanation: string
    readonly isCorrect: boolean
    readonly showFeedback: boolean
    readonly onAnswerChange: (idx: number, selected: boolean) => void
    readonly isAnswerChecked: (idx: number) => boolean
    readonly disabled?: boolean
}

export const Answer = (props: AnswerProps) => {
    const { t } = useLanguage()
    const { disabled = false } = props
    const answerId = `answer-row-${props.idx}`
    const checkType = props.isMultipleChoice ? 'checkbox' : 'radio'

    const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        props.onAnswerChange(props.idx, event.target.checked)
    }

    const isChecked = props.isAnswerChecked(props.idx)

    const className = props.isCorrect ? 'correctly-selected' : isChecked ? 'incorrect' : 'correctly-not-selected'

    const barLabel = props.showFeedback
        ? props.isCorrect
            ? t.take.correctAnswerLabel
            : isChecked
              ? t.take.yourAnswerLabel
              : null
        : null
    const barLabelClass = props.isCorrect ? 'bar-label correct-label' : 'bar-label'
    const barNote = props.showFeedback && props.isCorrect && !isChecked ? t.take.missedNote : null

    return (
        <li key={props.idx} id={`answer-row-${props.idx}`}>
            <div className={`answer-input-row ${props.showFeedback ? className : ''}`}>
                <input
                    type={checkType}
                    name={`question-${props.questionId}`}
                    id={answerId}
                    value={props.answer}
                    onChange={onChange}
                    checked={isChecked}
                    disabled={disabled}
                />
                {barLabel && <span className={barLabelClass}>{barLabel}</span>}
                <label htmlFor={answerId} id={`answer-label-${props.idx}`}>
                    {props.answer}
                </label>
                {barNote && <span className="bar-note">{barNote}</span>}
            </div>
            {props.showFeedback && props.explanation && <Explanation text={props.explanation} />}
        </li>
    )
}
