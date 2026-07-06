import type { QuestionRequest } from '#fe/make/api/question.ts'
import type { QuestionDraft } from '#fe/shared/model/question.ts'

import type { QuestionFormStatePatch } from '../form/question-form-state.ts'

// Seeds the edit chat: the current form content becomes Robin's first draft version.
export const questionRequestToDraft = (q: QuestionRequest): QuestionDraft => ({
    question: q.question,
    answers: Array.from(q.answers),
    explanations: Array.from(q.explanations),
    correctAnswers: Array.from(q.correctAnswers),
    questionExplanation: q.questionExplanation,
    questionType: q.questionType,
    isEasy: q.isEasy,
    tolerance: q.tolerance,
    tags: Array.from(q.tags),
})

export const questionToPatch = (q: QuestionDraft): QuestionFormStatePatch => ({
    questionText: q.question,
    questionType: q.questionType,
    answers: q.answers,
    explanations: q.explanations,
    correctAnswers: Array.from(q.correctAnswers),
    questionExplanation: q.questionExplanation,
    isEasy: q.isEasy ?? false,
    showExplanations: q.explanations.some(explanation => !!explanation),
    numericalAnswer: q.questionType === 'numerical' ? (q.answers[0] ?? '') : '',
    tolerance: q.tolerance ?? 0,
})

export const questionDraftToRequest = (q: QuestionDraft): QuestionRequest =>
    q.questionType === 'numerical'
        ? {
              question: q.question,
              answers: [q.answers[0] ?? ''],
              correctAnswers: [0],
              explanations: [''],
              questionExplanation: q.questionExplanation,
              questionType: q.questionType,
              isEasy: q.isEasy ?? false,
              tolerance: q.tolerance ?? 0,
              tags: q.tags ? Array.from(q.tags) : [],
          }
        : {
              question: q.question,
              answers: Array.from(q.answers),
              correctAnswers: Array.from(q.correctAnswers),
              explanations: Array.from(q.explanations),
              questionExplanation: q.questionExplanation,
              questionType: q.questionType,
              isEasy: q.isEasy ?? false,
              tags: q.tags ? Array.from(q.tags) : [],
          }
