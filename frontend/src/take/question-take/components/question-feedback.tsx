import type { AnswerStatus, QuestionAnswer } from '#fe/take/model/question.ts'

import { QuestionCorrectness } from './correctness.tsx'
import { ExplanationChat } from './explanation-chat.tsx'
import { QuestionExplanation } from './explanation.tsx'
import { QuestionScore } from './question-score.tsx'

interface QuestionFeedbackProps {
    readonly questionId: number
    readonly status: AnswerStatus
    readonly score: number
    readonly explanation: string
    readonly givenAnswer: QuestionAnswer
}

export const QuestionFeedback = ({ questionId, status, score, explanation, givenAnswer }: QuestionFeedbackProps) => (
    <>
        <QuestionCorrectness status={status} />
        <QuestionScore score={score} />
        <QuestionExplanation text={explanation} />
        <ExplanationChat questionId={questionId} givenAnswer={givenAnswer} />
    </>
)
