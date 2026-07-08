import { Application, Assets, Container, FillGradient, Graphics, Sprite, type Texture, type Ticker } from 'pixi.js'

// Imperative PixiJS battle scene for the Epic Battle page. It is purely
// decorative: the React layer owns all test-visible DOM (army cards + waving
// standards), so this module never has to exist for the E2E specs to pass.
// createBattleScene mounts a WebGL canvas into `mount`, renders two clashing
// legions over a procedural battlefield, and exposes a tiny imperative API.

export interface BattleArmyInput {
    readonly side: 'left' | 'right'
    readonly points: number
    readonly hits: number
    readonly status: 'winning' | 'losing' | 'even'
}

export interface BattleScene {
    setArmies: (left: BattleArmyInput, right: BattleArmyInput) => void
    triggerHit: (side: 'left' | 'right') => void
    destroy: () => void
}

const ASSET_BASE = '/epic-battle'
const TEAM_TINT: Record<'left' | 'right', number> = { left: 0xd6483f, right: 0x3f7fd6 }
const SOLDIERS_PER_LEGION = 26

interface Soldier {
    readonly container: Container
    readonly side: 'left' | 'right'
    readonly advance: number // 0 = front line, 1 = own rear edge
    readonly depth: number // 0 = closest/bottom, 1 = far/top
    readonly phase: number
    readonly bobSpeed: number
}

interface Particle {
    readonly display: Container
    readonly tick: (dtSec: number) => boolean // returns false when the particle is dead
}

const rand = (min: number, max: number) => min + Math.random() * (max - min)

const makeSoldier = (side: 'left' | 'right', textures: SceneTextures): Soldier => {
    const container = new Container()

    const body = new Sprite(textures.legionary)
    body.anchor.set(0.5, 1)

    const shield = new Sprite(textures.scutum)
    shield.anchor.set(0.5, 0.5)
    shield.scale.set(0.82)
    shield.position.set(11, -46)
    shield.tint = TEAM_TINT[side]

    const crest = new Sprite(textures.crest)
    crest.anchor.set(0.5, 1)
    crest.scale.set(0.62)
    crest.position.set(-1, -86)
    crest.tint = TEAM_TINT[side]

    container.addChild(body, crest, shield)

    return {
        container,
        side,
        advance: Math.random(),
        depth: Math.random(),
        phase: rand(0, Math.PI * 2),
        bobSpeed: rand(1.8, 3.2),
    }
}

interface SceneTextures {
    readonly legionary: Texture
    readonly scutum: Texture
    readonly crest: Texture
    readonly spark: Texture
    readonly pilum: Texture
}

const loadTextures = async (): Promise<SceneTextures> => {
    const [legionary, scutum, crest, spark, pilum] = await Promise.all([
        Assets.load<Texture>(`${ASSET_BASE}/legionary.svg`),
        Assets.load<Texture>(`${ASSET_BASE}/scutum.svg`),
        Assets.load<Texture>(`${ASSET_BASE}/crest.svg`),
        Assets.load<Texture>(`${ASSET_BASE}/spark.svg`),
        Assets.load<Texture>(`${ASSET_BASE}/pilum.svg`),
    ])
    return { legionary, scutum, crest, spark, pilum }
}

