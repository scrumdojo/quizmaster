import type { AttemptStatsRecord, QuestionStatsRecord, QuizStatsResponse, SummaryStats } from '#fe/make/model/stats.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'

import { formatDuration } from './duration.ts'
import './quiz-stats-component.scss'
import { StatsTable } from './stats-table.tsx'
export interface QuizStatsProps {
    readonly quiz: Quiz
    readonly stats: QuizStatsResponse
}
const statusLabels: Record<string, string> = {
    FINISHED: 'Finished',
    IN_PROGRESS: 'In Progress',
    TIMEOUT: 'Timeout',
    ABANDONED: 'Abandoned',
}
const pct = (value: number, total: number): string => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
    return `${value} (${percentage}%)`
}
const rate = (value: number, total: number): string => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
    return `${percentage}%`
}
const formatPoints = (earned: number): string => (Number.isInteger(earned) ? String(earned) : earned.toFixed(1))
const summaryRow = (summary: SummaryStats): string[] => [
    String(summary.started),
    String(summary.finished),
    String(summary.unfinished),
    String(summary.timeout),
]
const attemptRow = (attempt: AttemptStatsRecord): string[] => {
    const earnedPoints = attempt.correctAnswers + 0.5 * attempt.partiallyCorrectAnswers
    return [
        attempt.durationSeconds != null ? formatDuration(attempt.durationSeconds) : '',
        `${formatPoints(earnedPoints)}/${attempt.totalQuestions}`,
        pct(attempt.correctAnswers, attempt.totalQuestions),
        pct(attempt.incorrectAnswers, attempt.totalQuestions),
        String(attempt.score),
        statusLabels[attempt.status] ?? attempt.status,
        pct(attempt.partiallyCorrectAnswers, attempt.totalQuestions),
    ]
}
const questionRow = (question: QuestionStatsRecord): string[] => [
    question.question,
    String(question.answered),
    rate(question.correctAnswers, question.answered),
    pct(question.partiallyCorrectAnswers, question.answered),
    pct(question.incorrectAnswers, question.answered),
    String(question.unanswered),
]
const averageDuration = (attempts: readonly AttemptStatsRecord[]): string => {
    const durations = attempts.flatMap(attempt => (attempt.durationSeconds == null ? [] : [attempt.durationSeconds]))
    if (durations.length === 0) {
        return '—'
    }
    const totalSeconds = durations.reduce((sum, duration) => sum + duration, 0)
    return formatDuration(Math.round(totalSeconds / durations.length))
}
const emptyQuestionStats = (question: string): QuestionStatsRecord => ({
    question,
    answered: 0,
    correctAnswers: 0,
    partiallyCorrectAnswers: 0,
    incorrectAnswers: 0,
    unanswered: 0,
})
const resolveQuestionStats = (quiz: Quiz, stats: QuizStatsResponse): readonly QuestionStatsRecord[] => {
    const backendQuestionStats = stats.questionStatistics ?? stats.questions ?? stats.questionStats ?? []
    if (backendQuestionStats.length > 0) {
        return backendQuestionStats
    }
    return quiz.questions.map(question => emptyQuestionStats(question.question))
}
export const QuizStats = ({ quiz, stats }: QuizStatsProps) => {
    const questions = resolveQuestionStats(quiz, stats)
    const completionRate = rate(stats.summary.finished, stats.summary.started)
    const highlights = [
        {
            label: 'Started attempts',
            value: String(stats.summary.started),
            detail: `${stats.summary.finished} finished`,
        },
        {
            label: 'Completion rate',
            value: completionRate,
            detail: `${stats.summary.unfinished} unfinished`,
        },
        {
            label: 'Questions in quiz',
            value: String(quiz.questions.length),
            detail: `${questions.length} tracked in stats`,
        },
        {
            label: 'Average duration',
            value: averageDuration(stats.attempts),
            detail: stats.attempts.length === 0 ? 'No attempts yet' : `Across ${stats.attempts.length} attempts`,
        },
    ]
    return (
        <div className="quiz-stats">
            <section className="quiz-stats__hero">
                <div>
                    <div className="quiz-stats__eyebrow">Quiz analytics</div>
                    <h2>Statistics for quiz: {quiz.title}</h2>
                    <p>
                        Clear overview of participation, completion, and how individual questions perform across all
                        attempts.
                    </p>
                </div>
                <dl className="quiz-stats__highlights">
                    {highlights.map(highlight => (
                        <div key={highlight.label} className="quiz-stats__highlight">
                            <dt>{highlight.label}</dt>
                            <dd>{highlight.value}</dd>
                            <span>{highlight.detail}</span>
                        </div>
                    ))}
                </dl>
            </section>
            <section className="quiz-stats__section">
                <div className="quiz-stats__section-header">
                    <div>
                        <p className="quiz-stats__section-kicker">Overview</p>
                        <h3>Attempt summary</h3>
                    </div>
                    <p>How many runs started, finished, timed out, or are still unfinished.</p>
                </div>
                <StatsTable
                    testId="summary-stats-table"
                    caption="Summary"
                    columns={[
                        'Started',
                        'Finished',
                        { label: 'Unfinished', tooltip: 'Attempts that have not reached a final state.' },
                        'Timeout',
                    ]}
                    rows={[summaryRow(stats.summary)]}
                />
            </section>
            <section className="quiz-stats__section">
                <div className="quiz-stats__section-header">
                    <div>
                        <p className="quiz-stats__section-kicker">Attempts</p>
                        <h3>Performance by run</h3>
                    </div>
                    <p>Duration, points, score, and status for each recorded attempt.</p>
                </div>
                <StatsTable
                    testId="attempt-stats-table"
                    caption="Attempts"
                    columns={[
                        'Duration',
                        {
                            label: 'Points',
                            tooltip: 'Correct answers earn 1 point and partially correct answers earn 0.5 points.',
                        },
                        'Correct Answers',
                        'Incorrect Answers',
                        { label: 'Score', tooltip: 'The final percentage score for the attempt.' },
                        'Status',
                        {
                            label: 'Partially Correct Answers',
                            tooltip: 'A multiple choice answer with exactly one mistake.',
                        },
                    ]}
                    rows={stats.attempts.map(attemptRow)}
                />
                {stats.attempts.length === 0 && (
                    <div className="quiz-stats__empty">
                        No attempts yet. Once someone starts this quiz, detailed run statistics will appear here.
                    </div>
                )}
            </section>
            {questions.length > 0 && (
                <section className="quiz-stats__section">
                    <div className="quiz-stats__section-header">
                        <div>
                            <p className="quiz-stats__section-kicker">Questions</p>
                            <h3>Question-level breakdown</h3>
                        </div>
                        <p>Shows visibility, completion, and answer accuracy for every question in the quiz.</p>
                    </div>
                    <StatsTable
                        testId="question-stats-table"
                        caption="Questions"
                        columns={[
                            'Question',
                            'Answered',
                            'Correct',
                            {
                                label: 'Partially Correct',
                                tooltip: 'A multiple choice answer with exactly one mistake.',
                            },
                            'Incorrect',
                            { label: 'Unanswered', tooltip: 'Questions not answered during the attempt.' },
                        ]}
                        rows={questions.map(questionRow)}
                    />
                </section>
            )}
        </div>
    )
}
