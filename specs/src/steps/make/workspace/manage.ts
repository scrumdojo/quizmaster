import { When, Then } from '#steps/fixture.ts'

// ── Navigation ──────────────────────────────────────────

Then('I am at the top of the page', async function () {
    await this.workspacePage.expectScrolledToTop()
})

When('I open the workspace', async function () {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.waitForUrl(this.workspaceGuid)
})

// ── Tabs ────────────────────────────────────────────────

Then('I see the {string} tab', async function (name: string) {
    await this.workspacePage.expectTabVisible(name)
})

Then('the {string} tab is open by default', async function (name: string) {
    await this.workspacePage.expectTabSelected(name)
})

When('I click the {string} tab', async function (name: string) {
    await this.workspacePage.clickTab(name)
})

Then('the {string} tab is open', async function (name: string) {
    await this.workspacePage.expectTabSelected(name)
})

Then('the {string} tab is closed', async function (name: string) {
    await this.workspacePage.expectTabNotSelected(name)
})

When('I click the quiz create button', async function () {
    await this.workspacePage.clickQuizCreateButton()
})

Then('I see the message {string}', async function (message: string) {
    await this.workspacePage.expectInfoMessage(message)
})

Then('I see the {string} section', async function (section: string) {
    await this.workspacePage.expectSectionVisible(section)
})

Then('I do not see the {string} section', async function (section: string) {
    await this.workspacePage.expectSectionHidden(section)
})

Then('I see the quiz create button inside the {string} section', async function (section: string) {
    await this.workspacePage.expectQuizCreateButtonInSection(section)
})

Then('I do not see the quiz create button', async function () {
    await this.workspacePage.expectQuizCreateButtonHidden()
})

Then('I see the question create button inside the {string} section', async function (section: string) {
    await this.workspacePage.expectQuestionCreateButtonInSection(section)
})

Then('I do not see the question create button', async function () {
    await this.workspacePage.expectQuestionCreateButtonHidden()
})

// ── Workspace page assertions ───────────────────────────

Then('I see the workspace {string}', async function (name: string) {
    await this.workspacePage.expectWorkspaceName(name)
})

Then('I see an empty workspace', async function () {
    await this.workspacePage.expectQuestionCount(0)
})

Then('I see workspace question count {int}', async function (count: number) {
    await this.workspacePage.expectWorkspaceQuestionSummaryCount(count)
})

When('I remember workspace question count', async function () {
    this.rememberedWorkspaceQuestionCount = await this.workspacePage.workspaceQuestionSummaryCount()
})

Then('workspace question count increased by {int}', async function (addedCount: number) {
    const previousCount = this.rememberedWorkspaceQuestionCount
    if (previousCount === undefined) {
        throw new Error('Cannot compare workspace question count: no previous count was remembered.')
    }
    await this.workspacePage.expectWorkspaceQuestionSummaryCount(previousCount + addedCount)
})

Then('I see workspace quiz count {int}', async function (count: number) {
    await this.workspacePage.expectWorkspaceQuizSummaryCount(count)
})

// ── Question used-in-quiz badge ─────────────────────────

Then('I see question {string} marked as used', async function (question: string) {
    await this.workspacePage.expectQuestionMarkedAsUsed(question)
})

Then('I do not see question {string} marked as used', async function (question: string) {
    await this.workspacePage.expectQuestionNotMarkedAsUsed(question)
})

// ── Question management ─────────────────────────────────

Then('the question is saved in the workspace', async function () {
    await this.workspacePage.expectHasQuestions()
})

Then('I see question in list {string}', async function (question: string) {
    await this.workspacePage.expectQuestionVisible(question)
})

Then('I do not see question {string} in the list', async function (question: string) {
    await this.workspacePage.expectQuestionNotVisible(question)
})

Then('I see tag badge {string} for question {string}', async function (tag: string, question: string) {
    await this.workspacePage.expectQuestionTagBadge(question, tag)
})

Then('I do not see tag badge for question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionTagBadgeNotVisible(question)
})

Then('I see "In Quiz" tag on question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionInQuizTag(question)
})

Then('the "In Quiz" tag on question {string} uses button styling', async function (question: string) {
    await this.workspacePage.expectQuestionInQuizTagButtonStyle(question)
})

Then('I do not see "In Quiz" tag on question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionInQuizTagAbsent(question)
})

Then('I see image thumbnail for question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionThumbnailVisible(question)
})

Then('I do not see image thumbnail for question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionThumbnailNotVisible(question)
})

Then('I see the image preview inside the title row for question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionImageInTitleRow(question)
})

Then('I do not see an image preview inside the title row for question {string}', async function (question: string) {
    await this.workspacePage.expectQuestionImageNotInTitleRow(question)
})

