import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router'

import { CreateQuestionPage } from '#fe/make/create-question/create-question-page.tsx'
import { EditQuestionPage } from '#fe/make/create-question/edit-question-page.tsx'
import { WorkspaceCreatePage } from '#fe/make/create-workspace/workspace-create-page.tsx'
import { HomePage } from '#fe/make/home.tsx'
import { PollResultsPage } from '#fe/make/poll-results/poll-results-page.tsx'
import { PollEditPage } from '#fe/make/poll/poll-edit-page.tsx'
import { QuizStatsPage } from '#fe/make/quiz-stats/quiz-stats-page.tsx'
import { QuizEditPage } from '#fe/make/quiz/quiz-edit-page.tsx'
import { QuizSharePage } from '#fe/make/quiz/share/quiz-share-page.tsx'
import { WorkspacePage } from '#fe/make/workspace/workspace.tsx'
import { PollTakePage } from '#fe/take/poll-take'
import { QuestionTakePage } from '#fe/take/question-take'
import { QuizNicknamePage } from '#fe/take/quiz-take/quiz-nickname/quiz-nickname-page.tsx'
import { QuizTakePage } from '#fe/take/quiz-take/quiz-take-page.tsx'
import { QuizWelcomePage } from '#fe/take/quiz-take/quiz-welcome/quiz-welcome-page.tsx'
import { ROUTES } from '#fe/urls.ts'

type AnimationTheme = 'angels' | 'mammoths' | 'photo' | 'off'

const SPEAR_CURSOR = `url("data:image/svg+xml;base64,${btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' +
        '<line x1="30" y1="30" x2="10" y2="10" stroke="#8B6914" stroke-width="3" stroke-linecap="round"/>' +
        '<polygon points="4,4 9,16 16,9" fill="silver" stroke="gray" stroke-width="0.5"/>' +
        '</svg>',
)}") 4 4, auto`

document.documentElement.style.setProperty('--cursor-spear', SPEAR_CURSOR)

const PAW_CURSOR = `url("data:image/svg+xml;base64,${btoa(
    '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">' +
        '<ellipse cx="26" cy="36" rx="16" ry="13" fill="#3d1a00"/>' +
        '<circle cx="10" cy="20" r="7" fill="#3d1a00"/>' +
        '<circle cx="21" cy="13" r="7" fill="#3d1a00"/>' +
        '<circle cx="33" cy="13" r="7" fill="#3d1a00"/>' +
        '<circle cx="44" cy="20" r="7" fill="#3d1a00"/>' +
        '</svg>',
)}") 26 26, auto`

document.documentElement.style.setProperty('--cursor-paw', PAW_CURSOR)

const THEME_OPTIONS: { value: AnimationTheme; label: string; cursor: string }[] = [
    { value: 'off', label: 'Turn off', cursor: 'pointer' },
    { value: 'angels', label: 'Angels & Devils', cursor: 'pointer' },
    { value: 'mammoths', label: 'Mammoths', cursor: SPEAR_CURSOR },
    { value: 'photo', label: 'Photo', cursor: 'pointer' },
]

const ICONS = ['🦣', '😇'] as const

// ─── App theme (reskin) selector ─────────────────────────────────────────────
// Scaffolding for a future full app reskin: persists the chosen theme and
// exposes it as `data-app-theme` on <html> for CSS to hook into later.

type AppTheme = 'default' | 'windows-xp' | 'star-trek'

const APP_THEME_STORAGE_KEY = 'app-theme'

const readAppTheme = (): AppTheme => {
    const v = localStorage.getItem(APP_THEME_STORAGE_KEY)
    return v === 'windows-xp' || v === 'star-trek' ? v : 'default'
}

document.documentElement.dataset.appTheme = readAppTheme()

const APP_THEME_OPTIONS: { value: AppTheme; label: string }[] = [
    { value: 'default', label: 'Standaard' },
    { value: 'windows-xp', label: 'Windows XP' },
    { value: 'star-trek', label: 'Star Trek' },
]

