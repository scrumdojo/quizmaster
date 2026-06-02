import { expect, type Page } from '@playwright/test'

export class WorkspacePage {
    constructor(private page: Page) {}

    // ── Navigation ───────────────────────────────────

    goto = (guid: string) => this.page.goto(`/workspace/${guid}`, { waitUntil: 'networkidle' })
    waitForUrl = (guid: string) => this.page.waitForURL(`**/workspace/${guid}`)

    expectScrolledToTop = () => this.page.waitForFunction('scrollY === 0', { timeout: 5000 })

    // ── Workspace name ───────────────────────────────

    private workspaceNameLocator = () => this.page.getByTestId('workspace-title')

    expectWorkspaceName = (name: string) => expect(this.workspaceNameLocator()).toHaveText(name)

    // ── Tabs ─────────────────────────────────────────

    private tabLocator = (name: string) => this.page.getByRole('tab', { name })

    expectTabVisible = (name: string) => expect(this.tabLocator(name)).toBeVisible()

    expectTabSelected = (name: string) => expect(this.page.getByRole('tab', { name, selected: true })).toBeVisible()

    expectTabNotSelected = (name: string) => expect(this.page.getByRole('tab', { name, selected: false })).toBeVisible()

    clickTab = (name: string) => this.tabLocator(name).click()

    // Content is gated by the active tab, so interactions activate the right
    // section first. We dispatch the click rather than .click() because an open
    // overlay (e.g. the Robin AI chat sheet docked over the page) can cover the
    // tab bar and block a real click; dispatchEvent flips the tab regardless.
    // The real tab-click UX is covered by the Workspace.Tabs scenarios.
    private showQuestions = () => this.tabLocator('Questions').dispatchEvent('click')
    private showQuizzes = () => this.tabLocator('Quizzes').dispatchEvent('click')

    // ── Section visibility (asserts the gating; does NOT switch tabs) ──

    private sectionLocator = (name: string) => this.page.locator(`.workspace-section--${name.toLowerCase()}`)
    expectSectionVisible = (name: string) => expect(this.sectionLocator(name)).toBeVisible()
    expectSectionHidden = (name: string) => expect(this.sectionLocator(name)).toBeHidden()

    // ── Workspace summary (header — not gated) ───────

    private workspaceSummaryStatLocator = (index: number) => this.page.locator('.workspace-header__stat').nth(index)

    expectWorkspaceQuestionSummaryCount = async (count: number) => {
        const stat = this.workspaceSummaryStatLocator(0)
        await expect(stat.locator('strong')).toHaveText(String(count))
        await expect(stat.locator('span')).toHaveText(count === 1 ? 'question' : 'questions')
    }

    workspaceQuestionSummaryCount = async (): Promise<number> => {
        const value = (await this.workspaceSummaryStatLocator(0).locator('strong').textContent())?.trim() ?? '0'
        return Number.parseInt(value, 10)
    }

    expectWorkspaceQuizSummaryCount = async (count: number) => {
        const stat = this.workspaceSummaryStatLocator(1)
        await expect(stat.locator('strong')).toHaveText(String(count))
        await expect(stat.locator('span')).toHaveText(count === 1 ? 'quiz' : 'quizzes')
    }

    // ── Question list (gated → activate Questions tab first) ──

    private questionsLocator = () => this.page.locator('.question-item')
    private questionLocator = (question: string) => this.questionsLocator().filter({ hasText: question })

    expectQuestionCount = async (count: number) => {
        await this.showQuestions()
        await expect(this.questionsLocator()).toHaveCount(count)
    }
    expectHasQuestions = async () => {
        await this.showQuestions()
        await expect(this.questionsLocator().first()).toBeVisible()
    }
    expectQuestionVisible = async (question: string) => {
        await this.showQuestions()
        await expect(this.questionLocator(question)).toBeVisible()
    }
    expectQuestionNotVisible = async (question: string) => {
        await this.showQuestions()
        await expect(this.questionLocator(question)).not.toBeVisible()
    }

    // ── Question actions ─────────────────────────────

    takeQuestion = async (question: string) => {
        await this.showQuestions()
        await this.questionLocator(question).getByRole('link', { name: 'Take' }).click()
    }
    editQuestion = async (question: string) => {
        await this.showQuestions()
        await this.questionLocator(question).getByRole('link', { name: 'Edit' }).click()
    }
    editFirstQuestion = async () => {
        await this.showQuestions()
        await this.questionsLocator().first().getByRole('link', { name: 'Edit' }).click()
    }

    private deleteButtonLocator = (question: string) =>
        this.questionLocator(question).getByRole('button', { name: 'Delete' })
    deleteQuestion = async (question: string) => {
        await this.showQuestions()
        await this.deleteButtonLocator(question).click()
        await this.questionLocator(question).waitFor({ state: 'hidden' })
    }
    expectDeleteButtonNotVisible = async (question: string) => {
        await this.showQuestions()
        await expect(this.deleteButtonLocator(question)).not.toBeVisible()
    }

    // ── Question thumbnail ───────────────────────────

    private questionThumbnailLocator = (question: string) =>
        this.questionLocator(question).locator('img.question-thumbnail')
    expectQuestionThumbnailVisible = async (question: string) => {
        await this.showQuestions()
        await expect(this.questionThumbnailLocator(question)).toBeVisible()
    }
    expectQuestionThumbnailNotVisible = async (question: string) => {
        await this.showQuestions()
        await expect(this.questionThumbnailLocator(question)).not.toBeVisible()
    }

    // ── Question tag badge ───────────────────────────

