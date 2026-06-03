import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useParams } from 'react-router'
import './quiz-share-page.scss'
import {
    createCohort,
    deleteCohort,
    fetchWorkspaceQuiz,
    updateCohort,
    type CohortCreateError,
} from '#fe/make/api/quiz.ts'
import { Alert, Button, Page } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { QuizCohort } from '#shared/types/quiz.ts'

const quizQrKey = 'quiz-take'

type CohortErrorTarget = 'add' | `edit:${string}`

const cohortErrorMessages: Record<CohortCreateError, string> = {
    'empty-cohort-name': 'Name cannot be empty.',
    'duplicate-cohort-name': 'A cohort with this name already exists.',
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

    const renderShareActions = (key: string, label: string, url: string, qrTestId: string) => (
        <div className="share-actions">
            <Button
                className="button secondary"
                onClick={() => setActiveQrCode({ key, label, testId: qrTestId, url })}
                aria-haspopup="dialog"
            >
                Show QR code
            </Button>
            <Button className="button secondary" onClick={() => copyLink(key, url)}>
                {copiedKey === key ? 'Copied' : 'Share'}
            </Button>
        </div>
    )

    const renderQrModal = () => {
        if (!activeQrCode) return null
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
                    <div className="share-qr-code" data-testid={activeQrCode.testId} data-qr-value={activeQrCode.url}>
                        <QRCodeSVG value={activeQrCode.url} size={480} />
                    </div>
                </div>
            </div>,
            document.body,
        )
    }

    return (
        <Page
            title={`Share ${quiz.title}`}
            id="share-page"
            back={{ to: urls.workspace(workspaceId), label: 'Back to workspace' }}
        >
            <section>
                <h2>Take link</h2>
                {renderHiddenLink('quiz-take-link', '', takeUrl)}
                {renderShareActions(quizQrKey, quiz.title, takeUrl, 'quiz-take-qr')}
            </section>
            <section>
                <h2>Cohorts</h2>
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
            {renderQrModal()}
        </Page>
    )
}
