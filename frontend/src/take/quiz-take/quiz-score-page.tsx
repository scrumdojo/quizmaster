import './quiz-score-page.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'
import { Page } from '#fe/shared'
import type { QuizEvaluationResponse, QuizTake } from '#fe/shared/model/quiz.ts'
import { urls } from '#fe/urls.ts'

import { QuestionSummary } from './components/question-summary.tsx'
import type { QuizAnswers } from './quiz-answers-state.ts'

interface QuizScorePageProps {
    readonly quiz: QuizTake
    readonly quizAnswers: QuizAnswers
    readonly result: QuizEvaluationResponse
}

export const QuizScorePage = ({ quiz, quizAnswers, result }: QuizScorePageProps) => {
    const { t } = useLanguage()
    const percentage = result.totalWeight > 0 ? (result.weightedScore / result.totalWeight) * 100 : 0
    const passed = percentage >= quiz.passScore
    const outcome = passed ? 'passed' : 'failed'

    return (
        <Page
            id="quiz-score"
            className="quiz-score"
            title={t.take.quizResultTitle}
            back={{ to: urls.home(), label: t.take.backToHome }}
        >
            <section className="score-summary" id="results" data-result={outcome}>
                <header>
                    <span className={`outcome ${outcome}`}>
                        <span id="text-result">{outcome === 'passed' ? t.take.passedLabel : t.take.failedLabel}</span>
                    </span>
                    <div className="percent-display">
                        <span className="percent-value">
                            <span id="percentage-result">{percentage.toFixed(0)}</span>%
                        </span>
                        <span className="percent-label">{t.take.yourScoreLabel}</span>
                    </div>
                </header>
                <dl className="metrics">
                    <div className="metric">
                        <dt>{t.take.correctAnswersLabel}</dt>
                        <dd>
                            <span id="correct-answers">{result.score}</span>
                            <span className="separator"> / </span>
                            <span id="total-questions">{result.totalQuestions}</span>
                        </dd>
                    </div>
                    <div className="metric">
                        <dt>{t.take.pointsLabel}</dt>
                        <dd>
                            <span id="weighted-points">{result.weightedScore}</span>
                            <span className="separator"> / </span>
                            <span id="total-weight">{result.totalWeight}</span>
                        </dd>
                    </div>
                    <div className="metric">
                        <dt>{t.take.requiredToPassLabel}</dt>
                        <dd>
                            <span id="pass-score">{quiz.passScore}</span>%
                        </dd>
                    </div>
                </dl>
            </section>

            {result.questions && (
                <>
                    <h2>{t.take.answerOverviewTitle}</h2>
                    {result.questions.map((evaluation, idx) =>
                        evaluation.question ? (
                            <QuestionSummary
                                key={evaluation.question.id}
                                question={evaluation.question}
                                status={evaluation.status}
                                answer={quizAnswers.finalAnswers[idx]}
                            />
                        ) : null,
                    )}
                </>
            )}
        </Page>
    )
}
