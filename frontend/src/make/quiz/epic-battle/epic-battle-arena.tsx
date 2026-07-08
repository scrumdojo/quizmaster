import { useEffect, useRef } from 'react'

import { type BattleScene, createBattleScene } from '#fe/make/quiz/epic-battle/battle-scene.ts'

export interface EpicBattleArmy {
    readonly side: 'left' | 'right'
    readonly cohort: string
    readonly points: number
    readonly hits: number
    readonly status: 'winning' | 'losing' | 'even'
}

interface EpicBattleArenaProps {
    readonly armies: readonly [EpicBattleArmy, EpicBattleArmy]
}

const TEAM_COLOR: Record<'left' | 'right', string> = { left: '#d6483f', right: '#3f7fd6' }

const StandardSvg = ({ color }: { color: string }) => (
    <svg viewBox="0 0 60 170" width="60" height="170" aria-hidden="true">
        {/* pole */}
        <rect x="28" y="18" width="4" height="150" rx="2" fill="#8a6a3a" />
        {/* aquila (legion eagle) */}
        <circle cx="30" cy="14" r="7" fill="#e7c56b" />
        <path d="M14 20 q16 -12 32 0 q-16 -4 -32 0 z" fill="#e7c56b" />
        <path d="M30 8 l4 6 -8 0 z" fill="#c99a3a" />
        {/* banner cloth in team colour */}
        <path d="M14 30 h32 v40 l-16 -8 -16 8 z" fill={color} />
        <text x="30" y="52" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff4d6" fontFamily="serif">
            SPQR
        </text>
        {/* crossbar */}
        <rect x="12" y="28" width="36" height="4" rx="2" fill="#c99a3a" />
    </svg>
)

export const EpicBattleArena = ({ armies }: EpicBattleArenaProps) => {
    const mountRef = useRef<HTMLDivElement>(null)
    const sceneRef = useRef<BattleScene | null>(null)
    const bannerRefs = useRef<Array<HTMLDivElement | null>>([null, null])
    const armiesRef = useRef(armies)
    armiesRef.current = armies
    const prevHitsRef = useRef<[number, number]>([armies[0].hits, armies[1].hits])

    // The Pixi scene is decorative. `window.__noEpicBattleScene` lets E2E skip
    // WebGL/asset loading entirely — the DOM standards below still animate.
    useEffect(() => {
        if (window.__noEpicBattleScene) return
        const mount = mountRef.current
        if (!mount) return

        let cancelled = false
        let scene: BattleScene | undefined

        createBattleScene(mount)
            .then(created => {
                if (cancelled) {
                    created.destroy()
                    return
                }
                scene = created
                sceneRef.current = created
                const [left, right] = armiesRef.current
                created.setArmies(left, right)
            })
            .catch((error: unknown) => {
                console.error('Epic Battle scene failed to start', error)
            })

        return () => {
            cancelled = true
            sceneRef.current = null
            scene?.destroy()
        }
    }, [])

    // Push fresh stats into the scene and fire a cinematic blow when a cohort's
    // hit count rises.
    useEffect(() => {
        const scene = sceneRef.current
        const [left, right] = armies
        if (scene) {
            scene.setArmies(left, right)
            const [prevLeft, prevRight] = prevHitsRef.current
            if (left.hits > prevLeft) scene.triggerHit('left')
            if (right.hits > prevRight) scene.triggerHit('right')
        }
        prevHitsRef.current = [left.hits, right.hits]
    }, [armies])

    // Independent sway loop for the standards — the E2E "armies clashing" check
    // polls a battle-soldier bounding box, so this must move regardless of Pixi.
    useEffect(() => {
        let frameId: number
        const start = performance.now()
        const animate = (now: number) => {
            const elapsed = now - start
            bannerRefs.current.forEach((el, index) => {
                if (!el) return
                const direction = index === 0 ? 1 : -1
                const sway = Math.sin(elapsed / 380 + index * 1.3) * 12
                const tilt = direction * (3 + Math.sin(elapsed / 520 + index) * 2)
                el.style.transform = `translateX(${direction * sway}px) rotate(${tilt}deg)`
            })
            frameId = requestAnimationFrame(animate)
        }
        frameId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return (
        <div className="epic-battle-arena" data-testid="battlefield" data-clashing="true">
            <div className="epic-battle-arena__scene" ref={mountRef} />
            {armies.map((army, index) => (
                <div
                    key={army.side}
                    className={`epic-battle-standard epic-battle-standard--${army.side} epic-battle-standard--${army.status}`}
                    data-testid="battle-soldier"
                    data-side={army.side}
                    ref={el => {
                        bannerRefs.current[index] = el
                    }}
                >
                    <StandardSvg color={TEAM_COLOR[army.side]} />
                    <span className="epic-battle-standard__label">{army.cohort}</span>
                </div>
            ))}
        </div>
    )
}