    private questionTagBadgeLocator = (question: string) =>
        this.questionLocator(question).locator('.question-tag-badge')
    expectQuestionTagBadge = async (question: string, tag: string) => {
        await this.showQuestions()
        await expect(this.questionTagBadgeLocator(question)).toHaveText(tag)
    }
    expectQuestionTagBadgeNotVisible = async (question: string) => {
        await this.showQuestions()
        await expect(this.questionTagBadgeLocator(question)).not.toBeVisible()
    }

    // ── Create new question / quiz ───────────────────

    createNewQuestion = async () => {
        await this.showQuestions()
        await this.page.locator('#create-question').click()
    }
    createNewQuiz = async () => {
        await this.showQuizzes()
        await this.page.locator('#create-quiz').click()
    }

    expectQuizCreateButtonInSection = (section: string) =>
        expect(this.sectionLocator(section).locator('#create-quiz')).toBeVisible()
    expectQuizCreateButtonHidden = () => expect(this.page.locator('#create-quiz')).toBeHidden()

    expectQuestionCreateButtonInSection = (section: string) =>
        expect(this.sectionLocator(section).locator('#create-question')).toBeVisible()
    expectQuestionCreateButtonHidden = () => expect(this.page.locator('#create-question')).toBeHidden()

    // ── Quiz list (gated → activate Quizzes tab first) ──

    private quizLocator = (quiz: string) => this.page.locator('.quiz-item').filter({ hasText: quiz })

    takeQuiz = async (quiz: string) => {
        await this.showQuizzes()
        await this.quizLocator(quiz).getByRole('link', { name: 'Take' }).click()
    }
    editQuiz = async (quiz: string) => {
        await this.showQuizzes()
        await this.quizLocator(quiz).getByRole('link', { name: 'Edit' }).click()
    }
    shareQuiz = async (quiz: string) => {
        await this.showQuizzes()
        await this.quizLocator(quiz).getByRole('link', { name: 'Share' }).click()
        await this.page.locator('#share-page').waitFor({ state: 'visible' })
    }
    statsQuiz = async (quiz: string) => {
        await this.showQuizzes()
        await this.quizLocator(quiz).getByRole('link', { name: 'Statistics' }).click()
    }
    dryRunQuiz = async (quiz: string) => {
        await this.showQuizzes()
        await this.quizLocator(quiz).getByRole('link', { name: 'Dry run' }).click()
    }

    deleteQuiz = async (quiz: string) => {
        await this.showQuizzes()
        await this.quizLocator(quiz).getByRole('button', { name: 'Delete' }).click()
    }
    confirmDeletion = () => this.page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click()
    cancelDeletion = () => this.page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click()

    expectQuizVisible = async (quiz: string) => {
        await this.showQuizzes()
        await expect(this.quizLocator(quiz)).toBeVisible()
    }
    expectQuizNotVisible = async (quiz: string) => {
        await this.showQuizzes()
        await expect(this.quizLocator(quiz)).not.toBeVisible()
    }

    expectQuizOrderNumber = async (quiz: string, order: number) => {
        await this.showQuizzes()
        await expect(this.quizLocator(quiz).locator('.question-index')).toHaveText(`#${order}`)
    }

    // ── Quiz pagination ──────────────────────────────

    private quizPaginationLocator = () => this.page.locator('.quiz-pagination')
    private quizPageLinkLocator = (pageNum: number) =>
        this.page.locator('.quiz-pagination').getByRole('button', { name: `Page ${pageNum}` })

    expectQuizCount = async (count: number) => {
        await this.showQuizzes()
        await expect(this.page.locator('.quiz-item')).toHaveCount(count)
    }

    expectQuizPageLinkVisible = async (pageNum: number) => {
        await this.showQuizzes()
        await expect(this.quizPageLinkLocator(pageNum)).toBeVisible()
    }

    expectQuizPageLinksHidden = async () => {
        await this.showQuizzes()
        await expect(this.quizPaginationLocator()).toBeHidden()
    }

    goToQuizPage = async (pageNum: number) => {
        await this.showQuizzes()
        await this.quizPageLinkLocator(pageNum).click()
    }

    expectQuizzesInOrder = async (titles: string[]) => {
        await this.showQuizzes()
        const items = this.page.locator('.quiz-item')
        await expect(items).toHaveCount(titles.length)
        for (let i = 0; i < titles.length; i++) {
            await expect(items.nth(i)).toContainText(titles[i])
        }
    }

    // ── Question pagination ──────────────────────────

    private questionPaginationLocator = () => this.page.locator('.question-pagination')
    private questionPageLinkLocator = (pageNum: number) =>
        this.page.locator('.question-pagination').getByRole('button', { name: `Page ${pageNum}` })

    expectQuestionPageLinkVisible = async (pageNum: number) => {
        await this.showQuestions()
        await expect(this.questionPageLinkLocator(pageNum)).toBeVisible()
    }

    expectQuestionPageLinksHidden = async () => {
        await this.showQuestions()
        await expect(this.questionPaginationLocator()).toBeHidden()
    }

    goToQuestionPage = async (pageNum: number) => {
        await this.showQuestions()
        await this.questionPageLinkLocator(pageNum).click()
    }

    expectQuestionOrderNumber = async (question: string, order: number) => {
        await this.showQuestions()
        await expect(this.questionLocator(question).locator('.question-index')).toHaveText(`Q${order}.`)
    }

    expectQuestionsInOrder = async (titles: string[]) => {
        await this.showQuestions()
        const items = this.page.locator('.question-item')
        await expect(items).toHaveCount(titles.length)
        for (let i = 0; i < titles.length; i++) {
            await expect(items.nth(i)).toContainText(titles[i])
        }
    }

    enterQuestionFilterString = (filter: string) => this.page.locator('#ws-question-filter').fill(filter)
    getQuestion = (question: string) => this.page.locator('label', { hasText: question })
}
