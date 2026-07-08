import './quiz-score-page.scss'
import type { QuizEvaluationResponse, QuizTake } from '#fe/shared/model/quiz.ts'

import { QuestionSummary } from './components/question-summary.tsx'
import type { QuizAnswers } from './quiz-answers-state.ts'

interface QuizScorePageProps {
    readonly quiz: QuizTake
    readonly quizAnswers: QuizAnswers
    readonly result: QuizEvaluationResponse
}

export const QuizScorePage = ({ quiz, quizAnswers, result }: QuizScorePageProps) => {
    const percentage = result.totalWeight > 0 ? (result.weightedScore / result.totalWeight) * 100 : 0
    const passed = percentage >= quiz.passScore
    const outcome = passed ? 'passed' : 'failed'
    const mistakes = (result.questions ?? [])
        .filter(evaluation => evaluation.status !== 'CORRECT')
        .map(evaluation => evaluation.question)
        .filter((question): question is NonNullable<typeof question> => question != null)

    return (
        <div className="page quiz-score" id="quiz-score">
            <h1>Quiz result</h1>

            <section className="score-summary" id="results" data-result={outcome}>
                <header>
                    <span className={`outcome ${outcome}`}>
                        <span id="text-result">{outcome}</span>
                    </span>
                    <div className="percent-display">
                        <span className="percent-value">
                            <span id="percentage-result">{percentage.toFixed(0)}</span>%
                        </span>
                        <span className="percent-label">your score</span>
                    </div>
                </header>
                <dl className="metrics">
                    <div className="metric">
                        <dt>Correct answers</dt>
                        <dd>
                            <span id="correct-answers">{result.score}</span>
                            <span className="separator"> / </span>
                            <span id="total-questions">{result.totalQuestions}</span>
                        </dd>
                    </div>
                    <div className="metric">
                        <dt>Points</dt>
                        <dd>
                            <span id="weighted-points">{result.weightedScore}</span>
                            <span className="separator"> / </span>
                            <span id="total-weight">{result.totalWeight}</span>
                        </dd>
                    </div>
                    <div className="metric">
                        <dt>Required to pass</dt>
                        <dd>
                            <span id="pass-score">{quiz.passScore}</span>%
                        </dd>
                    </div>
                </dl>
            </section>

            {mistakes.length > 0 && (
                <section className="mistakes-summary" id="mistakes-summary">
                    <h2>Questions to review</h2>
                    <ul>
                        {mistakes.map(question => (
                            <li key={question.id}>{question.question}</li>
                        ))}
                    </ul>
                </section>
            )}

            {result.questions && (
                <>
                    <h2>Answer overview</h2>
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
        </div>
    )
}
