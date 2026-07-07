import './quiz-details.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { Translations } from '#fe/i18n/types.ts'
import { Page } from '#fe/shared'
import type { QuizLeaderboardIndividual, QuizMetadata } from '#fe/shared/model/quiz.ts'
import { StartButton } from '#fe/take/quiz-take/components/buttons.tsx'
import { TakeCard } from '#fe/take/shared/take-card.tsx'

type QuizDisplayFields = Pick<QuizMetadata, 'title' | 'description' | 'timeLimit' | 'passScore' | 'mode'>

export interface QuizDetailsProps {
    readonly quiz: QuizDisplayFields
    readonly questionCount: number
    readonly canStart: boolean
    readonly cohortLeaderboard: readonly {
        rank: number
        cohort: string
        score: number
    }[]
    readonly individualsLeaderboard: readonly QuizLeaderboardIndividual[]
    readonly onStart: () => void
}

const getFeedbackText = (mode: string, t: Translations): string =>
    mode === 'learn' ? t.take.continuousFeedback : t.take.feedbackAtEnd

const rankTone = (rank: number) => {
    if (rank === 1) return 'gold'
    if (rank === 2) return 'silver'
    return 'bronze'
}

export const QuizDetails = ({
    quiz,
    questionCount,
    canStart,
    cohortLeaderboard,
    individualsLeaderboard,
    onStart,
}: QuizDetailsProps) => {
    const { t } = useLanguage()
    return (
        <Page id="quiz-welcome" title={t.take.welcomeToQuizTitle}>
            <TakeCard id="quiz-details" className="quiz-welcome-card">
                <header>
                    <span className="eyebrow">{t.take.quizBadge}</span>
                    <h2 id="quiz-name">{quiz.title}</h2>
                    <p id="quiz-description">{quiz.description}</p>
                </header>
                <div className="details">
                    <div className="detail">
                        <span className="label">{t.take.timeLimitLabel}</span>
                        <span id="time-limit" className="value">
                            {t.take.timeLimitSeconds(quiz.timeLimit)}
                        </span>
                    </div>
                    <div className="detail">
                        <span className="label">{t.take.questionCountLabel}</span>
                        <span id="question-count" className="value">
                            {questionCount}
                        </span>
                    </div>
                    <div className="detail">
                        <span className="label">{t.take.passScoreLabel}</span>
                        <span id="pass-score" className="value">
                            {quiz.passScore}%
                        </span>
                    </div>
                    <div className="detail">
                        <span className="label">{t.take.feedbackLabel}</span>
                        <span id="question-feedback" className="value">
                            {getFeedbackText(quiz.mode, t)}
                        </span>
                    </div>
                </div>
                {cohortLeaderboard.length > 0 && (
                    <section className="leaderboard-panel" aria-labelledby="cohort-leaderboard-heading">
                        <div className="leaderboard-panel__header">
                            <span className="leaderboard-panel__kicker">{t.take.workshopStandingKicker}</span>
                            <h3 id="cohort-leaderboard-heading">{t.take.cohortLeaderboardTitle}</h3>
                            <p>{t.take.cohortLeaderboardIntro}</p>
                        </div>
                        <table data-testid="cohort-leaderboard-table">
                            <caption>{t.take.cohortLeaderboardTitle}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">{t.take.colRank}</th>
                                    <th scope="col">{t.quiz.colCohort}</th>
                                    <th scope="col">{t.quiz.colScore}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cohortLeaderboard.map(entry => (
                                    <tr
                                        key={entry.cohort}
                                        className={`leaderboard-row leaderboard-row--${rankTone(entry.rank)}`}
                                    >
                                        <td>
                                            <div className="leaderboard-rank">
                                                <span
                                                    aria-hidden="true"
                                                    className={`leaderboard-rank__cup leaderboard-rank__cup--${rankTone(entry.rank)}`}
                                                >
                                                    <span className="leaderboard-rank__cup-bowl" />
                                                    <span className="leaderboard-rank__cup-stem" />
                                                    <span className="leaderboard-rank__cup-base" />
                                                </span>
                                                <span>{entry.rank}</span>
                                            </div>
                                        </td>
                                        <td>{entry.cohort}</td>
                                        <td>{entry.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}
                {individualsLeaderboard.length > 0 && (
                    <section className="leaderboard-panel" aria-labelledby="individuals-leaderboard-heading">
                        <div className="leaderboard-panel__header">
                            <span className="leaderboard-panel__kicker">{t.take.topPlayersKicker}</span>
                            <h3 id="individuals-leaderboard-heading">{t.take.individualsLeaderboardTitle}</h3>
                            <p>{t.take.individualsLeaderboardIntro}</p>
                        </div>
                        <table data-testid="individuals-leaderboard-table">
                            <caption>{t.take.individualsLeaderboardTitle}</caption>
                            <thead>
                                <tr>
                                    <th scope="col">{t.take.colRank}</th>
                                    <th scope="col">{t.take.colNickname}</th>
                                    <th scope="col">{t.quiz.colScore}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {individualsLeaderboard.map(entry => (
                                    <tr
                                        key={`${entry.rank}-${entry.nickname}`}
                                        className={`leaderboard-row leaderboard-row--${rankTone(entry.rank)}`}
                                    >
                                        <td>
                                            <div className="leaderboard-rank">
                                                <span
                                                    aria-hidden="true"
                                                    className={`leaderboard-rank__cup leaderboard-rank__cup--${rankTone(entry.rank)}`}
                                                >
                                                    <span className="leaderboard-rank__cup-bowl" />
                                                    <span className="leaderboard-rank__cup-stem" />
                                                    <span className="leaderboard-rank__cup-base" />
                                                </span>
                                                <span>{entry.rank}</span>
                                            </div>
                                        </td>
                                        <td>{entry.nickname}</td>
                                        <td>{entry.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>
                )}
                <footer>
                    <p id="statusMessage">{canStart ? t.take.enjoyTheQuiz : t.take.tooEarly}</p>
                    <StartButton onClick={onStart} disabled={!canStart} />
                </footer>
            </TakeCard>
        </Page>
    )
}
