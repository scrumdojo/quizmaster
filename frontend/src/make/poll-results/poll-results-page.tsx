import './poll-results-page.scss'
import { useCallback, useState } from 'react'
import { useParams } from 'react-router'

import { fetchWorkspacePoll, fetchWorkspacePollResults } from '#fe/make/api/poll.ts'
import { useApi } from '#fe/shared/api/hooks.ts'
import { Page } from '#fe/shared/page.tsx'
import { urls } from '#fe/urls.ts'
import type { PollResultsResponse, PollTake } from '#shared/types/poll.ts'

export const PollResultsPage = () => {
    const params = useParams()
    const workspaceId = params.workspaceId ?? ''
    const [poll, setPoll] = useState<PollTake>()
    const [results, setResults] = useState<PollResultsResponse>()

    const fetchPollResults = useCallback((id: string) => fetchWorkspacePollResults(workspaceId, id), [workspaceId])

    useApi(params.id, id => fetchWorkspacePoll(workspaceId, id), setPoll)
    useApi(params.id, fetchPollResults, setResults)

    return poll && results ? (
        <Page
            id="poll-results-page"
            title="Poll results"
            subtitle={`See how respondents voted on "${poll.question}".`}
            back={{ to: urls.workspace(workspaceId), label: 'Back to workspace' }}
        >
            <section className="poll-results" aria-labelledby="poll-results-question">
                <h2 id="poll-results-question" data-testid="poll-results-question" className="poll-results__question">
                    {poll.question}
                </h2>

                <table className="poll-results__table" data-testid="poll-results-table">
                    <caption>Results</caption>
                    <thead>
                        <tr>
                            <th scope="col">Answer</th>
                            <th scope="col">Votes</th>
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
