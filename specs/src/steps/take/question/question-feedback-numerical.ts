import type { DataTable } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import { expectTextToBe } from '#steps/common.ts'
import { Then, When } from '#steps/fixture.ts'

const countDecimalDigits = (value: string): number => {
    const [, decimals] = value.split('.')
    return decimals?.length ?? 0
}

Then('I see a number input', async function () {
    await expect(this.takeQuestionPage.numericalInputLocator()).toBeVisible()
})

Then(/^I see hint to enter answer with (\d+) decimal digits$/, async function (digitsRaw: string) {
    const expectedDigitsFromStep = Number.parseInt(digitsRaw, 10)
    const question = this.activeQuestion
    if (!question?.numericalAnswer) {
        throw new Error('Active question is not numerical — cannot verify decimal hint.')
    }

    const expectedDigitsFromAnswer = countDecimalDigits(question.numericalAnswer)
    if (expectedDigitsFromStep !== expectedDigitsFromAnswer) {
        throw new Error(
            `Invalid step data: expected ${expectedDigitsFromAnswer} decimal digits from correct answer, got ${expectedDigitsFromStep}.`,
        )
    }

    await this.takeQuestionPage.expectNumericalAnswerDigitsHint(expectedDigitsFromAnswer)
})

Then('I do not see a decimal digits hint', async function () {
    await this.takeQuestionPage.expectNoNumericalAnswerDigitsHint()
})

When('I enter {string}', async function (answer: string) {
    await this.takeQuestionPage.fillNumericalAnswer(answer)
})

When('I retake with answers:', async function (data: DataTable) {
    for (const { answer, feedback } of data.hashes()) {
        await this.takeQuestionPage.fillNumericalInput(answer)
        await this.takeQuestionPage.expectNoQuestionFeedback()
        await this.takeQuestionPage.submit()
        await expectTextToBe(this.takeQuestionPage.questionFeedbackLocator(), feedback)
    }
})
