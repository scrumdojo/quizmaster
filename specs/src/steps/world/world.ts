import type { Page, TestInfo } from '@playwright/test'

import {
    AppPage,
    PageNavigation,
    WorkspaceCreatePage,
    HomePage,
    QuestionEditPage,
    RobinSheetPage,
    WorkspacePage,
    QuizCreatePage,
    QuestionPage,
    QuizScorePage,
    QuizSharePage,
    QuizWelcomePage,
    QuizStatsPage,
    PollFormPage,
    PollResultsPage,
    TakeQuestionPage,
    TakePollPage,
    EpicBattlePage,
} from '#pages/index.ts'
import { QuizNicknamePage } from '#pages/quiz-nickname-page'
import type { AnswerSpec, PollSpec, QuestionSpec } from '#steps/shared/specs.ts'

interface DelayedFlagSave {
    readonly waitForStarted: () => Promise<void>
    readonly release: () => Promise<void>
}

export class QuizmasterWorld {
    constructor(
        public page: Page,
        public testInfo: TestInfo,
    ) {
        this.appPage = new AppPage(this.page)
        this.pageNavigation = new PageNavigation(this.page)
        this.questionEditPage = new QuestionEditPage(this.page)
        this.robinSheetPage = new RobinSheetPage(this.page)
        this.workspaceCreatePage = new WorkspaceCreatePage(this.page)
        this.takeQuestionPage = new TakeQuestionPage(this.page)
        this.takePollPage = new TakePollPage(this.page)
        this.questionPage = new QuestionPage(this.page)
        this.quizWelcomePage = new QuizWelcomePage(this.page)
        this.quizSharePage = new QuizSharePage(this.page)
        this.quizStatsPage = new QuizStatsPage(this.page)
        this.epicBattlePage = new EpicBattlePage(this.page)
        this.pollResultsPage = new PollResultsPage(this.page)
        this.pollFormPage = new PollFormPage(this.page)
        this.quizScorePage = new QuizScorePage(this.page)
        this.workspacePage = new WorkspacePage(this.page)
        this.quizCreatePage = new QuizCreatePage(this.page)
        this.quizNicknamePage = new QuizNicknamePage(this.page)
        this.homePage = new HomePage(this.page)
    }

    readonly appPage: AppPage
    readonly pageNavigation: PageNavigation
    readonly questionEditPage: QuestionEditPage
    readonly robinSheetPage: RobinSheetPage
    readonly workspaceCreatePage: WorkspaceCreatePage
    readonly takeQuestionPage: TakeQuestionPage
    readonly takePollPage: TakePollPage
    readonly questionPage: QuestionPage
    readonly quizWelcomePage: QuizWelcomePage
    readonly quizSharePage: QuizSharePage
    readonly quizStatsPage: QuizStatsPage
    readonly epicBattlePage: EpicBattlePage
    readonly pollResultsPage: PollResultsPage
    readonly pollFormPage: PollFormPage
    readonly quizScorePage: QuizScorePage
    readonly workspacePage: WorkspacePage
    readonly quizCreatePage: QuizCreatePage

    readonly quizNicknamePage: QuizNicknamePage
    readonly homePage: HomePage

    workspaceGuid = ''

    questionWip: QuestionSpec | undefined = undefined
    questionBookmarks: Record<string, QuestionSpec> = {}
    questionIds: Record<string, number> = {}
    activeQuestionBookmark = ''
    get activeQuestion() {
        return this.questionBookmarks[this.activeQuestionBookmark]
    }

    updateQuestionWip(patch: Partial<QuestionSpec>) {
        if (!this.questionWip) throw new Error('No question WIP active')
        Object.assign(this.questionWip, patch)
    }

    updateAnswerWip(index: number, patch: Partial<AnswerSpec>) {
        if (!this.questionWip) throw new Error('No question WIP active')
        this.questionWip.answers[index] = { ...this.questionWip.answers[index], ...patch }
    }

    bookmarkQuestion(key: string, question: QuestionSpec) {
        if (this.questionBookmarks[key] !== undefined) {
            throw new Error(`Duplicate question bookmark: "${key}"`)
        }
        this.questionBookmarks[key] = question
        this.activeQuestionBookmark = key
    }

    quizBookmarks: Record<string, string> = {}
    activeQuizBookmark = ''

    bookmarkQuiz(key: string, bookmark: string) {
        if (this.quizBookmarks[key] !== undefined) {
            throw new Error(`Duplicate quiz bookmark: "${key}"`)
        }
        this.quizBookmarks[key] = bookmark
        this.activeQuizBookmark = key
    }
    correctAnswersCounts: Record<string, string> = {}
    pollWip: PollSpec | undefined = undefined
    pollBookmarks: Record<string, PollSpec> = {}
    pollIds: Record<string, number> = {}
    activePollBookmark = ''
    get activePoll() {
        return this.pollBookmarks[this.activePollBookmark]
    }

    bookmarkPoll(key: string, poll: PollSpec) {
        if (this.pollBookmarks[key] !== undefined) {
            throw new Error(`Duplicate poll bookmark: "${key}"`)
        }
        this.pollBookmarks[key] = poll
        this.activePollBookmark = key
    }

    clockInstalled = false
    scenarioClockNow?: Date
    lastAnsweredTitle?: string
    rememberedWorkspaceQuestionCount?: number
    rememberedCohortLink = ''
    lastClickedInQuizQuestion = ''
    delayedFlagSave?: DelayedFlagSave
    participantAttempt?: {
        quizId: number
        attemptId: number
        questions: readonly { readonly id: number }[]
        nextQuestionIndex: number
    }
    nextParticipantNumber = 0

    parseAnswers(answersString: string) {
        return answersString.split(',').map(answer => answer.trim())
    }
}
