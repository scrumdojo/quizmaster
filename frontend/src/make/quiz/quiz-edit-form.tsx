import './quiz-edit-form.scss'
import { useState } from 'react'

import { useLanguage } from '#fe/i18n/language-context.tsx'
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
import { validateQuizForm, type ErrorCode } from './validations.ts'

const TIME_LIMIT_PARTIAL_REGEX = /^(?:\d*|\d+m|\d+s|\d+m\d*|\d+s\d*|\d+m\d+s|\d+s\d+m)$/i

interface QuizEditFormProps {
    readonly questions: readonly QuestionListItem[]
    readonly onSubmit: (data: QuizEditFormData) => void
    readonly quiz?: Quiz
    readonly onCreateNewQuestion?: () => void
}
export const QuizEditForm = ({ questions, onSubmit, quiz, onCreateNewQuestion }: QuizEditFormProps) => {
    const { t } = useLanguage()
    const state = useQuizFormState(questions, quiz)
    const [timeLimitText, setTimeLimitText] = useState(`${state.timeLimit}s`)

    const errorMessage: Record<ErrorCode, string> = {
        'empty-title': t.quiz.errorEmptyTitle,
        'time-limit-above-max': t.quiz.errorTimeLimitAboveMax,
        'time-limit-invalid-format': t.quiz.errorTimeLimitInvalidFormat,
        'score-above-max': t.quiz.errorScoreAboveMax,
        'few-questions': t.quiz.errorFewQuestions,
        'too-many-randomized-questions': t.quiz.errorTooManyRandomized,
    }

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
            <Field label={t.quiz.titleFieldLabel} required>
                <TextInput id="quiz-title" value={state.title} onChange={state.setTitle} />
                <ErrorMessage errorCode="empty-title" />
            </Field>
            <Field label={t.quiz.descriptionFieldLabel}>
                <TextArea id="quiz-description" value={state.description} onChange={state.setDescription} />
            </Field>
            <Row>
                <Field label={t.quiz.startDateFieldLabel}>
                    <input
                        id="quiz-start-at"
                        type="datetime-local"
                        value={state.startAt}
                        onChange={e => state.setStartAt(e.target.value)}
                    />
                </Field>
                <Field label={t.quiz.endDateFieldLabel}>
                    <input
                        id="quiz-end-at"
                        type="datetime-local"
                        value={state.endAt}
                        onChange={e => state.setEndAt(e.target.value)}
                    />
                </Field>
            </Row>
            <FieldNote id="quiz-availability-note">{t.quiz.availabilityNote}</FieldNote>
            <Row>
                <Field label={t.quiz.passScoreFieldLabel} tooltip={t.quiz.passScoreTooltip}>
                    <NumberInput id="pass-score" value={state.passScore} onChange={state.setPassScore} />
                    <ErrorMessage errorCode="score-above-max" />
                </Field>
                <Field label={t.quiz.timeLimitFieldLabel} tooltip={t.quiz.timeLimitTooltip} note={t.quiz.timeLimitNote}>
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
                label={t.quiz.feedbackModeFieldLabel}
                note={<span id="feedback-mode-note">{t.quiz.feedbackModeNote}</span>}
            >
                <RadioSet
                    name="mode"
                    value={state.feedbackMode}
                    onChange={state.setFeedbackMode}
                    options={{ exam: t.quiz.modeExam, learn: t.quiz.modeLearn }}
                />
            </Field>
            <Field
                label={t.quiz.difficultyFieldLabel}
                note={<span id="quiz-difficulty-note">{t.quiz.difficultyNote}</span>}
            >
                <RadioSet
                    name="difficulty"
                    value={state.difficulty}
                    onChange={state.setDifficulty}
                    options={{
                        easy: t.question.easyLabel,
                        hard: t.quiz.difficultyHard,
                        'keep-question': t.quiz.difficultyKeepQuestion,
                    }}
                />
            </Field>
            <div className="label">{t.quiz.selectQuestionsLabel}</div>
            <FieldNote>{t.quiz.selectQuestionsNote}</FieldNote>
            <Field label={t.quiz.searchQuestionsFieldLabel}>
                <TextInput id="question-filter" value={state.filter} onChange={state.setFilter} />
                {onCreateNewQuestion && (
                    <button
                        type="button"
                        id="quiz-create-new-question"
                        className="quiz-create-new-question"
                        onClick={onCreateNewQuestion}
                    >
                        {t.quiz.createNewQuestionButton}
                    </button>
                )}
            </Field>
            <QuestionSelect
                questions={state.filteredQuestions}
                selectedIds={state.selectedIds}
                weights={state.weights}
                onSelect={state.toggleSelectedId}
                onWeightChange={state.setWeight}
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