const AppThemeFab = () => {
    const [theme, setTheme] = useState<AppTheme>(readAppTheme)
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        document.documentElement.dataset.appTheme = theme
        localStorage.setItem(APP_THEME_STORAGE_KEY, theme)
    }, [theme])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const select = (t: AppTheme) => {
        setTheme(t)
        setOpen(false)
    }

    return (
        <div ref={ref} data-testid="app-theme-settings" className="theme-fab">
            <div className="theme-label">Theme</div>
            <button type="button" className="theme-trigger" aria-label="App theme" onClick={() => setOpen(v => !v)}>
                <span className="theme-icon" aria-hidden="true">
                    🎨
                </span>
            </button>
            {open && (
                <div className="theme-dropdown">
                    {APP_THEME_OPTIONS.map(({ value, label }) => (
                        <button
                            key={value}
                            type="button"
                            aria-label={label}
                            aria-pressed={theme === value}
                            onClick={() => select(value)}
                            className={`theme-option${theme === value ? ' theme-option--active' : ''}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// Decorative Windows XP taskbar — always mounted, only shown via CSS when
// data-app-theme="windows-xp" (see .xp-taskbar in styles.scss). Not
// interactive, so it stays out of the accessibility tree and out of the way
// of role-based queries in tests.
const XpTaskbar = () => {
    const [now, setNow] = useState<Date>(() => new Date())

    useEffect(() => {
        const id = window.setInterval(() => setNow(new Date()), 30_000)
        return () => window.clearInterval(id)
    }, [])

    const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    return (
        <div className="xp-taskbar" aria-hidden="true">
            <div className="xp-taskbar__start">
                <span className="xp-taskbar__start-icon">⊞</span> start
            </div>
            <div className="xp-taskbar__clock">{clock}</div>
        </div>
    )
}

interface BackgroundGameFabProps {
    readonly battleOnly: boolean
    readonly onBattleOnlyChange: (value: boolean) => void
}

const BackgroundGameFab = ({ battleOnly, onBattleOnlyChange }: BackgroundGameFabProps) => {
    const [theme, setTheme] = useState<AnimationTheme>(() => {
        const v = localStorage.getItem('animation-theme')
        return v === 'mammoths' || v === 'off' || v === 'photo' ? v : 'angels'
    })
    const [open, setOpen] = useState(false)
    const [iconIdx, setIconIdx] = useState(0)
    const ref = useRef<HTMLDivElement>(null)

    // Alternate icons every 2 s
    useEffect(() => {
        const id = window.setInterval(() => setIconIdx(i => 1 - i), 2000)
        return () => window.clearInterval(id)
    }, [])

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const select = (t: AnimationTheme) => {
        window.__setAnimationTheme?.(t)
        setTheme(t)
        setOpen(false)
    }

    const toggleBattleOnly = () => {
        onBattleOnlyChange(!battleOnly)
        setOpen(false)
    }

    return (
        <div ref={ref} data-testid="animation-settings" className="bg-game-fab">
            <div className="bg-game-label">Background game</div>
            <button
                type="button"
                className="bg-game-trigger"
                aria-label="Background game"
                onClick={() => setOpen(v => !v)}
            >
                {ICONS.map((icon, i) => (
                    <span
                        key={icon}
                        className="bg-game-icon"
                        style={{ opacity: iconIdx === i ? 1 : 0 }}
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                ))}
            </button>
            {open && (
                <div className="bg-game-dropdown">
                    {THEME_OPTIONS.map(({ value, label, cursor }) => (
                        <button
                            key={value}
                            type="button"
                            aria-label={label}
                            aria-pressed={theme === value && !battleOnly}
                            onClick={() => select(value)}
                            className={`bg-game-option${theme === value && !battleOnly ? ' bg-game-option--active' : ''}`}
                            style={{ cursor }}
                        >
                            {label}
                        </button>
                    ))}
                    <button
                        type="button"
                        aria-label="Battle only"
                        aria-pressed={battleOnly}
                        onClick={toggleBattleOnly}
                        className={`bg-game-option${battleOnly ? ' bg-game-option--active' : ''}`}
                    >
                        Battle only
                    </button>
                </div>
            )}
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
            <div
                data-testid="app-interface"
                style={{ display: animationOnly ? 'none' : undefined, position: 'relative', zIndex: 1 }}
            >
                <Routes>
                    <Route path={ROUTES.home} element={<HomePage />} />

                    {/* Public question taking */}
                    <Route path={ROUTES.questionTake} element={<QuestionTakePage />} />
                    <Route path={ROUTES.pollTake} element={<PollTakePage />} />

                    {/* Workspace */}
                    <Route path={ROUTES.workspaceNew} element={<WorkspaceCreatePage />} />
                    <Route path={ROUTES.workspace} element={<WorkspacePage />} />
                    <Route path={ROUTES.workspaceQuestionNew} element={<CreateQuestionPage />} />
                    <Route path={ROUTES.workspaceQuestionEdit} element={<EditQuestionPage />} />
                    <Route path={ROUTES.workspacePollNew} element={<PollEditPage />} />
                    <Route path={ROUTES.workspacePollEdit} element={<PollEditPage />} />
                    <Route path={ROUTES.workspacePollResults} element={<PollResultsPage />} />

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
                    <Route path={ROUTES.quizNickname} element={<QuizNicknamePage isDryRun={false} />} />
                    <Route path={ROUTES.quizNicknameWithCohort} element={<QuizNicknamePage isDryRun={false} />} />
                </Routes>
            </div>
            <PiCornerToggle animationOnly={animationOnly} onToggle={() => setAnimationOnly(value => !value)} />
            <BackgroundGameFab battleOnly={animationOnly} onBattleOnlyChange={setAnimationOnly} />
            <AppThemeFab />
            <XpTaskbar />
        </BrowserRouter>
    )
}
