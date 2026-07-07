import './poll-results-page.scss'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import { fetchWorkspacePoll, fetchWorkspacePollResults } from '#fe/make/api/poll.ts'
import { useApi } from '#fe/shared/api/hooks.ts'
import { Page } from '#fe/shared/page.tsx'
import { urls } from '#fe/urls.ts'
import type { PollResultsResponse, PollTake } from '#shared/types/poll.ts'

const RESULTS_REFRESH_MS = 2000

export const PollResultsPage = () => {
    const { t } = useLanguage()
    const params = useParams()
    const workspaceId = params.workspaceId ?? ''
    const [poll, setPoll] = useState<PollTake>()
    const [results, setResults] = useState<PollResultsResponse>()

    const fetchPollResults = useCallback((id: string) => fetchWorkspacePollResults(workspaceId, id), [workspaceId])

    useApi(params.id, id => fetchWorkspacePoll(workspaceId, id), setPoll)
    useApi(params.id, fetchPollResults, setResults)

    const pollId = params.id
    useEffect(() => {
        if (!pollId) return

        const intervalId = window.setInterval(() => {
            void fetchPollResults(pollId).then(setResults)
        }, RESULTS_REFRESH_MS)

        return () => window.clearInterval(intervalId)
    }, [pollId, fetchPollResults])

    const takeUrl = poll ? `${window.location.origin}${urls.pollTake(poll.id)}` : ''

    return poll && results ? (
        <Page
            id="poll-results-page"
            title={t.poll.resultsTitle}
            subtitle={t.poll.resultsSubtitle(poll.question)}
            back={{ to: urls.workspace(workspaceId), label: t.question.backToWorkspace }}
        >
            <section className="poll-results" aria-labelledby="poll-results-question">
                <h2 id="poll-results-question" data-testid="poll-results-question" className="poll-results__question">
                    {poll.question}
                </h2>

                <aside className="poll-share" aria-label={t.poll.takeThisPollAriaLabel}>
                    <div className="poll-share__qr" data-testid="poll-take-qr" data-qr-value={takeUrl}>
                        <QRCodeSVG value={takeUrl} size={200} level="H" />
                    </div>
                    <a className="poll-share__link" data-testid="poll-take-link" href={takeUrl}>
                        {takeUrl}
                    </a>
                </aside>

                <table className="poll-results__table" data-testid="poll-results-table">
                    <caption>{t.poll.resultsCaption}</caption>
                    <thead>
                        <tr>
                            <th scope="col">{t.poll.colAnswer}</th>
                            <th scope="col">{t.poll.colVotes}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.answers.map(answer => (
                            <tr key={answer.answerId} data-testid={`poll-results-row-${answer.answerId}`}>
                                <th scope="row">{answer.text}</th>
                                <td>{answer.voteCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </Page>
    ) : null
}