export const createBattleScene = async (mount: HTMLElement): Promise<BattleScene> => {
    const app = new Application()
    await app.init({
        resizeTo: mount,
        backgroundAlpha: 0,
        antialias: true,
        autoDensity: true,
        resolution: Math.min(window.devicePixelRatio || 1, 2),
    })
    mount.appendChild(app.canvas)

    const textures = await loadTextures()

    // world holds everything and is offset for screen shake.
    const world = new Container()
    const bg = new Graphics()
    const legionBack = new Container()
    const legionFront = new Container()
    const projectiles = new Container()
    const fx = new Container()
    world.addChild(bg, legionBack, legionFront, projectiles, fx)
    app.stage.addChild(world)

    // Build both legions once (a full field), sorted far-to-near for correct
    // painter ordering. Dominance is shown by pushing the front line and
    // attack intensity — not head-count — so the field always looks full.
    const soldiers: Soldier[] = []
    for (const side of ['left', 'right'] as const) {
        for (let i = 0; i < SOLDIERS_PER_LEGION; i++) soldiers.push(makeSoldier(side, textures))
    }
    soldiers.sort((a, b) => b.depth - a.depth)
    for (const s of soldiers) (s.depth > 0.5 ? legionBack : legionFront).addChild(s.container)

    const state = {
        left: { points: 0, hits: 0 } as { points: number; hits: number },
        right: { points: 0, hits: 0 } as { points: number; hits: number },
    }
    const hitPulse = { left: 0, right: 0 }
    let frontX = 0
    let shake = 0
    let ambientTimer = 0
    let lastW = 0
    let lastH = 0
    const particles: Particle[] = []

    const drawBackground = (w: number, h: number, groundY: number) => {
        bg.clear()
        const sky = new FillGradient(0, 0, 0, groundY)
        sky.addColorStop(0, 0x1c2b44)
        sky.addColorStop(0.55, 0x50617a)
        sky.addColorStop(1, 0xc59a6a)
        bg.rect(0, 0, w, groundY).fill(sky)

        // setting sun on the horizon — drawn before the hills so they occlude
        // its lower half into a proper horizon disc.
        bg.circle(w * 0.5, groundY - 26, 82).fill({ color: 0xffcf87, alpha: 0.2 })
        bg.circle(w * 0.5, groundY - 26, 40).fill({ color: 0xffe3ad, alpha: 0.92 })

        // rolling hills (two parallax bands)
        bg.moveTo(0, groundY)
        for (let x = 0; x <= w; x += 80) bg.lineTo(x, groundY - 40 - Math.sin(x / 130) * 22)
        bg.lineTo(w, groundY).lineTo(0, groundY).fill({ color: 0x3f5138, alpha: 0.9 })
        bg.moveTo(0, groundY)
        for (let x = 0; x <= w; x += 60) bg.lineTo(x, groundY - 14 - Math.sin(x / 90 + 2) * 14)
        bg.lineTo(w, groundY).lineTo(0, groundY).fill({ color: 0x4d6142, alpha: 1 })

        // trampled battlefield ground
        const dirt = new FillGradient(0, groundY, 0, h)
        dirt.addColorStop(0, 0x5a4a33)
        dirt.addColorStop(1, 0x3a2e20)
        bg.rect(0, groundY, w, h - groundY).fill(dirt)
        for (let i = 0; i < w / 24; i++) {
            const gx = (i * 24 + 12) % w
            bg.ellipse(gx, groundY + 6 + ((i * 37) % (h - groundY - 8)), 7, 2).fill({ color: 0x2c2216, alpha: 0.4 })
        }
    }

    const spawnFlash = (x: number, y: number) => {
        const g = new Graphics()
        g.circle(0, 0, 34).fill({ color: 0xfff3cf, alpha: 0.9 })
        g.position.set(x, y)
        g.blendMode = 'add'
        fx.addChild(g)
        let life = 0.32
        particles.push({
            display: g,
            tick: dt => {
                life -= dt
                g.scale.set(1 + (0.32 - life) * 5)
                g.alpha = Math.max(0, life / 0.32) * 0.9
                return life > 0
            },
        })
    }

    const spawnSpark = (x: number, y: number, size: number) => {
        const s = new Sprite(textures.spark)
        s.anchor.set(0.5)
        s.position.set(x, y)
        s.scale.set(size * 0.4)
        s.rotation = rand(0, Math.PI)
        s.blendMode = 'add'
        fx.addChild(s)
        let life = 0.4
        particles.push({
            display: s,
            tick: dt => {
                life -= dt
                s.scale.set(size * (0.4 + (0.4 - life)))
                s.alpha = Math.max(0, life / 0.4)
                s.rotation += dt * 2
                return life > 0
            },
        })
    }

    const spawnDust = (x: number, y: number, count: number) => {
        for (let i = 0; i < count; i++) {
            const g = new Graphics()
            const r = rand(3, 7)
            g.circle(0, 0, r).fill({ color: 0xbfa985, alpha: 0.5 })
            g.position.set(x, y)
            fx.addChild(g)
            let life = rand(0.5, 0.9)
            const total = life
            const vx = rand(-24, 24)
            const vy = rand(-40, -14)
            particles.push({
                display: g,
                tick: dt => {
                    life -= dt
                    g.x += vx * dt
                    g.y += vy * dt
                    g.alpha = Math.max(0, (life / total) * 0.5)
                    g.scale.set(1 + (total - life))
                    return life > 0
                },
            })
        }
    }

    const spawnVolley = (side: 'left' | 'right', groundY: number) => {
        const dir = side === 'left' ? 1 : -1
        for (let i = 0; i < 7; i++) {
            const p = new Sprite(textures.pilum)
            p.anchor.set(0.5)
            p.position.set(frontX - dir * rand(90, 170), groundY - rand(20, 44))
            projectiles.addChild(p)
            let vx = dir * rand(260, 400)
            let vy = -rand(180, 300)
            const gravity = 620
            particles.push({
                display: p,
                tick: dt => {
                    vy += gravity * dt
                    p.x += vx * dt
                    p.y += vy * dt
                    p.rotation = Math.atan2(vy, vx)
                    if (p.y >= groundY - 4) {
                        spawnDust(p.x, groundY - 4, 2)
                        return false
                    }
                    return true
                },
            })
        }
    }

    const setArmies: BattleScene['setArmies'] = (left, right) => {
        state.left = { points: left.points, hits: left.hits }
        state.right = { points: right.points, hits: right.hits }
    }

    const triggerHit: BattleScene['triggerHit'] = side => {
        hitPulse[side] = 1
        shake = Math.max(shake, 15)
        const groundY = app.screen.height - Math.min(60, app.screen.height * 0.14)
        spawnFlash(frontX, groundY - 34)
        for (let i = 0; i < 5; i++) spawnSpark(frontX + rand(-24, 24), groundY - rand(20, 60), rand(0.7, 1.3))
        spawnDust(frontX, groundY - 8, 6)
        spawnVolley(side, groundY)
    }

    const update = (ticker: Ticker) => {
        const dt = Math.min(ticker.deltaMS / 1000, 0.05)
        const w = app.screen.width
        const h = app.screen.height
        const groundY = h - Math.min(60, h * 0.14)
        const fieldDepth = Math.min(h * 0.52, 260)

        if (w !== lastW || h !== lastH) {
            lastW = w
            lastH = h
            frontX = frontX || w * 0.5
            drawBackground(w, h, groundY)
        }

        const total = state.left.points + state.right.points
        const leftShare = total > 0 ? state.left.points / total : 0.5
        const targetFront = w * (0.2 + leftShare * 0.6)
        frontX += (targetFront - frontX) * Math.min(1, dt * 1.6)

        hitPulse.left = Math.max(0, hitPulse.left - dt * 1.6)
        hitPulse.right = Math.max(0, hitPulse.right - dt * 1.6)

        const leftEdge = 24
        const rightEdge = w - 24
        const t = ticker.lastTime / 1000

        for (const s of soldiers) {
            const dir = s.side === 'left' ? 1 : -1
            const nearEdge = s.side === 'left' ? leftEdge : rightEdge
            const bandStart = frontX - dir * 16
            const baseX = bandStart + (nearEdge - bandStart) * s.advance
            let jab = 0
            let tilt = 0
            if (s.advance < 0.32) {
                const lunge = Math.max(0, Math.sin(t * 3.2 + s.phase))
                jab = lunge * (5 + hitPulse[s.side] * 12) * dir
                tilt = lunge * 0.12 * dir
            }
            s.container.x = baseX + jab
            s.container.y = groundY - s.depth * fieldDepth + Math.sin(t * s.bobSpeed + s.phase) * 2.2
            const sc = 0.8 - s.depth * 0.34
            s.container.scale.set(dir * sc, sc)
            s.container.rotation = tilt
        }

        // Constant low-level clashing keeps the front line alive between answers.
        ambientTimer += dt
        if (ambientTimer > 0.3) {
            ambientTimer = 0
            const y = groundY - rand(10, fieldDepth * 0.5)
            spawnSpark(frontX + rand(-22, 22), y, rand(0.35, 0.7))
            if (Math.random() < 0.5) spawnDust(frontX + rand(-20, 20), groundY - 6, 1)
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            if (!particles[i].tick(dt)) {
                particles[i].display.destroy()
                particles.splice(i, 1)
            }
        }

        shake = Math.max(0, shake - dt * 60)
        world.x = shake > 0 ? rand(-shake, shake) : 0
        world.y = shake > 0 ? rand(-shake, shake) : 0
    }

    app.ticker.add(update)

    return {
        setArmies,
        triggerHit,
        destroy: () => {
            app.ticker.remove(update)
            app.destroy({ removeView: true }, { children: true })
        },
    }
}
