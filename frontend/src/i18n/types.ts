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
        readonly close: string
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
    readonly quiz: {
        readonly editTitle: string
        readonly createTitle: string
        readonly createNewQuestionModalTitle: string
        readonly titleFieldLabel: string
        readonly descriptionFieldLabel: string
        readonly startDateFieldLabel: string
        readonly endDateFieldLabel: string
        readonly availabilityNote: string
        readonly passScoreFieldLabel: string
        readonly passScoreTooltip: string
        readonly timeLimitFieldLabel: string
        readonly timeLimitTooltip: string
        readonly timeLimitNote: string
        readonly feedbackModeFieldLabel: string
        readonly feedbackModeNote: string
        readonly modeExam: string
        readonly modeLearn: string
        readonly modeBuzzer: string
        readonly difficultyFieldLabel: string
        readonly difficultyNote: string
        readonly difficultyHard: string
        readonly difficultyKeepQuestion: string
        readonly selectQuestionsLabel: string
        readonly selectQuestionsNote: string
        readonly searchQuestionsFieldLabel: string
        readonly createNewQuestionButton: string
        readonly weightLabel: string
        readonly selectedQuestionsLabel: string
        readonly totalQuestionsLabel: string
        readonly randomSubsetLabel: string
        readonly randomSubsetNote: string
        readonly questionsPerTakeLabel: string
        readonly errorEmptyTitle: string
        readonly errorTimeLimitAboveMax: string
        readonly errorTimeLimitInvalidFormat: string
        readonly errorScoreAboveMax: string
        readonly errorFewQuestions: string
        readonly errorTooManyRandomized: string
        readonly statsTitle: string
        readonly statsSubtitle: (title: string) => string
        readonly statsEyebrow: string
        readonly statsHeading: (title: string) => string
        readonly statsIntro: string
        readonly startedAttemptsLabel: string
        readonly startedAttemptsDetail: (n: number) => string
        readonly completionRateLabel: string
        readonly completionRateDetail: (n: number) => string
        readonly questionsInQuizLabel: string
        readonly questionsInQuizDetail: (n: number) => string
        readonly averageDurationLabel: string
        readonly averageDurationDetailNone: string
        readonly averageDurationDetail: (n: number) => string
        readonly overviewKicker: string
        readonly attemptSummaryTitle: string
        readonly attemptSummaryIntro: string
        readonly colStarted: string
        readonly colFinished: string
        readonly colUnfinished: string
        readonly colUnfinishedTooltip: string
        readonly colTimeout: string
        readonly attemptsKicker: string
        readonly performanceByRunTitle: string
        readonly performanceByRunIntro: string
        readonly colDuration: string
        readonly colPoints: string
        readonly colPointsTooltip: string
        readonly colCorrectAnswers: string
        readonly colIncorrectAnswers: string
        readonly colScore: string
        readonly colScoreTooltip: string
        readonly colStatus: string
        readonly colPartiallyCorrectAnswers: string
        readonly colPartiallyCorrectTooltip: string
        readonly noAttemptsYet: string
        readonly categoriesKicker: string
        readonly performanceByTagTitle: string
        readonly performanceByTagIntro: string
        readonly captionSummary: string
        readonly captionTags: string
        readonly colTag: string
        readonly colQuestionsTooltip: string
        readonly colAnswered: string
        readonly colCorrect: string
        readonly colPartiallyCorrect: string
        readonly colIncorrect: string
        readonly colUnanswered: string
        readonly colUnansweredTooltip: string
        readonly questionsKicker: string
        readonly questionLevelBreakdownTitle: string
        readonly questionLevelBreakdownIntro: string
        readonly colQuestion: string
        readonly colFlagged: string
        readonly colFlaggedTooltip: string
        readonly statusFinished: string
        readonly statusInProgress: string
        readonly statusTimeout: string
        readonly statusAbandoned: string
        readonly shareTitle: (title: string) => string
        readonly takeLinkTitle: string
        readonly takeLinkNote: string
        readonly cohortsTitle: string
        readonly cohortsNote: string
        readonly noCohortsYet: string
        readonly showQrCode: string
        readonly copied: string
        readonly shareActionTooltip: (label: string) => string
        readonly shareActionTooltipBody: string
        readonly liveStats: string
        readonly liveStatsTooltipBody: string
        readonly cohortLiveStatsCaption: string
        readonly colOrder: string
        readonly colCohort: string
        readonly cohortNamePlaceholder: string
        readonly addCohort: string
        readonly cohortsWithAttemptsNote: string
        readonly emptyCohortNameError: string
        readonly duplicateCohortNameError: string
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
