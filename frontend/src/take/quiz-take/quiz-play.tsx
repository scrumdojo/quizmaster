import './quiz-play.scss'
import { useState } from 'react'

import type { QuizMode, QuizTake } from '#fe/shared/model/quiz.ts'
import { recordTimeout, submitQuizQuestionAnswer } from '#fe/take/api/stats.ts'
import type { AnswerIdxs, QuestionAnswer, QuestionEvaluation } from '#fe/take/model/question.ts'
import { QuestionForm, QuizQuestionProvider } from '#fe/take/question-take/index.ts'

import { BookmarkList } from './components/bookmark-list.tsx'
import { BackButton, BookmarkButton, EvaluateButton, FlagButton, NextButton } from './components/buttons.tsx'
import { ProgressBar } from './components/progress-bar.tsx'
import { useQuizAnswersState, type QuizAnswers } from './quiz-answers-state.ts'
import { useQuizBookmarkState } from './quiz-bookmark-state.ts'
import { useQuizFlagState } from './quiz-flag-state.ts'
import { useQuizNavigationState } from './quiz-navigation-state.ts'
import { TimeLimit } from './time-limit/with-time-limit.tsx'

interface QuizPlayFormProps {
    readonly quiz: QuizTake
    readonly quizRunId: number
    readonly questionsBaseUrl: string
    readonly onEvaluate: (quizAnswers: QuizAnswers) => void
}

const feedbackModeLabel = (mode: QuizMode): string => (mode === 'learn' ? 'Continuous feedback' : 'Feedback at the end')

export const QuizPlayForm = (props: QuizPlayFormProps) => {
    const { quizAnswers, answerQuestion } = useQuizAnswersState()
    const nav = useQuizNavigationState(props.quiz, props.questionsBaseUrl)
    const bookmarks = useQuizBookmarkState()
    const flags = useQuizFlagState()
    const [selectedAnswerIdxs, setSelectedAnswerIdxs] = useState<AnswerIdxs | undefined>(undefined)

    const answer = (questionAnswer: QuestionAnswer) => {
        answerQuestion(nav.currentQuestionIdx, questionAnswer)
        nav.unskip()
    }

    const bookmark = () => bookmarks.toggle(nav.currentQuestionIdx)

    const bookmarkList = Array.from(bookmarks.questionIdxs).map(questionIdx => ({
        title: props.quiz.questions[questionIdx].question,
        onClick: () => nav.goto(questionIdx),
        onDelete: () => bookmarks.remove(questionIdx),
    }))

    const evaluate = () => {
        props.onEvaluate(quizAnswers)
    }

    const handleTimeOut = async () => {
        await recordTimeout(props.quiz.id, props.quizRunId)
    }

    const evaluateTimedOut = () => {
        props.onEvaluate(quizAnswers)
    }

    const currentQuestion = props.quiz.questions[nav.currentQuestionIdx]
    const toggleFlag = () =>
        void flags.toggle(props.quiz.id, props.quizRunId, currentQuestion.id, nav.currentQuestionIdx)
    const currentAnswer = quizAnswers.finalAnswers[nav.currentQuestionIdx]
    const isAnswered = currentAnswer !== undefined
    const hasSelectedAnswer = selectedAnswerIdxs !== undefined && selectedAnswerIdxs.length > 0

    const handleNextButton = async () => {
        if (!hasSelectedAnswer) {
            if (!bookmarks.has(nav.currentQuestionIdx)) {
                bookmarks.toggle(nav.currentQuestionIdx)
            }
            nav.skip()
        } else {
            const questionAnswer: QuestionAnswer = { type: 'choice', selectedIdxs: selectedAnswerIdxs }
            answer(questionAnswer)
            const updatedFinalAnswers = [...quizAnswers.finalAnswers]
            updatedFinalAnswers[nav.currentQuestionIdx] = questionAnswer

            const allAnswered = props.quiz.questions.every((_, idx) => updatedFinalAnswers[idx] !== undefined)

            if (allAnswered) {
                props.onEvaluate({ firstAnswers: quizAnswers.firstAnswers, finalAnswers: updatedFinalAnswers })
            } else {
                nav.next()
            }
        }
    }

    const handleAnswerSubmitted = async (questionAnswer: QuestionAnswer): Promise<QuestionEvaluation | void> => {
        const result = await submitQuizQuestionAnswer(
            props.quiz.id,
            props.quizRunId,
            currentQuestion.id,
            questionAnswer,
        )

        if (props.quiz.mode === 'learn') {
            answer(questionAnswer)
        } else {
            answer(questionAnswer)
            if (!nav.isLastQuestion) {
                nav.next()
            }
        }

        return result
    }

    return (
        <div className="page quiz-play" id="quiz-play">
            <div className="quiz-play-status">
                <span className="feedback-mode-chip" id="feedback-mode" data-mode={props.quiz.mode}>
                    {feedbackModeLabel(props.quiz.mode)}
                </span>
                <TimeLimit timeLimit={props.quiz.timeLimit} onTimeOut={handleTimeOut} onConfirm={evaluateTimedOut} />
            </div>

            <ProgressBar current={nav.currentQuestionIdx + 1} total={props.quiz.questions.length} />

            <QuizQuestionProvider
                value={{
                    selectedAnswerIdxs: currentAnswer?.type === 'choice' ? currentAnswer.selectedIdxs : [],
                    onSubmitted: handleAnswerSubmitted,
                    onAnswerSelected: idxs => {
                        setSelectedAnswerIdxs(idxs)
                    },
                    showFeedbackOnSubmit: props.quiz.mode === 'learn',
                    difficulty: props.quiz.difficulty,
                }}
            >
                <QuestionForm key={currentQuestion.id} question={currentQuestion} />
            </QuizQuestionProvider>

            <div className="quiz-play-actions">
                {nav.canBack && <BackButton onClick={nav.back} />}
                <BookmarkButton isBookmarked={bookmarks.has(nav.currentQuestionIdx)} onClick={bookmark} />
                <FlagButton isFlagged={flags.has(nav.currentQuestionIdx)} onClick={toggleFlag} />
                {nav.canNext && <NextButton onClick={() => void handleNextButton()} />}
                {isAnswered && !nav.canNext && <EvaluateButton onClick={evaluate} />}
            </div>

            <BookmarkList bookmarks={bookmarkList} />
        </div>
    )
}
