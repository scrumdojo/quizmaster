import './quiz-details.scss'
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

const getFeedbackText = (mode: string): string => (mode === 'learn' ? 'Continuous feedback' : 'Feedback at the end')

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
}: QuizDetailsProps) => (
    <Page id="quiz-welcome" title="Welcome to the quiz">
        <TakeCard id="quiz-details" className="quiz-welcome-card">
            <header>
                <span className="eyebrow">Quiz</span>
                <h2 id="quiz-name">{quiz.title}</h2>
                <p id="quiz-description">{quiz.description}</p>
            </header>
            <div className="details">
                <div className="detail">
                    <span className="label">Time limit</span>
                    <span id="time-limit" className="value">
                        {quiz.timeLimit} seconds
                    </span>
                </div>
                <div className="detail">
                    <span className="label">Question count</span>
                    <span id="question-count" className="value">
                        {questionCount}
                    </span>
                </div>
                <div className="detail">
                    <span className="label">Pass score</span>
                    <span id="pass-score" className="value">
                        {quiz.passScore}%
                    </span>
                </div>
                <div className="detail">
                    <span className="label">Feedback</span>
                    <span id="question-feedback" className="value">
                        {getFeedbackText(quiz.mode)}
                    </span>
                </div>
            </div>
            {cohortLeaderboard.length > 0 && (
                <section className="leaderboard-panel" aria-labelledby="cohort-leaderboard-heading">
                    <div className="leaderboard-panel__header">
                        <span className="leaderboard-panel__kicker">Workshop standing</span>
                        <h3 id="cohort-leaderboard-heading">Cohort leaderboard</h3>
                        <p>Compare the strongest cohorts before you begin your own run.</p>
                    </div>
                    <table data-testid="cohort-leaderboard-table">
                        <caption>Cohort leaderboard</caption>
                        <thead>
                            <tr>
                                <th scope="col">Rank</th>
                                <th scope="col">Cohort</th>
                                <th scope="col">Score</th>
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
                        <span className="leaderboard-panel__kicker">Top players</span>
                        <h3 id="individuals-leaderboard-heading">Individuals leaderboard</h3>
                        <p>Compare your score against the strongest individual runs recorded for this quiz.</p>
                    </div>
                    <table data-testid="individuals-leaderboard-table">
                        <caption>Individuals leaderboard</caption>
                        <thead>
                            <tr>
                                <th scope="col">Rank</th>
                                <th scope="col">Nickname</th>
                                <th scope="col">Score</th>
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
                <p id="statusMessage">{canStart ? 'Enjoy the quiz' : "It's too early"}</p>
                <StartButton onClick={onStart} disabled={!canStart} />
            </footer>
        </TakeCard>
    </Page>
)
