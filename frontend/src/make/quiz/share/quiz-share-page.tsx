import { QRCodeSVG } from 'qrcode.react'
import type { CSSProperties, MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router'
import './quiz-share-page.scss'
import {
    createCohort,
    deleteCohort,
    fetchQuizLiveStats,
    fetchWorkspaceQuiz,
    updateCohort,
    type CohortCreateError,
} from '#fe/make/api/quiz.ts'
import { Alert, Button, FieldNote, HelpTooltip, Page } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuizCohort } from '#shared/types/quiz.ts'

const LIVE_STATS_POLL_MS = 2000

const quizQrKey = 'quiz-take'

type CohortErrorTarget = 'add' | `edit:${string}`
type AnimationTheme = 'angels' | 'mammoths' | 'photo' | 'off'
type QrThemeImage = 'angel' | 'mammoth'

const cohortErrorMessages: Record<CohortCreateError, string> = {
    'empty-cohort-name': 'Name cannot be empty.',
    'duplicate-cohort-name': 'A cohort with this name already exists.',
}

const qrThemeImage = (emoji: string, label: string) =>
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
            <rect width="96" height="96" rx="20" fill="white"/>
            <text x="48" y="62" text-anchor="middle" font-size="54" aria-label="${label}">${emoji}</text>
        </svg>`,
    )}`

const QR_THEME_IMAGES: Record<QrThemeImage, string> = {
    angel: qrThemeImage('👼', 'angel'),
    mammoth: qrThemeImage('🦣', 'mammoth'),
}

const SHARE_BIRD_GIF_URL =
    'https://cdn.prod.website-files.com/6334dbcbbe4129ee195573c1/6543fb118d9abe3cc96e2fb8_8_IUQSWVLwaajCn5eWped71A4u6ziuWXFzP9w70bSA42oHEPLRWVf1p_F1HVELN7yJSDunSFBhQrrPNO4MmtFNxj5U8QCiCxfbPppby20iY0x5IFOyhbOHhe_Jn24PGgI1qd6OsjXGgnqC90DNj-dz8.gif'
const SHARE_FLOCK_CLICK_WINDOW_MS = 1200
const SHARE_BIRD_REMOVE_DELAY_MS = 1800
const SHARE_FLOCK_REMOVE_DELAY_MS = 2600

const SHARE_FLOCK_OFFSETS = [
    { startX: -24, startY: -8, midX: -96, midY: -38, endX: -130, endY: 14, delay: 0, size: 3.4 },
    { startX: -12, startY: 11, midX: -54, midY: -100, endX: -88, endY: -2, delay: 45, size: 3.9 },
    { startX: 0, startY: 0, midX: -16, midY: -58, endX: -46, endY: 18, delay: 90, size: 4.2 },
    { startX: 13, startY: -12, midX: 26, midY: -122, endX: -8, endY: -12, delay: 135, size: 3.7 },
    { startX: 26, startY: 10, midX: 72, midY: -82, endX: 34, endY: 10, delay: 180, size: 3.25 },
    { startX: -34, startY: 16, midX: -132, midY: -6, endX: -168, endY: 34, delay: 220, size: 3.1 },
    { startX: 36, startY: 3, midX: 120, midY: -42, endX: 72, endY: 28, delay: 260, size: 3.55 },
] as const

const currentAnimationTheme = (): AnimationTheme => {
    const theme = localStorage.getItem('animation-theme')
    return theme === 'mammoths' || theme === 'off' || theme === 'photo' ? theme : 'angels'
}

const currentQrThemeImage = (): QrThemeImage | null => {
    const theme = currentAnimationTheme()
    if (theme === 'mammoths') return 'mammoth'
    if (theme === 'angels') return 'angel'
    return null
}

interface ActiveQrCode {
    readonly key: string
    readonly label: string
    readonly testId: string
    readonly url: string
}

interface CohortInlineError {
    readonly code: CohortCreateError
    readonly target: CohortErrorTarget
}

interface ShareBird {
    readonly id: number
    readonly flock: boolean
    readonly startX: number
    readonly startY: number
    readonly midX: number
    readonly midY: number
    readonly endX: number
    readonly endY: number
    readonly delayMs: number
    readonly sizeRem: number
}

