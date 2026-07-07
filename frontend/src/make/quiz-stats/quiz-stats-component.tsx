import type { ReactNode } from 'react'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import type {
    AttemptStatsRecord,
    QuestionStatsRecord,
    QuizStatsResponse,
    SummaryStats,
    TagStatsRecord,
} from '#fe/make/model/stats.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'

import { formatDuration } from './duration.ts'
import './quiz-stats-component.scss'
import { StatsTable } from './stats-table.tsx'
export interface QuizStatsProps {
    readonly quiz: Quiz
    readonly stats: QuizStatsResponse
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
const attemptRow = (attempt: AttemptStatsRecord, statusLabels: Record<string, string>): string[] => {
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
const HIGH_ACCURACY_THRESHOLD = 0.75
const MID_ACCURACY_THRESHOLD = 0.5
type AccuracyBand = 'high' | 'mid' | 'low'
const accuracyBand = (ratio: number): AccuracyBand =>
    ratio >= HIGH_ACCURACY_THRESHOLD ? 'high' : ratio >= MID_ACCURACY_THRESHOLD ? 'mid' : 'low'
const accuracyPill = (correctAnswers: number, answered: number): ReactNode => {
    const ratio = answered > 0 ? correctAnswers / answered : 0
    return (
        <span className="accuracy-pill" data-band={accuracyBand(ratio)}>
            {Math.round(ratio * 100)}%
        </span>
    )
}
const questionRow = (question: QuestionStatsRecord): ReactNode[] => [
    question.question,
    String(question.answered),
    accuracyPill(question.correctAnswers, question.answered),
    pct(question.partiallyCorrectAnswers, question.answered),
    pct(question.incorrectAnswers, question.answered),
    String(question.unanswered),
    pct(question.flagged, question.answered + question.unanswered),
]
const tagRow = (tag: TagStatsRecord): ReactNode[] => [
    tag.tag,
    String(tag.questions),
    String(tag.answered),
    accuracyPill(tag.correctAnswers, tag.answered),
    pct(tag.partiallyCorrectAnswers, tag.answered),
    pct(tag.incorrectAnswers, tag.answered),
    String(tag.unanswered),
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
    flagged: 0,
})
const resolveQuestionStats = (quiz: Quiz, stats: QuizStatsResponse): readonly QuestionStatsRecord[] => {
    const backendQuestionStats = stats.questionStatistics ?? stats.questions ?? stats.questionStats ?? []
    if (backendQuestionStats.length > 0) {
        return backendQuestionStats
    }
    return quiz.questions.map(question => emptyQuestionStats(question.question))
}
export const QuizStats = ({ quiz, stats }: QuizStatsProps) => {
    const { t } = useLanguage()
    const statusLabels: Record<string, string> = {
        FINISHED: t.quiz.statusFinished,
        IN_PROGRESS: t.quiz.statusInProgress,
        TIMEOUT: t.quiz.statusTimeout,
        ABANDONED: t.quiz.statusAbandoned,
    }
    const questions = resolveQuestionStats(quiz, stats)
    const tags = stats.tagStatistics ?? []
    const completionRate = rate(stats.summary.finished, stats.summary.started)
    const highlights: { label: string; value: string; detail: string }[] = [
        {
            label: t.quiz.startedAttemptsLabel,
            value: String(stats.summary.started),
            detail: t.quiz.startedAttemptsDetail(stats.summary.finished),
        },
        {
            label: t.quiz.completionRateLabel,
            value: completionRate,
            detail: t.quiz.completionRateDetail(stats.summary.unfinished),
        },
        {
            label: t.quiz.questionsInQuizLabel,
            value: String(quiz.questions.length),
            detail: t.quiz.questionsInQuizDetail(questions.length),
        },
        {
            label: t.quiz.averageDurationLabel,
            value: averageDuration(stats.attempts),
            detail:
                stats.attempts.length === 0
                    ? t.quiz.averageDurationDetailNone
                    : t.quiz.averageDurationDetail(stats.attempts.length),
        },
    ]
    return (
        <div className="quiz-stats">
            <section className="quiz-stats__hero">
                <div>
                    <div className="quiz-stats__eyebrow">{t.quiz.statsEyebrow}</div>
                    <h2>{t.quiz.statsHeading(quiz.title)}</h2>
                    <p>{t.quiz.statsIntro}</p>
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
                        <p className="quiz-stats__section-kicker">{t.quiz.overviewKicker}</p>
                        <h3>{t.quiz.attemptSummaryTitle}</h3>
                    </div>
                    <p>{t.quiz.attemptSummaryIntro}</p>
                </div>
                <StatsTable
                    testId="summary-stats-table"
                    caption={t.quiz.captionSummary}
                    columns={[
                        t.quiz.colStarted,
                        t.quiz.colFinished,
                        { label: t.quiz.colUnfinished, tooltip: t.quiz.colUnfinishedTooltip },
                        t.quiz.colTimeout,
                    ]}
                    rows={[summaryRow(stats.summary)]}
                />
            </section>
            <section className="quiz-stats__section">
                <div className="quiz-stats__section-header">
                    <div>
                        <p className="quiz-stats__section-kicker">{t.quiz.attemptsKicker}</p>
                        <h3>{t.quiz.performanceByRunTitle}</h3>
                    </div>
                    <p>{t.quiz.performanceByRunIntro}</p>
                </div>
                <StatsTable
                    testId="attempt-stats-table"
                    caption={t.quiz.attemptsKicker}
                    columns={[
                        t.quiz.colDuration,
                        { label: t.quiz.colPoints, tooltip: t.quiz.colPointsTooltip },
                        t.quiz.colCorrectAnswers,
                        t.quiz.colIncorrectAnswers,
                        { label: t.quiz.colScore, tooltip: t.quiz.colScoreTooltip },
                        t.quiz.colStatus,
                        { label: t.quiz.colPartiallyCorrectAnswers, tooltip: t.quiz.colPartiallyCorrectTooltip },
                    ]}
                    rows={stats.attempts.map(attempt => attemptRow(attempt, statusLabels))}
                />
                {stats.attempts.length === 0 && <div className="quiz-stats__empty">{t.quiz.noAttemptsYet}</div>}
            </section>
            {tags.length > 0 && (
                <section className="quiz-stats__section">
                    <div className="quiz-stats__section-header">
                        <div>
                            <p className="quiz-stats__section-kicker">{t.quiz.categoriesKicker}</p>
                            <h3>{t.quiz.performanceByTagTitle}</h3>
                        </div>
                        <p>{t.quiz.performanceByTagIntro}</p>
                    </div>
                    <StatsTable
                        testId="tag-stats-table"
                        caption={t.quiz.captionTags}
                        columns={[
                            t.quiz.colTag,
                            { label: t.quiz.questionsKicker, tooltip: t.quiz.colQuestionsTooltip },
                            t.quiz.colAnswered,
                            t.quiz.colCorrect,
                            { label: t.quiz.colPartiallyCorrect, tooltip: t.quiz.colPartiallyCorrectTooltip },
                            t.quiz.colIncorrect,
                            { label: t.quiz.colUnanswered, tooltip: t.quiz.colUnansweredTooltip },
                        ]}
                        rows={tags.map(tagRow)}
                    />
                </section>
            )}
            {questions.length > 0 && (
                <section className="quiz-stats__section">
                    <div className="quiz-stats__section-header">
                        <div>
                            <p className="quiz-stats__section-kicker">{t.quiz.questionsKicker}</p>
                            <h3>{t.quiz.questionLevelBreakdownTitle}</h3>
                        </div>
                        <p>{t.quiz.questionLevelBreakdownIntro}</p>
                    </div>
                    <StatsTable
                        testId="question-stats-table"
                        caption={t.quiz.questionsKicker}
                        columns={[
                            t.quiz.colQuestion,
                            t.quiz.colAnswered,
                            t.quiz.colCorrect,
                            { label: t.quiz.colPartiallyCorrect, tooltip: t.quiz.colPartiallyCorrectTooltip },
                            t.quiz.colIncorrect,
                            { label: t.quiz.colUnanswered, tooltip: t.quiz.colUnansweredTooltip },
                            { label: t.quiz.colFlagged, tooltip: t.quiz.colFlaggedTooltip },
                        ]}
                        rows={questions.map(questionRow)}
                    />
                </section>
            )}
        </div>
    )
}
