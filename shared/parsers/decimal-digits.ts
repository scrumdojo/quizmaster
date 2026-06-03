// Counts the number of digits after the decimal point in a numerical answer.
// Backend mirror: cz.scrumdojo.quizmaster.question.QuestionTakeResponse#requiredDecimalDigits
// — keep the two implementations in lockstep.
export const countDecimalDigits = (answer: string): number => {
    const dotIndex = answer.indexOf('.')
    if (dotIndex === -1) return 0
    return Math.max(0, answer.length - dotIndex - 1)
}
