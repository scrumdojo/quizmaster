import type { DataTable } from '@cucumber/cucumber'

import { Given } from '#steps/fixture.ts'
import { createQuestion } from '#steps/make/question/ops.ts'
import { createWorkspace } from '#steps/make/workspace/ops.ts'
import { createQuestionViaRest, createQuizViaRest } from '#steps/shared/api.ts'
import { parseQuestionRow } from '#steps/shared/parsers.ts'

Given('workspace {string}', async function (name: string) {
    await createWorkspace(this, name)
})

Given('workspace {string} with {int} quizzes', async function (name: string, count: number) {
    await createWorkspace(this, name)

    for (let i = 1; i <= count; i++) {
        await createQuizViaRest(this, this.workspaceGuid, {
            name: `Quiz ${i}`,
            questions: [],
        })
    }

    await this.page.goto(`/workspace/${this.workspaceGuid}`)
})

Given('workspace {string} with {int} questions', async function (name: string, count: number) {
    await createWorkspace(this, name)

    for (let i = 1; i <= count; i++) {
        await createQuestionViaRest(this, this.workspaceGuid, {
            text: `Question ${i}?`,
            answers: [
                { text: 'A', correct: true },
                { text: 'B', correct: false },
            ],
            bookmark: `Q${i}`,
        })
    }

    await this.page.goto(`/workspace/${this.workspaceGuid}`)
})

Given('workspace {string} with questions', async function (name: string, data: DataTable) {
    await createWorkspace(this, name)

    for (const row of data.hashes()) {
        await createQuestion(this, parseQuestionRow(row))
    }

    // Re-load the workspace page so its question/quiz lists reflect REST-inserted data.
    await this.page.goto(`/workspace/${this.workspaceGuid}`)
})

Given('workspace {string} with quizzes', async function (name: string, data: DataTable) {
    await createWorkspace(this, name)

    for (const row of data.hashes()) {
        await createQuizViaRest(this, this.workspaceGuid, {
            name: `${row.quiz}`,
            questions: [],
        })
    }

    // Re-load the workspace page so its question/quiz lists reflect REST-inserted data.
    await this.page.goto(`/workspace/${this.workspaceGuid}`)
})
