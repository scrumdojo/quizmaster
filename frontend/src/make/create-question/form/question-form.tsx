import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { QuestionRequest } from '#fe/make/api/question.ts'
import { AnswersEdit, NumericalAnswerEdit, stateToQuestionApiData } from '#fe/make/create-question/form'
import { RobinAiHelper } from '#fe/make/create-question/robin-ai'
import {
    SubmitButton,
    Form,
    Field,
    TextArea,
    TextInput,
    CheckField,
    Row,
    QuestionTypeRadioSet,
    HelpTooltip,
} from '#fe/shared'
import { ErrorMessage, createValidator } from '#fe/shared/forms/validations.tsx'
import type { Question } from '#fe/shared/model/question.ts'

import { useQuestionFormState } from './question-form-state.ts'
import { validateQuestionFormState, type ErrorCode } from './validators.ts'

interface QuestionEditProps {
    readonly workspaceId: string
    readonly question?: Question
    readonly onSubmit: (questionData: QuestionRequest) => void
}

export const QuestionEditForm = ({ workspaceId, question, onSubmit }: QuestionEditProps) => {
    const { t } = useLanguage()
    const state = useQuestionFormState(question)

    const errorMessage: Record<ErrorCode, string> = {
        'empty-question': t.question.errorEmptyQuestion,
        'empty-answer': t.question.errorEmptyAnswer,
        'no-correct-answer': t.question.errorNoCorrectAnswer,
        'empty-answer-explanation': t.question.errorEmptyAnswerExplanation,
        'few-correct-answers': t.question.errorFewCorrectAnswers,
        'empty-numerical-answer': t.question.errorEmptyNumericalAnswer,
        'invalid-numerical-answer': t.question.errorInvalidNumericalAnswer,
    }

    const validator = createValidator(() => validateQuestionFormState(state), errorMessage)

    const handleSubmit = () => onSubmit(stateToQuestionApiData(state))

    return (
        <>
            <RobinAiHelper
                workspaceId={workspaceId}
                form={{ snapshot: state.snapshot, applyPatch: state.applyPatch }}
                currentQuestion={question ? () => stateToQuestionApiData(state) : undefined}
                currentQuestionId={question?.id}
            />
            <Form id="question-create-form" validator={validator} onSubmit={handleSubmit}>
                <Field label={t.question.questionFieldLabel} required>
                    <TextArea id="question-text" value={state.questionText} onChange={state.setQuestionText} />
                    <ErrorMessage errorCode="empty-question" />
                </Field>
                <Field label={t.question.imageUrlFieldLabel} tooltip={t.question.imageUrlTooltip}>
                    <TextInput id="image-url" value={state.imageUrl} onChange={state.setImageUrl} />
                    {state.imageUrl.trim() !== '' && (
                        <img src={state.imageUrl} alt="preview" className="image-preview" />
                    )}
                </Field>
                <Row>
                    <Field
                        label={t.question.questionTypeFieldLabel}
                        required
                        note={<span id="question-type-note">{t.question.questionTypeNote}</span>}
                    >
                        <QuestionTypeRadioSet
                            name="question-type"
                            value={state.questionType}
                            onChange={state.selectQuestionType}
                        />
                    </Field>
                    {state.isMultipleChoice && (
                        <span className="check-with-help">
                            <CheckField
                                id="is-easy"
                                label={t.question.easyLabel}
                                checked={state.isEasy}
                                onToggle={state.setIsEasy}
                            />
                            <HelpTooltip label={t.question.easyLabel}>{t.question.easyTooltip}</HelpTooltip>
                        </span>
                    )}
                </Row>
                {state.isNumerical ? (
                    <NumericalAnswerEdit
                        answer={state.numericalAnswer}
                        onAnswerChange={state.setNumericalAnswer}
                        tolerance={state.tolerance}
                        onToleranceChange={state.setTolerance}
                    />
                ) : (
                    <AnswersEdit
                        setShowExplanations={state.setShowExplanations}
                        showExplanations={state.showExplanations}
                        answerStates={state.answerStates}
                        isMultipleChoice={state.isMultipleChoice}
                        addAnswer={state.addAnswer}
                        removeAnswer={state.removeAnswer}
                    />
                )}
                <Field label={t.question.explanationFieldLabel} tooltip={t.question.explanationTooltip}>
                    <TextArea
                        id="question-explanation"
                        value={state.questionExplanation}
                        onChange={state.setQuestionExplanation}
                    />
                </Field>
                <Field label={t.question.tagFieldLabel} tooltip={t.question.tagTooltip}>
                    <TextInput id="question-tag" value={state.tagText} onChange={state.setTagText} />
                </Field>
                <SubmitButton />
            </Form>
        </>
    )
}
