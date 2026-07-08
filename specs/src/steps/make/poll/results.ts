import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { Given, Then, When } from '#steps/fixture.ts'
import {
    createWorkspacePoll,
    openPollResults,
    seedPollVotes,
    setPollAnswerImage,
    type PollVoteSeed,
} from '#steps/make/poll/ops.ts'
import { createWorkspace } from '#steps/make/workspace/ops.ts'

const parseVoteSeed = (data: DataTable): PollVoteSeed[] =>
    data.hashes().map(row => {
        const count = Number.parseInt(`${row.count}`, 10)
        if (!Number.isInteger(count) || count < 0) {
            throw new Error(`Invalid vote count "${row.count}" for answer "${row.answer}"`)
        }
        return {
            answer: `${row.answer}`,
            count,
        }
    })

Given('workspace {string} with polls', async function (name: string, data: DataTable) {
    await createWorkspace(this, name)

    for (const row of data.hashes()) {
        await createWorkspacePoll(this, {
            bookmark: `${row.poll}`,
            question: `${row.question}`,
            answers: this.parseAnswers(`${row.answers}`),
        })
    }

    await this.page.goto(`/workspace/${this.workspaceGuid}`)
})

Given('poll {string} has votes', async function (pollBookmark: string, data: DataTable) {
    await seedPollVotes(this, pollBookmark, parseVoteSeed(data))
})

Given(
    'poll {string} answer {int} has image {string}',
    async function (pollBookmark: string, answerNumber: number, imageUrl: string) {
        await setPollAnswerImage(this, pollBookmark, answerNumber - 1, imageUrl)
    },
)

When('poll {string} receives votes', async function (pollBookmark: string, data: DataTable) {
    await seedPollVotes(this, pollBookmark, parseVoteSeed(data))
})

When('I open poll {string} results', async function (pollBookmark: string) {
    await openPollResults(this, pollBookmark)
})

Then('I see poll results question {string}', async function (question: string) {
    await this.pollResultsPage.expectQuestionText(question)
})

Then('I see the poll take QR code', async function () {
    await this.pollResultsPage.expectTakeQrVisible()
})

Then('the poll QR code value matches the poll take link', async function () {
    const pollId = this.pollIds[this.activePollBookmark]
    const qrValue = await this.pollResultsPage.takeQrValue()

    expect(qrValue).toBe(await this.pollResultsPage.takeLink())
    expect(qrValue.endsWith(`/poll/${pollId}`)).toBe(true)
})

Then('I see poll {string} results', async function (_pollBookmark: string, data: DataTable) {
    const rows = data.hashes()
    await this.pollResultsPage.expectResultRowCount(rows.length)
    for (const row of rows) {
        await this.pollResultsPage.expectVoteCount(`${row.answer}`, `${row.votes}`)
    }
})
