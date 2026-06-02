import { useEffect, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'

import { CreateQuestionPage } from '#fe/make/create-question/create-question-page.tsx'
import { EditQuestionPage } from '#fe/make/create-question/edit-question-page.tsx'
import { WorkspaceCreatePage } from '#fe/make/create-workspace/workspace-create-page.tsx'
import { HomePage } from '#fe/make/home.tsx'
import { QuizStatsPage } from '#fe/make/quiz-stats/quiz-stats-page.tsx'
import { QuizEditPage } from '#fe/make/quiz/quiz-edit-page.tsx'
import { QuizSharePage } from '#fe/make/quiz/share/quiz-share-page.tsx'
import { WorkspacePage } from '#fe/make/workspace/workspace.tsx'
import { QuestionTakePage } from '#fe/take/question-take'
import { QuizTakePage } from '#fe/take/quiz-take/quiz-take-page.tsx'
import { QuizWelcomePage } from '#fe/take/quiz-take/quiz-welcome/quiz-welcome-page.tsx'
import { ROUTES } from '#fe/urls.ts'

type AnimationTheme = 'angels' | 'mammoths' | 'off'

const THEME_OPTIONS: { value: AnimationTheme; label: string }[] = [
    { value: 'off', label: 'Turn off' },
    { value: 'angels', label: 'Angels & Devils' },
    { value: 'mammoths', label: 'Mammoths' },
]

const AnimationSettings = () => {
    const [open, setOpen] = useState(false)
    const [theme, setTheme] = useState<AnimationTheme>(() => {
        const v = localStorage.getItem('animation-theme')
        return v === 'mammoths' || v === 'off' ? v : 'angels'
    })

    const select = (t: AnimationTheme) => {
        window.__setAnimationTheme?.(t)
        setTheme(t)
        setOpen(false)
    }

    return (
        <div
            data-testid="animation-settings"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            style={{
                position: 'fixed',
                right: 0,
                bottom: 0,
                zIndex: 3,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                minWidth: 72,
                minHeight: 72,
            }}
        >
            {open && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                    {THEME_OPTIONS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            aria-label={label}
                            onClick={() => select(value)}
                            style={{
                                padding: '3px 10px',
                                borderRadius: 12,
                                border: '1px solid rgba(16, 35, 63, 0.24)',
                                background: theme === value ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.72)',
                                fontWeight: theme === value ? 600 : 400,
                                fontSize: 12,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                color: '#10233f',
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
            <button
                type="button"
                aria-label="Animation settings"
                onBlur={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                style={{
                    width: 26,
                    height: 26,
                    border: '1px solid rgba(16, 35, 63, 0.24)',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.82)',
                    color: '#10233f',
                    cursor: 'pointer',
                    fontSize: 13,
                    lineHeight: 1,
                    opacity: open ? 0.88 : 0,
                    transition: 'opacity 0.18s ease',
                }}
            >
                🎬
            </button>
        </div>
    )
}

type PiCornerToggleProps = {
    readonly animationOnly: boolean
    readonly onToggle: () => void
}

const PiCornerToggle = ({ animationOnly, onToggle }: PiCornerToggleProps) => {
    const [isVisible, setVisible] = useState(false)

    return (
        <div
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            style={{
                position: 'fixed',
                left: 0,
                bottom: 0,
                zIndex: 3,
                width: 72,
                height: 72,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'flex-start',
                padding: 14,
            }}
        >
            <button
                aria-label={animationOnly ? 'Show interface' : 'Show animation only'}
                onBlur={() => setVisible(false)}
                onClick={onToggle}
                onFocus={() => setVisible(true)}
                style={{
                    width: 26,
                    height: 26,
                    border: '1px solid rgba(16, 35, 63, 0.24)',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.82)',
                    color: '#10233f',
                    cursor: 'pointer',
                    fontFamily: 'Georgia, serif',
                    fontSize: 15,
                    lineHeight: 1,
                    opacity: isVisible ? 0.88 : 0,
                    transition: 'opacity 0.18s ease',
                }}
                type="button"
            >
                π
            </button>
        </div>
    )
}

const ScrollToTop = () => {
    const { pathname, search } = useLocation()
    useEffect(() => {
        window.scrollTo(0, 0)
    }, [pathname, search])
    return null
}

export const App = () => {
    const [animationOnly, setAnimationOnly] = useState(false)

    return (
        <BrowserRouter>
            <ScrollToTop />
            <div style={{ display: animationOnly ? 'none' : undefined, position: 'relative', zIndex: 1 }}>
                <Routes>
                    <Route path={ROUTES.home} element={<HomePage />} />

                    {/* Public question taking */}
                    <Route path={ROUTES.questionTake} element={<QuestionTakePage />} />

                    {/* Workspace */}
                    <Route path={ROUTES.workspaceNew} element={<WorkspaceCreatePage />} />
                    <Route path={ROUTES.workspace} element={<WorkspacePage />} />
                    <Route path={ROUTES.workspaceQuestionNew} element={<CreateQuestionPage />} />
                    <Route path={ROUTES.workspaceQuestionEdit} element={<EditQuestionPage />} />

                    {/* Quiz management (workspace-scoped) */}
                    <Route path={ROUTES.workspaceQuizNew} element={<QuizEditPage />} />
                    <Route path={ROUTES.workspaceQuizEdit} element={<QuizEditPage />} />
                    <Route path={ROUTES.workspaceQuizStats} element={<QuizStatsPage />} />
                    <Route path={ROUTES.workspaceQuizShare} element={<QuizSharePage />} />
                    <Route path={ROUTES.workspaceQuizDryRun} element={<QuizWelcomePage isDryRun={true} />} />
                    <Route path={ROUTES.workspaceQuizDryRunTake} element={<QuizTakePage isDryRun={true} />} />

                    {/* Quiz taking (public) */}
                    <Route path={ROUTES.quizWelcome} element={<QuizWelcomePage isDryRun={false} />} />
                    <Route path={ROUTES.quizWelcomeWithCohort} element={<QuizWelcomePage isDryRun={false} />} />
                    <Route path={ROUTES.quizTake} element={<QuizTakePage isDryRun={false} />} />
                </Routes>
            </div>
            <PiCornerToggle animationOnly={animationOnly} onToggle={() => setAnimationOnly(value => !value)} />
            <AnimationSettings />
        </BrowserRouter>
    )
}
