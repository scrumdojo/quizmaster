import type { Page, TestInfo } from '@playwright/test'

import {
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
    TakeQuestionPage,
} from '#pages/index.ts'
import type { AnswerSpec, QuestionSpec } from '#steps/shared/specs.ts'

export class QuizmasterWorld {
    constructor(
        public page: Page,
        public testInfo: TestInfo,
    ) {
        this.pageNavigation = new PageNavigation(this.page)
        this.questionEditPage = new QuestionEditPage(this.page)
        this.robinSheetPage = new RobinSheetPage(this.page)
        this.workspaceCreatePage = new WorkspaceCreatePage(this.page)
        this.takeQuestionPage = new TakeQuestionPage(this.page)
        this.questionPage = new QuestionPage(this.page)
        this.quizWelcomePage = new QuizWelcomePage(this.page)
        this.quizSharePage = new QuizSharePage(this.page)
        this.quizStatsPage = new QuizStatsPage(this.page)
        this.quizScorePage = new QuizScorePage(this.page)
        this.workspacePage = new WorkspacePage(this.page)
        this.quizCreatePage = new QuizCreatePage(this.page)
        this.quizNicknamePage = new QuizNicknamePage(this.page)
        this.homePage = new HomePage(this.page)
    }

    readonly pageNavigation: PageNavigation
    readonly questionEditPage: QuestionEditPage
    readonly robinSheetPage: RobinSheetPage
    readonly workspaceCreatePage: WorkspaceCreatePage
    readonly takeQuestionPage: TakeQuestionPage
    readonly questionPage: QuestionPage
    readonly quizWelcomePage: QuizWelcomePage
    readonly quizSharePage: QuizSharePage
    readonly quizStatsPage: QuizStatsPage
    readonly quizScorePage: QuizScorePage
    readonly workspacePage: WorkspacePage
    readonly quizCreatePage: QuizCreatePage
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
    clockInstalled = false
    scenarioClockNow?: Date
    lastAnsweredTitle?: string
    rememberedAiQuestion = ''
    lastAiAssistantRequest?: {
        question: string
        questionType: string
        excludedQuestionId?: number
    }
    rememberedWorkspaceQuestionCount?: number

    parseAnswers(answersString: string) {
        return answersString.split(',').map(answer => answer.trim())
    }
}
