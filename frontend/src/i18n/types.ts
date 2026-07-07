export type Language = 'en' | 'nl'

export interface Translations {
    readonly common: {
        readonly back: string
        readonly save: string
        readonly cancel: string
        readonly delete: string
        readonly edit: string
        readonly take: string
        readonly share: string
        readonly statistics: string
        readonly dryRun: string
        readonly actions: string
        readonly create: string
        readonly confirm: string
        readonly results: string
    }
    readonly home: {
        readonly eyebrow: string
        readonly title: string
        readonly intro: string
        readonly createWorkspace: string
        readonly workflowBadge: string
        readonly workflowStep1Title: string
        readonly workflowStep1Body: string
        readonly workflowStep2Title: string
        readonly workflowStep2Body: string
        readonly workflowStep3Title: string
        readonly workflowStep3Body: string
        readonly highlightStartFastTitle: string
        readonly highlightStartFastBody: string
        readonly highlightShapeTitle: string
        readonly highlightShapeBody: string
        readonly highlightOrganizeTitle: string
        readonly highlightOrganizeBody: string
    }
    readonly workspace: {
        readonly createTitle: string
        readonly workspaceTitleFieldLabel: string
        readonly eyebrow: string
        readonly copy: string
        readonly questionCount: (n: number) => string
        readonly quizCount: (n: number) => string
        readonly summaryAriaLabel: string
        readonly sectionsAriaLabel: string
        readonly tabQuizzes: string
        readonly tabQuestions: string
        readonly tabPolls: string
        readonly pollsTitle: string
        readonly questionsTitle: string
        readonly quizzesTitle: string
        readonly noPollsTitle: string
        readonly noPollsBody: string
        readonly questionFilterLabel: string
        readonly questionFilterPlaceholder: string
        readonly tagFilterLabel: string
        readonly noMatchingQuestionsTitle: string
        readonly noMatchingBody: string
        readonly createFirstQuestionTitle: string
        readonly createFirstQuestionBody: string
        readonly questionPagesAriaLabel: string
        readonly quizFilterLabel: string
        readonly quizFilterPlaceholder: string
        readonly noMatchingQuizzesTitle: string
        readonly turnQuestionsIntoQuizTitle: string
        readonly turnQuestionsIntoQuizBody: string
        readonly quizPagesAriaLabel: string
        readonly pageAriaLabel: (n: number) => string
        readonly deleteQuizConfirm: (title: string) => string
        readonly deletePollConfirm: (question: string) => string
        readonly inQuiz: string
        readonly inQuizTooltipLabel: (question: string) => string
        readonly inQuizTooltipBody: string
        readonly dryRunTooltipLabel: string
        readonly dryRunTooltipBody: string
    }
    readonly question: {
        readonly createTitle: string
        readonly createSubtitle: string
        readonly editTitle: string
        readonly editSubtitle: string
        readonly backToWorkspace: string
        readonly questionFieldLabel: string
        readonly imageUrlFieldLabel: string
        readonly imageUrlTooltip: string
        readonly questionTypeFieldLabel: string
        readonly questionTypeNote: string
        readonly easyLabel: string
        readonly easyTooltip: string
        readonly explanationFieldLabel: string
        readonly explanationTooltip: string
        readonly tagFieldLabel: string
        readonly tagTooltip: string
        readonly answersFieldLabel: string
        readonly answersNote: string
        readonly answerPlaceholder: string
        readonly explanationPlaceholder: string
        readonly showExplanationsLabel: string
        readonly showExplanationsTooltip: string
        readonly addAnswer: string
        readonly numericalAnswerFieldLabel: string
        readonly toleranceFieldLabel: string
        readonly toleranceNote: string
        readonly decimalDigitsHint: (n: number) => string
        readonly typeSingle: string
        readonly typeMultiple: string
        readonly typeNumerical: string
        readonly errorEmptyQuestion: string
        readonly errorEmptyAnswer: string
        readonly errorNoCorrectAnswer: string
        readonly errorEmptyAnswerExplanation: string
        readonly errorFewCorrectAnswers: string
        readonly errorEmptyNumericalAnswer: string
        readonly errorInvalidNumericalAnswer: string
    }
    readonly robin: {
        readonly tooltip: string
        readonly chatTitle: string
        readonly useThisQuestion: string
        readonly saving: string
        readonly saveAll: string
        readonly correct: string
        readonly promptPlaceholder: string
        readonly sendHint: string
        readonly thinking: string
        readonly savedOneQuestion: string
        readonly savedManyQuestions: (n: number) => string
    }
}
