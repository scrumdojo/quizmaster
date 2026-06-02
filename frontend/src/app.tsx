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

const SPEAR_CURSOR = `url("data:image/svg+xml;base64,${btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
        '<line x1="30" y1="30" x2="10" y2="10" stroke="#8B6914" stroke-width="3" stroke-linecap="round"/>' +
        '<polygon points="4,4 9,16 16,9" fill="silver" stroke="gray" stroke-width="0.5"/>' +
        '</svg>',
)}") 4 4, auto`

document.documentElement.style.setProperty('--cursor-spear', SPEAR_CURSOR)

const THEME_OPTIONS: { value: AnimationTheme; label: string; cursor: string }[] = [
    { value: 'off', label: 'Turn off', cursor: 'pointer' },
    { value: 'angels', label: 'Angels & Devils', cursor: 'pointer' },
    { value: 'mammoths', label: 'Mammoths', cursor: SPEAR_CURSOR },
]

const AnimationSettings = () => {
    const [theme, setTheme] = useState<AnimationTheme>(() => {
        const v = localStorage.getItem('animation-theme')
        return v === 'mammoths' || v === 'off' ? v : 'angels'
    })

    const select = (t: AnimationTheme) => {
        window.__setAnimationTheme?.(t)
        setTheme(t)
    }

    return (
        <div
            data-testid="animation-settings"
            style={{
                position: 'fixed',
                top: 16,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                display: 'flex',
                background: 'rgba(255,255,255,0.92)',
                borderRadius: 999,
                border: '2px solid rgba(37,99,235,0.18)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
                padding: 4,
                gap: 2,
                backdropFilter: 'blur(8px)',
            }}
        >
            {THEME_OPTIONS.map(({ value, label, cursor }) => (
                <button
                    key={value}
                    type="button"
                    aria-label={label}
                    aria-pressed={theme === value}
                    onClick={() => select(value)}
                    style={{
                        padding: '10px 20px',
                        borderRadius: 999,
                        border: 'none',
                        background:
                            theme === value
                                ? 'linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 60%, #4338ca 100%)'
                                : 'transparent',
                        fontWeight: 700,
                        fontSize: 15,
                        cursor,
                        whiteSpace: 'nowrap',
                        color: theme === value ? '#fff' : '#10233f',
                        boxShadow: theme === value ? '0 2px 8px rgba(37,99,235,0.28)' : 'none',
                        transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease',
                    }}
                >
                    {label}
                </button>
            ))}
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