When('I take question {string} from the list', async function (question: string) {
    this.activeQuestionBookmark = question
    await this.workspacePage.takeQuestion(question)
})

When('I edit question {string} from the list', async function (question: string) {
    this.questionWip = this.questionBookmarks[question]
    this.activeQuestionBookmark = question
    await this.workspacePage.editQuestion(question)
})

When('I edit the AI-generated question from the workspace', async function () {
    await this.workspacePage.editFirstQuestion()
})

When('I edit one of the AI-generated questions from the workspace', async function () {
    await this.workspacePage.editFirstQuestion()
})

When('I delete question {string} from the list', async function (question: string) {
    this.activeQuestionBookmark = question
    await this.workspacePage.deleteQuestion(question)
})

Then('I cannot delete question {string}', async function (question: string) {
    await this.workspacePage.expectDeleteButtonNotVisible(question)
})

// ── Quiz management ─────────────────────────────────────

Then('I see the quiz {string} in the workspace', async function (quizName: string) {
    await this.workspacePage.expectQuizVisible(quizName)
})

Then('I do not see quiz {string} in the workspace', async function (quizName: string) {
    await this.workspacePage.expectQuizNotVisible(quizName)
})

// ── Quiz action button assertions ───────────────────────

Then('I see "Share" button for quiz {string}', async function (quiz: string) {
    await this.workspacePage.expectQuizShareButtonVisible(quiz)
})

Then('I see "Actions" button for quiz {string}', async function (quiz: string) {
    await this.workspacePage.expectQuizActionsButtonVisible(quiz)
})

Then('"Edit" is hidden for quiz {string}', async function (quiz: string) {
    await this.workspacePage.expectQuizEditHidden(quiz)
})

Then('the "Actions" button is collapsed for quiz {string}', async function (quiz: string) {
    await this.workspacePage.expectQuizActionsCollapsed(quiz)
})

When('I open the quiz actions for {string}', async function (quiz: string) {
    await this.workspacePage.openActionsDropdown(quiz)
})

Then('the "Actions" button is expanded for quiz {string}', async function (quiz: string) {
    await this.workspacePage.expectQuizActionsExpanded(quiz)
})

Then('"Edit" is visible in the quiz actions for {string}', async function (quiz: string) {
    await this.workspacePage.expectQuizEditVisible(quiz)
})

Then('I see quiz {string} with order number {int}', async function (quizName: string, order: number) {
    await this.workspacePage.expectQuizOrderNumber(quizName, order)
})

Then('I see question {string} with order number {int}', async function (question: string, order: number) {
    await this.workspacePage.expectQuestionOrderNumber(question, order)
})

Then('I see {int} quiz(zes) on the page', async function (count: number) {
    await this.workspacePage.expectQuizCount(count)
})

Then('I see quiz page link {int}', async function (pageNum: number) {
    await this.workspacePage.expectQuizPageLinkVisible(pageNum)
})

Then('I do not see quiz page links', async function () {
    await this.workspacePage.expectQuizPageLinksHidden()
})

When('I go to quiz page {int}', async function (pageNum: number) {
    await this.workspacePage.goToQuizPage(pageNum)
})

Then('I see quizzes in order: {string}, {string}, {string}', async function (a: string, b: string, c: string) {
    await this.workspacePage.expectQuizzesInOrder([a, b, c])
})

Then('I see questions in order: {string}, {string}, {string}', async function (a: string, b: string, c: string) {
    await this.workspacePage.expectQuestionsInOrder([a, b, c])
})

Then('I see {int} question(s) on the page', async function (count: number) {
    await this.workspacePage.expectQuestionCount(count)
})

Then('I see question page link {int}', async function (pageNum: number) {
    await this.workspacePage.expectQuestionPageLinkVisible(pageNum)
})

Then('I do not see question page links', async function () {
    await this.workspacePage.expectQuestionPageLinksHidden()
})

When('I go to question page {int}', async function (pageNum: number) {
    await this.workspacePage.goToQuestionPage(pageNum)
})

Then('I take quiz {string}', async function (quiz: string) {
    await this.workspacePage.takeQuiz(quiz)
})

When('I delete quiz {string} from the workspace', async function (quizName: string) {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.deleteQuiz(quizName)
})

When('I confirm the deletion', async function () {
    await this.workspacePage.confirmDeletion()
})

When('I cancel the deletion', async function () {
    await this.workspacePage.cancelDeletion()
})

When('I open quiz {string} statistics', async function (quizName: string) {
    await this.workspacePage.goto(this.workspaceGuid)
    await this.workspacePage.statsQuiz(quizName)
    await this.quizStatsPage.expectPageHeading(`Statistics for quiz: ${quizName}`)
})
