import { lazy, Suspense, useEffect, useState } from 'react'
import { useParams } from 'react-router'
import './epic-battle-page.scss'
import { fetchQuizEpicBattle, fetchWorkspaceQuiz } from '#fe/make/api/quiz.ts'
import type { EpicBattleArmy } from '#fe/make/quiz/epic-battle/epic-battle-arena.tsx'

// Lazy so PixiJS (pulled in by the arena) is split off the main bundle.
const EpicBattleArena = lazy(() =>
    import('#fe/make/quiz/epic-battle/epic-battle-arena.tsx').then(module => ({ default: module.EpicBattleArena })),
)
import { Page } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import type { Quiz } from '#fe/shared/model/quiz.ts'
import { useWorkspaceId } from '#fe/urls.ts'
import type { EpicBattleCohort } from '#shared/types/quiz.ts'

const EPIC_BATTLE_POLL_MS = 2000

const statusFor = (own: number, other: number): EpicBattleArmy['status'] => {
    if (own > other) return 'winning'
    if (own < other) return 'losing'
    return 'even'
}

export const EpicBattlePage = () => {
    const workspaceId = useWorkspaceId()
    const { id: quizId } = useParams()
    const [quiz, setQuiz] = useState<Quiz | undefined>(undefined)
    const [cohortStats, setCohortStats] = useState<readonly EpicBattleCohort[]>([])

    useApi(quizId, id => fetchWorkspaceQuiz(workspaceId, id), setQuiz)

    useEffect(() => {
        if (!quizId) return

        const loadEpicBattle = async () => {
            const response = await fetchQuizEpicBattle(workspaceId, quizId)
            setCohortStats(response.cohorts)
        }

        void loadEpicBattle()
        const intervalId = window.setInterval(() => {
            void loadEpicBattle()
        }, EPIC_BATTLE_POLL_MS)

        return () => window.clearInterval(intervalId)
    }, [quizId, workspaceId])

    if (!quiz) return null

    const cohorts = quiz.cohorts ?? []
    if (cohorts.length !== 2) return null

    const statsByName = new Map(cohortStats.map(entry => [entry.cohort, entry]))
    const statFor = (name: string): EpicBattleCohort => statsByName.get(name) ?? { cohort: name, points: 0, hits: 0 }

    const left = statFor(cohorts[0].name)
    const right = statFor(cohorts[1].name)

    const armies: readonly [EpicBattleArmy, EpicBattleArmy] = [
        {
            side: 'left',
            cohort: left.cohort,
            points: left.points,
            hits: left.hits,
            status: statusFor(left.points, right.points),
        },
        {
            side: 'right',
            cohort: right.cohort,
            points: right.points,
            hits: right.hits,
            status: statusFor(right.points, left.points),
        },
    ]

    return (
        <Page id="epic-battle-page" title={`Epic Battle — ${quiz.title}`}>
            <div className="epic-battle-armies">
                {armies.map(army => (
                    <div
                        key={army.cohort}
                        className={`roman-army roman-army--${army.side} roman-army--${army.status}`}
                        data-testid="roman-army"
                        data-cohort={army.cohort}
                        data-hits={army.hits}
                        data-status={army.status}
                    >
                        <span className="roman-army__label">{army.cohort}</span>
                        <span className="roman-army__hits">{army.hits} hits</span>
                        <span className="roman-army__status">{army.status}</span>
                    </div>
                ))}
            </div>
            <Suspense fallback={null}>
                <EpicBattleArena armies={armies} />
            </Suspense>
        </Page>
    )
}
