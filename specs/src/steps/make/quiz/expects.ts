import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import type { QuizSharePage } from '#pages/index.ts'
import { parseTableData } from '#steps/quiz/expects.ts'

export const expectCohortRowsInOrder = async (sharePage: QuizSharePage, expectedNames: string[]) => {
    expect(await sharePage.cohortRowNames()).toEqual(expectedNames)
}

export const expectUniqueTakeLinks = async (sharePage: QuizSharePage) => {
    const names = await sharePage.cohortRowNames()
    const cohortHrefs = await Promise.all(names.map(name => sharePage.cohortLink(name)))
    const takeHref = await sharePage.takeLink()
    const all = [takeHref, ...cohortHrefs]
    expect(new Set(all).size).toBe(all.length)
}

export const expectShareScreenError = async (sharePage: QuizSharePage, testId: string) => {
    expect(await sharePage.errorTestId()).toBe(testId)
}

export const expectQuizTakeLinkFor = async (sharePage: QuizSharePage, expectedPath: string, origin: string) => {
    const href = await sharePage.takeLink()
    expect(href).toBe(`${origin}${expectedPath}`)
}

export const expectCohortLiveStatsTable = async (sharePage: QuizSharePage, data: DataTable) => {
    const { headerCells, bodyRows } = parseTableData(data)
    await sharePage.expectCohortLiveStatsTable('Cohort live stats', headerCells, bodyRows)
}