export const QuizSharePage = () => {
    const workspaceId = useWorkspaceId()
    const { id: quizId } = useParams()
    const [quiz, setQuiz] = useState<Quiz | undefined>(undefined)
    const [cohorts, setCohorts] = useState<readonly QuizCohort[]>([])
    const [draft, setDraft] = useState('')
    const [error, setError] = useState<CohortInlineError | null>(null)
    const [activeQrCode, setActiveQrCode] = useState<ActiveQrCode | null>(null)
    const [copiedKey, setCopiedKey] = useState<string | null>(null)
    const [editing, setEditing] = useState<{ readonly guid: string; readonly name: string } | null>(null)
    const [shareBirds, setShareBirds] = useState<readonly ShareBird[]>([])
    const [liveStatsOpen, setLiveStatsOpen] = useState(false)
    const [liveStatsRows, setLiveStatsRows] = useState<
        readonly { readonly order: number; readonly cohort: string; readonly points: number }[]
    >([])
    const shareClickRef = useRef<{ readonly key: string; readonly count: number; readonly lastClickAt: number } | null>(
        null,
    )

    useApi(
        quizId,
        id => fetchWorkspaceQuiz(workspaceId, id),
        loaded => {
            setQuiz(loaded)
            setCohorts(loaded.cohorts ?? [])
        },
    )

    useEffect(() => {
        if (activeQrCode) {
            document.body.style.overflow = 'hidden'
            return () => {
                document.body.style.overflow = ''
            }
        }
    }, [activeQrCode])

    useEffect(() => {
        if (!error) return

        const timeoutId = window.setTimeout(() => {
            setError(current => (current === error ? null : current))
        }, 2000)

        return () => window.clearTimeout(timeoutId)
    }, [error])

    useEffect(() => {
        if (!liveStatsOpen || !quizId) return

        const loadLiveStats = async () => {
            const response = await fetchQuizLiveStats(workspaceId, quizId)
            setLiveStatsRows(response.cohorts)
        }

        void loadLiveStats()
        const intervalId = window.setInterval(() => {
            void loadLiveStats()
        }, LIVE_STATS_POLL_MS)

        return () => window.clearInterval(intervalId)
    }, [liveStatsOpen, quizId, workspaceId])

    if (!quiz) return null

    const takeUrl = `${window.location.origin}${urls.quizWelcome(quiz.id)}`
    const editErrorTarget = (guid: string): CohortErrorTarget => `edit:${guid}`

    const showCohortError = (target: CohortErrorTarget, code: CohortCreateError) => setError({ target, code })

    const clearCohortError = (target?: CohortErrorTarget) => {
        setError(current => (current && (!target || current.target === target) ? null : current))
    }

    const refreshQuiz = async () => {
        const updated = await fetchWorkspaceQuiz(workspaceId, String(quiz.id))
        setQuiz(updated)
        setCohorts(updated.cohorts ?? [])
    }

    const copyLink = async (key: string, url: string) => {
        await navigator.clipboard.writeText(url)
        setCopiedKey(key)
    }

    const shareClickCount = (key: string) => {
        const now = Date.now()
        const previous = shareClickRef.current
        const count =
            previous && previous.key === key && now - previous.lastClickAt <= SHARE_FLOCK_CLICK_WINDOW_MS
                ? previous.count + 1
                : 1

        shareClickRef.current = count >= 3 ? null : { key, count, lastClickAt: now }
        return count
    }

    const scheduleShareBirdRemoval = (ids: readonly number[], delayMs = SHARE_BIRD_REMOVE_DELAY_MS) => {
        window.setTimeout(() => {
            setShareBirds(current => current.filter(currentBird => !ids.includes(currentBird.id)))
        }, delayMs)
    }

    const launchShareBird = (event: MouseEvent<HTMLButtonElement>, key: string) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const startX = rect.left + rect.width / 2
        const startY = rect.top + rect.height / 2
        const endX = window.innerWidth - 36
        const endY = 34
        const repeatedClickCount = shareClickCount(key)
        const bird: ShareBird = {
            id: Date.now() + Math.random(),
            flock: false,
            startX,
            startY,
            midX: startX + (endX - startX) * 0.5,
            midY: Math.min(startY - 120, startY + (endY - startY) * 0.35),
            endX,
            endY,
            delayMs: 120,
            sizeRem: 4,
        }

        if (repeatedClickCount >= 3) {
            const flock = SHARE_FLOCK_OFFSETS.map((offset, index): ShareBird => {
                const flockEndX = Math.min(window.innerWidth - 18, Math.max(18, endX + offset.endX))
                const flockEndY = Math.max(18, endY + offset.endY)
                return {
                    id: Date.now() + Math.random() + index,
                    flock: true,
                    startX: startX + offset.startX,
                    startY: startY + offset.startY,
                    midX: startX + (flockEndX - startX) * 0.5 + offset.midX,
                    midY: Math.min(startY - 100 + offset.midY, startY + (flockEndY - startY) * 0.35),
                    endX: flockEndX,
                    endY: flockEndY,
                    delayMs: 650 + offset.delay,
                    sizeRem: offset.size,
                }
            })
            setShareBirds(flock)
            scheduleShareBirdRemoval(
                flock.map(flockBird => flockBird.id),
                SHARE_FLOCK_REMOVE_DELAY_MS,
            )
            return
        }

        setShareBirds(current => [...current, bird])
        scheduleShareBirdRemoval([bird.id])
    }

    const handleShareClick = async (event: MouseEvent<HTMLButtonElement>, key: string, url: string) => {
        launchShareBird(event, key)
        await copyLink(key, url)
    }

    const handleAdd = async () => {
        const name = draft
        const result = await createCohort(workspaceId, quiz.id, name)
        if (result.ok) {
            setDraft('')
            await refreshQuiz()
            clearCohortError()
        } else {
            showCohortError('add', result.error)
        }
    }

    const handleSaveEdit = async (cohort: QuizCohort) => {
        if (!editing || editing.guid !== cohort.guid) return
        const errorTarget = editErrorTarget(cohort.guid)
        const result = await updateCohort(workspaceId, quiz.id, cohort.guid, editing.name)
        if (result.ok) {
            await refreshQuiz()
            setEditing(null)
            clearCohortError()
        } else {
            showCohortError(errorTarget, result.error)
        }
    }

    const handleDelete = async (cohort: QuizCohort) => {
        if (!cohort.canDelete) return
        await deleteCohort(workspaceId, quiz.id, cohort.guid)
        await refreshQuiz()
        clearCohortError()
        if (activeQrCode?.key === cohort.guid) setActiveQrCode(null)
    }

    const renderCohortError = (target: CohortErrorTarget) =>
        error?.target === target && (
            <div className="cohort-inline-error">
                <Alert type="error" dataTestId={error.code}>
                    {cohortErrorMessages[error.code]}
                </Alert>
            </div>
        )

    const renderHiddenLink = (id: string | undefined, className: string, url: string) => (
        <a id={id} className={`share-link-source ${className}`} href={url} aria-hidden="true" tabIndex={-1}>
            {url}
        </a>
    )

    const renderShareActions = (
        key: string,
        label: string,
        url: string,
        qrTestId: string,
        options?: { readonly showLiveStats?: boolean },
    ) => (
        <div className="share-actions">
            <Button
                className="button secondary"
                onClick={() => setActiveQrCode({ key, label, testId: qrTestId, url })}
                aria-haspopup="dialog"
            >
                Show QR code
            </Button>
            <Button
                className="button secondary"
                data-testid={`share-link-${key}`}
                onClick={event => void handleShareClick(event, key, url)}
            >
                {copiedKey === key ? 'Copied' : 'Share'}
            </Button>
            <HelpTooltip label={`Share ${label}`}>Copies the take link to the clipboard.</HelpTooltip>
            {options?.showLiveStats && (
                <>
                    <Button
                        className="button secondary"
                        data-testid="live-stats-button"
                        onClick={() => setLiveStatsOpen(true)}
                    >
                        Live stats
                    </Button>
                    <HelpTooltip label="Live stats">
                        Opens live cohort standings by weighted points while participants answer the quiz.
                    </HelpTooltip>
                </>
            )}
        </div>
    )

    const renderLiveStatsPanel = () => {
        if (!liveStatsOpen) return null
        return createPortal(
            <div
                className="live-stats-panel"
                data-testid="live-stats-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="live-stats-title"
            >
                <div className="live-stats-backdrop" onClick={() => setLiveStatsOpen(false)} />
                <div className="live-stats-dialog">
                    <div className="live-stats-header">
                        <h2 id="live-stats-title">Live stats</h2>
                        <Button className="button secondary" onClick={() => setLiveStatsOpen(false)}>
                            Close
                        </Button>
                    </div>
                    <table className="live-stats-table" data-testid="cohort-live-stats-table">
                        <caption>Cohort live stats</caption>
                        <thead>
                            <tr>
                                <th scope="col">Order</th>
                                <th scope="col">Cohort</th>
                                <th scope="col">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liveStatsRows.map(entry => (
                                <tr key={entry.cohort}>
                                    <td>{entry.order}</td>
                                    <td>{entry.cohort}</td>
                                    <td>{entry.points}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>,
            document.body,
        )
    }

    const renderQrModal = () => {
        if (!activeQrCode) return null
        const themeImage = currentQrThemeImage()
        return createPortal(
            <div className="share-qr-modal" role="dialog" aria-modal="true" aria-labelledby="share-qr-title">
                <div className="share-qr-backdrop" onClick={() => setActiveQrCode(null)} />
                <div className="share-qr-dialog">
                    <div className="share-qr-header">
                        <h2 id="share-qr-title">{activeQrCode.label}</h2>
                        <Button className="button secondary" onClick={() => setActiveQrCode(null)}>
                            Close
                        </Button>
                    </div>
                    <div
                        className="share-qr-code"
                        data-testid={activeQrCode.testId}
                        data-qr-value={activeQrCode.url}
                        data-qr-theme-image={themeImage ?? 'none'}
                    >
                        <QRCodeSVG
                            value={activeQrCode.url}
                            size={480}
                            level="H"
                            imageSettings={
                                themeImage
                                    ? {
                                          src: QR_THEME_IMAGES[themeImage],
                                          height: 96,
                                          width: 96,
                                          excavate: true,
                                      }
                                    : undefined
                            }
                        />
                    </div>
                </div>
            </div>,
            document.body,
        )
    }

    const renderShareBirds = () =>
        createPortal(
            <>
                {shareBirds.map(bird => (
                    <span
                        key={bird.id}
                        className="share-bird"
                        data-testid="share-bird"
                        data-flight-target="top-right"
                        data-flock={bird.flock}
                        style={
                            {
                                '--share-bird-x': `${bird.startX}px`,
                                '--share-bird-y': `${bird.startY}px`,
                                '--share-bird-mid-x': `${bird.midX}px`,
                                '--share-bird-mid-y': `${bird.midY}px`,
                                '--share-bird-end-x': `${bird.endX}px`,
                                '--share-bird-end-y': `${bird.endY}px`,
                                '--share-bird-delay': `${bird.delayMs}ms`,
                                '--share-bird-size': `${bird.sizeRem}rem`,
                            } as CSSProperties
                        }
                        aria-hidden="true"
                    >
                        <img className="share-bird__image" src={SHARE_BIRD_GIF_URL} alt="" />
                    </span>
                ))}
            </>,
            document.body,
        )

    return (
        <Page
            title={`Share ${quiz.title}`}
            id="share-page"
            back={{ to: urls.workspace(workspaceId), label: 'Back to workspace' }}
        >
            {renderShareBirds()}
            <section>
                <h2>Take link</h2>
                <FieldNote id="general-take-link-note">
                    The general take link lets participants join without assigning them to a cohort.
                </FieldNote>
                {renderHiddenLink('quiz-take-link', '', takeUrl)}
                {renderShareActions(quizQrKey, quiz.title, takeUrl, 'quiz-take-qr', {
                    showLiveStats: cohorts.length > 0,
                })}
            </section>
            <section>
                <h2>Cohorts</h2>
                <FieldNote id="cohort-take-link-note">
                    Each cohort receives a unique take link, and its attempts contribute to the cohort leaderboard.
                </FieldNote>
                {cohorts.length === 0 && <p id="no-cohorts">No cohorts yet</p>}
                {cohorts.length > 0 && (
                    <ul id="cohort-list">
                        {cohorts.map(cohort => {
                            const cohortUrl = `${window.location.origin}${urls.quizWelcomeWithCohort(quiz.id, cohort.guid)}`
                            return (
                                <li key={cohort.guid} className="cohort-row" data-name={cohort.name}>
                                    {editing?.guid === cohort.guid ? (
                                        <div className="cohort-edit">
                                            <input
                                                className="cohort-edit-input"
                                                type="text"
                                                value={editing.name}
                                                onChange={event =>
                                                    setEditing({ guid: cohort.guid, name: event.target.value })
                                                }
                                            />
                                            <Button className="button secondary" onClick={() => handleSaveEdit(cohort)}>
                                                Save
                                            </Button>
                                            {renderCohortError(editErrorTarget(cohort.guid))}
                                            <Button
                                                className="button secondary"
                                                onClick={() => {
                                                    setEditing(null)
                                                    clearCohortError(editErrorTarget(cohort.guid))
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="cohort-name">{cohort.name}</span>
                                            {renderHiddenLink(undefined, 'cohort-link', cohortUrl)}
                                            <div className="cohort-actions-row">
                                                {renderShareActions(
                                                    cohort.guid,
                                                    cohort.name,
                                                    cohortUrl,
                                                    `cohort-qr-${cohort.guid}`,
                                                )}
                                                <div className="cohort-management">
                                                    <Button
                                                        className="button secondary"
                                                        onClick={() => {
                                                            clearCohortError()
                                                            setEditing({ guid: cohort.guid, name: cohort.name })
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        className="button secondary"
                                                        onClick={() => handleDelete(cohort)}
                                                        disabled={!cohort.canDelete}
                                                    >
                                                        Delete
                                                    </Button>
                                                    {!cohort.canDelete && (
                                                        <FieldNote id={`cohort-delete-note-${cohort.guid}`}>
                                                            Cohorts with attempts cannot be deleted.
                                                        </FieldNote>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                )}
                <div className="cohort-add">
                    <input
                        id="cohort-name-input"
                        type="text"
                        value={draft}
                        onChange={event => setDraft(event.target.value)}
                        placeholder="Cohort name"
                    />
                    <Button id="add-cohort-button" className="button primary" onClick={handleAdd}>
                        Add cohort
                    </Button>
                    {renderCohortError('add')}
                </div>
            </section>
            {renderLiveStatsPanel()}
            {renderQrModal()}
        </Page>
    )
}
