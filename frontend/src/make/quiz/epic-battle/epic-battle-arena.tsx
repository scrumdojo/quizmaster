import { useEffect, useRef } from 'react'

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

const SOLDIERS_PER_LEGION = 6

export const EpicBattleArena = ({ armies }: EpicBattleArenaProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const soldierRefs = useRef<readonly (HTMLDivElement | null)[]>([null, null])
    const sparkRef = useRef<HTMLDivElement>(null)
    const armiesRef = useRef(armies)
    armiesRef.current = armies
    const prevHitsRef = useRef(armies[0].hits + armies[1].hits)

    useEffect(() => {
        let frameId: number
        const start = performance.now()

        const drawLegion = (
            ctx: CanvasRenderingContext2D,
            baseX: number,
            direction: number,
            height: number,
            color: string,
            intensity: number,
            t: number,
        ) => {
            for (let i = 0; i < SOLDIERS_PER_LEGION; i++) {
                const oscillation = Math.sin(t / 260 + i * 0.7) * (10 + intensity * 6)
                const x = baseX + direction * (i * 16 + oscillation)
                const y = height - 40 - (i % 2) * 6
                ctx.fillStyle = color
                ctx.fillRect(x - 4, y - 16, 8, 16)
                ctx.beginPath()
                ctx.arc(x, y - 20, 4, 0, Math.PI * 2)
                ctx.fill()
            }
        }

        const draw = (ctx: CanvasRenderingContext2D, width: number, height: number, t: number) => {
            const [left, right] = armiesRef.current
            ctx.clearRect(0, 0, width, height)
            ctx.fillStyle = '#2b3a4a'
            ctx.fillRect(0, height - 24, width, 24)

            const totalPoints = left.points + right.points
            const leftShare = totalPoints > 0 ? left.points / totalPoints : 0.5
            const clashX = width * (0.25 + leftShare * 0.5)

            drawLegion(ctx, clashX - 20, -1, height, '#b03a2e', 1 + left.hits * 0.1, t)
            drawLegion(ctx, clashX + 20, 1, height, '#1f618d', 1 + right.hits * 0.1, t)
        }

        const loop = (time: number) => {
            const canvas = canvasRef.current
            if (canvas) {
                const ctx = canvas.getContext('2d')
                if (ctx) draw(ctx, canvas.width, canvas.height, time - start)
            }

            const [left, right] = armiesRef.current
            soldierRefs.current.forEach((el, index) => {
                if (!el) return
                const isLeft = index === 0
                const army = isLeft ? left : right
                const direction = isLeft ? 1 : -1
                const sway = Math.sin(time / 220 + index * 1.3) * (12 + army.hits)
                el.style.transform = `translateX(${direction * sway}px)`
            })

            const totalHits = left.hits + right.hits
            if (totalHits !== prevHitsRef.current) {
                prevHitsRef.current = totalHits
                const spark = sparkRef.current
                if (spark) {
                    spark.classList.remove('epic-battle-spark--active')
                    void spark.offsetWidth
                    spark.classList.add('epic-battle-spark--active')
                }
            }

            frameId = requestAnimationFrame(loop)
        }

        frameId = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(frameId)
    }, [])

    return (
        <div className="epic-battle-arena" data-testid="battlefield" data-clashing="true">
            <canvas ref={canvasRef} width={960} height={360} className="epic-battle-canvas" />
            <div className="epic-battle-spark" data-testid="battle-spark" ref={sparkRef} />
            <div
                className="epic-battle-soldier epic-battle-soldier--left"
                data-testid="battle-soldier"
                data-side="left"
                ref={el => {
                    soldierRefs.current = [el, soldierRefs.current[1]]
                }}
            />
            <div
                className="epic-battle-soldier epic-battle-soldier--right"
                data-testid="battle-soldier"
                data-side="right"
                ref={el => {
                    soldierRefs.current = [soldierRefs.current[0], el]
                }}
            />
        </div>
    )
}
