import './quiz-edit-form.scss'
import { useState } from 'react'

import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import { Field, FieldNote, Form, NumberInput, RadioSet, Row, SubmitButton, TextArea, TextInput } from '#fe/shared'
import { ErrorMessage, createValidator } from '#fe/shared/forms/validations.tsx'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import { parseTimeLimitToSeconds } from '#shared/parsers/time-limit.ts'

import { QuestionCountInfo } from './components/question-count-info.tsx'
import { QuestionSelect } from './components/question-select.tsx'
import { RandomSubsetSection } from './components/random-subset-section.tsx'
import { useQuizFormState, stateToQuizApiData, type QuizEditFormData } from './quiz-form-state.ts'
import { formatTimeLimit } from './utils/formatTimeLimit.ts'
import { validateQuizForm, errorMessage } from './validations.ts'

const TIME_LIMIT_PARTIAL_REGEX = /^(?:\d*|\d+m|\d+s|\d+m\d*|\d+s\d*|\d+m\d+s|\d+s\d+m)$/i

interface QuizEditFormProps {
    readonly questions: readonly QuestionListItem[]
    readonly onSubmit: (data: QuizEditFormData) => void
    readonly quiz?: Quiz
    readonly onCreateNewQuestion?: () => void
}
export const QuizEditForm = ({ questions, onSubmit, quiz, onCreateNewQuestion }: QuizEditFormProps) => {
    const state = useQuizFormState(questions, quiz)
    const [timeLimitText, setTimeLimitText] = useState(`${state.timeLimit}s`)

    const validator = createValidator(() => validateQuizForm(state), errorMessage)

    const onTimeLimitTextChange = (value: string) => {
        const inputIsValid = TIME_LIMIT_PARTIAL_REGEX.test(value)
        if (!inputIsValid) {
            return
        }

        setTimeLimitText(value)

        if (inputIsValid) {
            const parsedTime = parseTimeLimitToSeconds(value)
            state.setTimeLimit(parsedTime)
        }
    }

    return (
        <Form id="create-quiz" validator={validator} onSubmit={() => onSubmit(stateToQuizApiData(state))}>
            <Field label="Quiz title" required>
                <TextInput id="quiz-title" value={state.title} onChange={state.setTitle} />
                <ErrorMessage errorCode="empty-title" />
            </Field>
            <Field label="Quiz description">
                <TextArea id="quiz-description" value={state.description} onChange={state.setDescription} />
            </Field>
            <Row>
                <Field label="Quiz start date and time">
                    <input
                        id="quiz-start-at"
                        type="datetime-local"
                        value={state.startAt}
                        onChange={e => state.setStartAt(e.target.value)}
                    />
                </Field>
                <Field label="Quiz end date and time">
                    <input
                        id="quiz-end-at"
                        type="datetime-local"
                        value={state.endAt}
                        onChange={e => state.setEndAt(e.target.value)}
                    />
                </Field>
            </Row>
            <FieldNote id="quiz-availability-note">
                Empty start or end dates do not restrict that side of the quiz availability window.
            </FieldNote>
            <Row>
                <Field label="Pass score (in %)" tooltip="The minimum final percentage required to pass the quiz.">
                    <NumberInput id="pass-score" value={state.passScore} onChange={state.setPassScore} />
                    <ErrorMessage errorCode="score-above-max" />
                </Field>
                <Field
                    label="Time limit (eg. 10m30s)"
                    tooltip="The time limit applies to the complete quiz."
                    note="Use a duration such as 10m30s. The maximum time limit is 6 hours."
                >
                    <Row>
                        <TextInput id="time-limit" value={timeLimitText} onChange={onTimeLimitTextChange} />
                        <span id="formatted-time-limit" className="bold-count">
                            {formatTimeLimit(state.timeLimit)}
                        </span>
                    </Row>
                    <ErrorMessage errorCode="time-limit-above-max" />
                    <ErrorMessage errorCode="time-limit-invalid-format" />
                </Field>
            </Row>
            <Field
                label="Feedback mode"
                note={
                    <span id="feedback-mode-note">
                        Exam mode shows feedback at the end. Learning mode shows feedback after each answer and allows
                        the taker to try again.
                    </span>
                }
            >
                <RadioSet
                    name="mode"
                    value={state.feedbackMode}
                    onChange={state.setFeedbackMode}
                    options={{ exam: 'Exam', learn: 'Learning' }}
                />
            </Field>
            <Field
                label="Difficulty"
                note={
                    <span id="quiz-difficulty-note">
                        Keep Question respects each question setting. Easy reveals correct answer counts. Hard hides
                        correct answer counts.
                    </span>
                }
            >
                <RadioSet
                    name="difficulty"
                    value={state.difficulty}
                    onChange={state.setDifficulty}
                    options={{ easy: 'Easy', hard: 'Hard', 'keep-question': 'Keep Question' }}
                />
            </Field>
            <div className="label">Select quiz questions</div>
            <FieldNote>At least two questions must be selected.</FieldNote>
            <Field label="Search questions">
                <TextInput id="question-filter" value={state.filter} onChange={state.setFilter} />
                {onCreateNewQuestion && (
                    <button
                        type="button"
                        id="quiz-create-new-question"
                        className="quiz-create-new-question"
                        onClick={onCreateNewQuestion}
                    >
                        + Create new question
                    </button>
                )}
            </Field>
            <QuestionSelect
                questions={state.filteredQuestions}
                selectedIds={state.selectedIds}
                onSelect={state.toggleSelectedId}
            />
            <ErrorMessage errorCode="few-questions" />

            <QuestionCountInfo selectedCount={state.selectedIds.size} totalCount={questions.length} />

            <RandomSubsetSection
                enabled={state.checkRandomize}
                onEnabledChange={state.setCheckRandomize}
                count={state.randomQuestionCount}
                onCountChange={state.setRandomQuestionCount}
            />
            <SubmitButton />
        </Form>
    )
}
