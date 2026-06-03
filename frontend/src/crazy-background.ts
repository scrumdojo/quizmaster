// ─── angel + heart types ─────────────────────────────────────────────────────

type Heart = {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    hue: number
    color?: string
}

type Angel = {
    x: number
    y: number
    vx: number
    vy: number
    flip: boolean
    wingAngle: number
    /** frame counter */
    t: number
    hearts: Heart[]
    shootCooldown: number
}

type Satan = {
    x: number
    y: number
    vx: number
    vy: number
    flip: boolean
    wingAngle: number
    tailAngle: number
    t: number
    hearts: Heart[]
    shootCooldown: number
}

type GiantSatan = Satan & {
    scale: number
    health: number
    spawnedAt: number
    expiresAt: number
    fireCooldown: number
    burstShotsLeft: number
    targetX: number
    targetY: number
}

type AngelCluster = {
    x: number
    y: number
    count: number
}

type SplatParticle = {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    color: string
    gravity?: number
    fade?: number
    shrink?: number
}

type FloatingText = {
    x: number
    y: number
    vy: number
    text: string
    opacity: number
    color: string
    size: number
}

type GoalStar = {
    x: number
    y: number
    size: number
    opacity: number
    rotation: number
    spin: number
    scale: number
    fill: string
    stroke: string
    glow: string
}

const GIANT_SATAN_SCALE = 2
const GIANT_SATAN_MIN_DELAY_MS = 30000
const GIANT_SATAN_MAX_DELAY_MS = 60000
const GIANT_SATAN_LIFETIME_MS = 1200000
const GIANT_SATAN_HEALTH = 15
const GIANT_SATAN_CLUSTER_RADIUS = 170
const TAU = Math.PI * 2

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value))
}

function randomGiantSatanDelayMs() {
    return GIANT_SATAN_MIN_DELAY_MS + Math.random() * (GIANT_SATAN_MAX_DELAY_MS - GIANT_SATAN_MIN_DELAY_MS)
}

function makeAngel(_w: number, h: number): Angel {
    return {
        x: -60,
        y: Math.random() * h * 0.7 + 40,
        vx: 1.2 + Math.random() * 1.4,
        vy: (Math.random() - 0.5) * 0.6,
        flip: false,
        wingAngle: 0,
        t: 0,
        hearts: [],
        shootCooldown: Math.floor(Math.random() * 90),
    }
}

function hitTest(heart: Heart, x: number, y: number, radius: number) {
    const dx = heart.x - x
    const dy = heart.y + heart.size * 0.7 - y
    return dx * dx + dy * dy < radius * radius
}

function makeAngelSplat(x: number, y: number): SplatParticle[] {
    const colors = ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#450a0a', '#ffe8c8']

    return Array.from({ length: 46 }, () => {
        const angle = Math.random() * Math.PI * 2
        const speed = 1.6 + Math.random() * 6.4

        return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2.5 + Math.random() * 5.5,
            opacity: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
        }
    })
}

function makeSatanBloodSplat(x: number, y: number): SplatParticle[] {
    const blotColors = ['#2a0206', '#3f030b', '#5f0713', '#7f1d1d', '#991b1b']
    const sprayColors = ['#4c0519', '#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#fecaca']

    const blotches = Array.from({ length: 36 }, () => {
        const angle = Math.random() * Math.PI * 2
        const speed = 0.2 + Math.random() * 1.35

        return {
            x: x + (Math.random() - 0.5) * 14,
            y: y + (Math.random() - 0.5) * 14,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 6 + Math.random() * 15,
            opacity: 0.96,
            color: blotColors[Math.floor(Math.random() * blotColors.length)],
            gravity: 0.028 + Math.random() * 0.018,
            fade: 0.01 + Math.random() * 0.006,
            shrink: 0.992 + Math.random() * 0.005,
        }
    })

    const spray = Array.from({ length: 62 }, () => {
        const angle = Math.random() * Math.PI * 2
        const speed = 1.8 + Math.random() * 7.2

        return {
            x: x + (Math.random() - 0.5) * 12,
            y: y + (Math.random() - 0.5) * 12,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2.2 + Math.random() * 7.4,
            opacity: 1,
            color: sprayColors[Math.floor(Math.random() * sprayColors.length)],
            gravity: 0.05 + Math.random() * 0.03,
            fade: 0.017 + Math.random() * 0.01,
            shrink: 0.982 + Math.random() * 0.01,
        }
    })

    return [...blotches, ...spray]
}

function makeSatanHitSparks(x: number, y: number): SplatParticle[] {
    const colors = ['#2a0206', '#5f0713', '#7f1d1d', '#b91c1c', '#fecaca']

    return Array.from({ length: 22 }, () => {
        const angle = Math.random() * TAU
        const speed = 0.8 + Math.random() * 3.4

        return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 2.2 + Math.random() * 5.2,
            opacity: 1,
            color: colors[Math.floor(Math.random() * colors.length)],
            gravity: 0.035 + Math.random() * 0.02,
            fade: 0.018 + Math.random() * 0.01,
            shrink: 0.982 + Math.random() * 0.01,
        }
    })
}

function makeGoalStar(x: number, y: number, fill: string, stroke: string, glow: string): GoalStar {
    return {
        x,
        y,
        size: 38 + Math.random() * 8,
        opacity: 1,
        rotation: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.08,
        scale: 0.88,
        fill,
        stroke,
        glow,
    }
}

function makeSatan(w: number, h: number): Satan {
    return {
        x: w + 70,
        y: Math.random() * h * 0.78 + 30,
        vx: -(1.45 + Math.random() * 1.7),
        vy: (Math.random() - 0.5) * 0.7,
        flip: true,
        wingAngle: Math.random() * Math.PI * 2,
        tailAngle: Math.random() * Math.PI * 2,
        t: 0,
        hearts: [],
        shootCooldown: 20 + Math.floor(Math.random() * 90),
    }
}

function makeGiantSatan(w: number, h: number, now: number): GiantSatan {
    const verticalMargin = Math.min(86, Math.max(42, h * 0.18))
    const maxY = Math.max(verticalMargin, h - verticalMargin)

    return {
        x: w + 150,
        y: verticalMargin + Math.random() * Math.max(1, maxY - verticalMargin),
        vx: -(0.58 + Math.random() * 0.38),
        vy: (Math.random() - 0.5) * 0.34,
        flip: true,
        wingAngle: Math.random() * TAU,
        tailAngle: Math.random() * TAU,
        t: 0,
        hearts: [],
        shootCooldown: 0,
        scale: GIANT_SATAN_SCALE,
        health: GIANT_SATAN_HEALTH,
        spawnedAt: now,
        expiresAt: now + GIANT_SATAN_LIFETIME_MS,
        fireCooldown: 8 + Math.floor(Math.random() * 10),
        burstShotsLeft: 0,
        targetX: w * 0.62,
        targetY: h * 0.5,
    }
}

function findLargestAngelCluster(angels: Angel[], w: number, h: number): AngelCluster | null {
    let best: AngelCluster | null = null
    const radiusSq = GIANT_SATAN_CLUSTER_RADIUS * GIANT_SATAN_CLUSTER_RADIUS

    for (const anchor of angels) {
        if (anchor.x < -40 || anchor.x > w + 40 || anchor.y < -40 || anchor.y > h + 40) continue

        let count = 0
        let totalX = 0
        let totalY = 0

        for (const angel of angels) {
            const dx = angel.x - anchor.x
            const dy = angel.y - anchor.y
            if (dx * dx + dy * dy > radiusSq) continue

            count++
            totalX += angel.x
            totalY += angel.y
        }

        if (count === 0) continue

        const cluster = {
            x: totalX / count,
            y: totalY / count,
            count,
        }

        if (!best || cluster.count > best.count || (cluster.count === best.count && cluster.x > best.x)) {
            best = cluster
        }
    }

    return best
}

function steerGiantSatanTowardCluster(satan: GiantSatan, cluster: AngelCluster | null, w: number, h: number) {
    const verticalMargin = Math.min(92, Math.max(48, h * 0.2))

    if (cluster) {
        satan.targetX = clamp(cluster.x + 120, 82, w - 70)
        satan.targetY = clamp(cluster.y, verticalMargin, Math.max(verticalMargin, h - verticalMargin))
    }

    satan.vx += clamp((satan.targetX - satan.x) * 0.0009, -0.055, 0.055)
    satan.vy += clamp((satan.targetY - satan.y) * 0.0026, -0.12, 0.12)
    satan.vx = clamp(satan.vx, -1.55, 0.95)
    satan.vy = clamp(satan.vy, -1.35, 1.35)
}

function fireGiantSatanMachineGun(satan: GiantSatan, target: AngelCluster | null) {
    if (!target) return

    const muzzleX = satan.x - 36 * satan.scale
    const muzzleY = satan.y - 2 * satan.scale
    const lead = 32 + target.count * 9
    const dx = target.x + lead - muzzleX
    const dy = target.y - muzzleY
    const spread = 0.11 + Math.random() * 0.1
    const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread
    const speed = 8.8 + Math.random() * 2.4

    satan.hearts.push({
        x: muzzleX,
        y: muzzleY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 7 + Math.random() * 4,
        opacity: 1,
        hue: 0,
        color: Math.random() < 0.76 ? '#050505' : '#7f1d1d',
    })
}

// ─── draw helpers ────────────────────────────────────────────────────────────

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, alpha: number, hue: number) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = `hsl(${hue}, 100%, 57%)`
    ctx.beginPath()
    ctx.moveTo(x, y + size * 0.3)
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.4)
    ctx.bezierCurveTo(x - size, y + size * 0.9, x, y + size * 1.3, x, y + size * 1.5)
    ctx.bezierCurveTo(x, y + size * 1.3, x + size, y + size * 0.9, x + size, y + size * 0.4)
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3)
    ctx.fill()
    ctx.restore()
}

function drawColoredHeart(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    alpha: number,
    hue: number,
    color?: string,
) {
    if (!color) {
        drawHeart(ctx, x, y, size, alpha, hue)
        return
    }

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.strokeStyle = 'rgba(255, 45, 149, 0.55)'
    ctx.lineWidth = Math.max(1, size * 0.14)
    ctx.beginPath()
    ctx.moveTo(x, y + size * 0.3)
    ctx.bezierCurveTo(x, y, x - size, y, x - size, y + size * 0.4)
    ctx.bezierCurveTo(x - size, y + size * 0.9, x, y + size * 1.3, x, y + size * 1.5)
    ctx.bezierCurveTo(x, y + size * 1.3, x + size, y + size * 0.9, x + size, y + size * 0.4)
    ctx.bezierCurveTo(x + size, y, x, y, x, y + size * 0.3)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
}

function drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) {
    const r = Math.min(radius, width / 2, height / 2)
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + width - r, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + r)
    ctx.lineTo(x + width, y + height - r)
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
    ctx.lineTo(x + r, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

function traceStarPath(ctx: CanvasRenderingContext2D, outerRadius: number, innerRatio = 0.42) {
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5
        const radius = i % 2 === 0 ? outerRadius : outerRadius * innerRatio
        const px = Math.cos(angle) * radius
        const py = Math.sin(angle) * radius

        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
    }
    ctx.closePath()
}

function drawGoalStar(ctx: CanvasRenderingContext2D, star: GoalStar) {
    ctx.save()
    ctx.translate(star.x, star.y)
    ctx.rotate(star.rotation)
    ctx.scale(star.scale, star.scale)
    ctx.globalAlpha = star.opacity * 0.22
    ctx.fillStyle = star.glow
    traceStarPath(ctx, star.size * 1.7, 0.36)
    ctx.fill()

    ctx.globalAlpha = star.opacity
    ctx.fillStyle = star.fill
    ctx.strokeStyle = star.stroke
    ctx.lineWidth = 4.6
    ctx.shadowColor = star.glow
    ctx.shadowBlur = 38
    traceStarPath(ctx, star.size, 0.4)
    ctx.fill()
    ctx.stroke()

    ctx.shadowBlur = 0
    ctx.globalAlpha = star.opacity * 0.82
    ctx.fillStyle = star.stroke
    traceStarPath(ctx, star.size * 0.46, 0.5)
    ctx.fill()

    ctx.restore()
}

type ScorePanelOptions = {
    x: number
    y: number
    width: number
    label: string
    score: number
    align: 'left' | 'right'
    background: string
    border: string
    labelColor: string
    scoreColor: string
    glow: string
}

function drawScorePanel(ctx: CanvasRenderingContext2D, options: ScorePanelOptions) {
    const { x, y, width, label, score, align, background, border, labelColor, scoreColor, glow } = options
    const height = 66
    const padding = 18
    const labelX = align === 'left' ? x + padding : x + width - padding
    const scoreX = labelX

    ctx.save()
    ctx.shadowColor = glow
    ctx.shadowBlur = 20
    ctx.fillStyle = background
    drawRoundedRect(ctx, x, y, width, height, 18)
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.lineWidth = 1.8
    ctx.strokeStyle = border
    drawRoundedRect(ctx, x, y, width, height, 18)
    ctx.stroke()

    ctx.textAlign = align
    ctx.textBaseline = 'middle'

    ctx.fillStyle = labelColor
    ctx.font = '700 15px Georgia, serif'
    ctx.fillText(label, labelX, y + 18)

    ctx.fillStyle = scoreColor
    ctx.font = '900 31px Georgia, serif'
    ctx.fillText(String(score), scoreX, y + 45)

    ctx.restore()
}

function drawGiantSatanHealth(ctx: CanvasRenderingContext2D, satan: GiantSatan, opacity: number) {
    const width = 92
    const height = 8
    const x = satan.x - width / 2
    const y = satan.y - 62 * satan.scale
    const healthRatio = clamp(satan.health / GIANT_SATAN_HEALTH, 0, 1)

    ctx.save()
    ctx.globalAlpha = opacity
    ctx.fillStyle = 'rgba(10, 10, 10, 0.74)'
    drawRoundedRect(ctx, x, y, width, height, 4)
    ctx.fill()

    ctx.fillStyle = healthRatio > 0.35 ? '#ef4444' : '#facc15'
    drawRoundedRect(ctx, x + 1.5, y + 1.5, (width - 3) * healthRatio, height - 3, 3)
    ctx.fill()

    ctx.strokeStyle = 'rgba(254, 202, 202, 0.68)'
    ctx.lineWidth = 1
    drawRoundedRect(ctx, x, y, width, height, 4)
    ctx.stroke()
    ctx.restore()
}

function drawAngel(ctx: CanvasRenderingContext2D, angel: Angel) {
    const { x, y, flip, wingAngle } = angel
    ctx.save()
    ctx.translate(x, y)
    if (flip) ctx.scale(-1, 1)

    // wings
    const wFlap = Math.sin(wingAngle) * 22
    ctx.globalAlpha = 0.88
    ctx.fillStyle = 'rgba(255,255,255,0.82)'
    ctx.strokeStyle = 'rgba(200,160,255,0.9)'
    ctx.lineWidth = 1.2

    // left wing
    ctx.beginPath()
    ctx.ellipse(-20, -4, 18, 9 + wFlap * 0.35, -0.4 + Math.sin(wingAngle) * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // right wing (back)
    ctx.beginPath()
    ctx.ellipse(-14, -2, 14, 7 + wFlap * 0.25, -0.2 + Math.sin(wingAngle + 0.4) * 0.15, 0, Math.PI * 2)
    ctx.globalAlpha = 0.52
    ctx.fill()
    ctx.stroke()

    // body
    ctx.globalAlpha = 0.95
    ctx.fillStyle = '#ffe8c8'
    ctx.beginPath()
    ctx.ellipse(0, 6, 8, 11, 0, 0, Math.PI * 2)
    ctx.fill()

    // head
    ctx.beginPath()
    ctx.arc(0, -8, 9, 0, Math.PI * 2)
    ctx.fillStyle = '#ffd7a3'
    ctx.fill()

    // halo
    ctx.strokeStyle = '#ffe04d'
    ctx.lineWidth = 2
    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.ellipse(0, -18, 9, 3.5, 0, 0, Math.PI * 2)
    ctx.stroke()

    // eyes
    ctx.fillStyle = '#2d1a4f'
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.arc(-3, -9, 1.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(3, -9, 1.5, 0, Math.PI * 2)
    ctx.fill()

    // smirk
    ctx.strokeStyle = '#c0806a'
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.arc(1, -5, 3.5, 0.3, Math.PI - 0.3)
    ctx.stroke()

    // gun (tiny rifle)
    ctx.globalAlpha = 0.9
    ctx.strokeStyle = '#555'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(5, 0)
    ctx.lineTo(28, -2)
    ctx.stroke()
    // barrel end
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(28, -2)
    ctx.lineTo(33, -2)
    ctx.stroke()
    // trigger
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(16, 0)
    ctx.lineTo(16, 5)
    ctx.stroke()

    ctx.restore()
}

function drawSatan(ctx: CanvasRenderingContext2D, satan: Satan, scale = 1, opacity = 1) {
    const { x, y, flip, wingAngle, tailAngle } = satan
    ctx.save()
    ctx.translate(x, y)
    if (flip) ctx.scale(-1, 1)
    ctx.scale(scale, scale)

    const wingPulse = Math.sin(wingAngle)

    // bat wings
    ctx.globalAlpha = 0.86 * opacity
    ctx.fillStyle = '#1a0b1f'
    ctx.strokeStyle = '#ff2d55'
    ctx.lineWidth = 1.4

    ctx.beginPath()
    ctx.moveTo(-7, 0)
    ctx.lineTo(-34, -14 - wingPulse * 5)
    ctx.lineTo(-25, 7 + wingPulse * 3)
    ctx.lineTo(-15, 1)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(7, 0)
    ctx.lineTo(34, -14 - wingPulse * 5)
    ctx.lineTo(25, 7 + wingPulse * 3)
    ctx.lineTo(15, 1)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    // tail
    ctx.globalAlpha = 0.9 * opacity
    ctx.strokeStyle = '#7f1d1d'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-2, 12)
    ctx.quadraticCurveTo(-20, 20 + Math.sin(tailAngle) * 6, -26, 4 + Math.cos(tailAngle) * 4)
    ctx.stroke()
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.moveTo(-29, 0)
    ctx.lineTo(-20, 4)
    ctx.lineTo(-29, 9)
    ctx.closePath()
    ctx.fill()

    // body
    ctx.globalAlpha = 0.96 * opacity
    ctx.fillStyle = '#b91c1c'
    ctx.beginPath()
    ctx.ellipse(0, 7, 9, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    // head
    ctx.fillStyle = '#dc2626'
    ctx.beginPath()
    ctx.arc(0, -8, 9, 0, Math.PI * 2)
    ctx.fill()

    // horns
    ctx.fillStyle = '#111827'
    ctx.beginPath()
    ctx.moveTo(-6, -15)
    ctx.lineTo(-12, -27)
    ctx.lineTo(-1, -18)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(6, -15)
    ctx.lineTo(12, -27)
    ctx.lineTo(1, -18)
    ctx.closePath()
    ctx.fill()

    // eyes
    ctx.fillStyle = '#facc15'
    ctx.beginPath()
    ctx.arc(-3.5, -9, 1.8, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(3.5, -9, 1.8, 0, Math.PI * 2)
    ctx.fill()

    // tiny cannon
    ctx.globalAlpha = 0.94 * opacity
    ctx.strokeStyle = '#050505'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(5, 0)
    ctx.lineTo(29, -1)
    ctx.stroke()
    ctx.strokeStyle = '#7f1d1d'
    ctx.lineWidth = 1.6
    ctx.beginPath()
    ctx.moveTo(29, -1)
    ctx.lineTo(36, -1)
    ctx.stroke()

    ctx.restore()
}

// ─── mammoth types ───────────────────────────────────────────────────────────

type Mammoth = {
    x: number
    y: number
    vx: number
    vy: number
    t: number
    flip: boolean
    health: number
}

type Stone = { x: number; y: number; vx: number; vy: number; size: number }

type GiantMammoth = Mammoth & {
    health: number
    scale: number
    stones: Stone[]
    throwCooldown: number
}

const MAMMOTH_HEALTH = 10
const MAMMOTH_DODGE_CHANCE = 0.35
const GIANT_MAMMOTH_HEALTH = 100
const HUNTER_SPEAR_COUNT = 10
const HUNTER_BASE_X = 30
const GIANT_MAMMOTH_SCALE = 2.5
const GIANT_MAMMOTH_MIN_DELAY_MS = 20000
const GIANT_MAMMOTH_MAX_DELAY_MS = 45000

function randomGiantMammothDelayMs() {
    return GIANT_MAMMOTH_MIN_DELAY_MS + Math.random() * (GIANT_MAMMOTH_MAX_DELAY_MS - GIANT_MAMMOTH_MIN_DELAY_MS)
}

function makeGiantMammoth(w: number, h: number): GiantMammoth {
    return {
        x: w + 160,
        y: Math.random() * h * 0.45 + h * 0.3,
        vx: -(0.3 + Math.random() * 0.3),
        vy: (Math.random() - 0.5) * 0.2,
        t: 0,
        flip: true,
        health: GIANT_MAMMOTH_HEALTH,
        scale: GIANT_MAMMOTH_SCALE,
        stones: [],
        throwCooldown: 60,
    }
}

type Hunter = {
    x: number
    y: number
    vx: number
    vy: number
    t: number
    flip: boolean
    spears: Array<{ x: number; y: number; vx: number; vy: number }>
    shootCooldown: number
    spearsLeft: number
}

function makeMammoth(w: number, h: number): Mammoth {
    return {
        x: w + 80,
        y: Math.random() * h * 0.55 + h * 0.3,
        vx: -(0.5 + Math.random() * 0.7),
        vy: (Math.random() - 0.5) * 0.35,
        t: 0,
        flip: true,
        health: MAMMOTH_HEALTH,
    }
}

function makeHunter(_w: number, h: number): Hunter {
    return {
        x: -60,
        y: Math.random() * h * 0.55 + h * 0.3,
        vx: 0.8 + Math.random() * 0.7,
        vy: (Math.random() - 0.5) * 0.35,
        t: 0,
        flip: false,
        spears: [],
        shootCooldown: 20 + Math.floor(Math.random() * 30),
        spearsLeft: HUNTER_SPEAR_COUNT,
    }
}

function drawMammoth(ctx: CanvasRenderingContext2D, m: Mammoth) {
    ctx.save()
    ctx.translate(m.x, m.y)
    if (m.flip) ctx.scale(-1, 1)

    const legSwing = Math.sin(m.t * 0.1) * 5

    // Back legs
    ctx.fillStyle = '#7B3A0E'
    ctx.save()
    ctx.translate(-12, 20)
    ctx.rotate(legSwing * 0.05)
    ctx.fillRect(-4, 0, 8, 18)
    ctx.restore()
    ctx.save()
    ctx.translate(8, 20)
    ctx.rotate(-legSwing * 0.05)
    ctx.fillRect(-4, 0, 8, 18)
    ctx.restore()

    // Body
    ctx.globalAlpha = 0.9
    ctx.fillStyle = '#8B4513'
    ctx.beginPath()
    ctx.ellipse(0, 4, 38, 24, 0, 0, TAU)
    ctx.fill()

    // Fur texture
    ctx.globalAlpha = 0.18
    ctx.strokeStyle = '#3d1a00'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 6; i++) {
        ctx.beginPath()
        ctx.arc(-28 + i * 11, -17, 6, Math.PI, 0)
        ctx.stroke()
    }

    // Front legs
    ctx.globalAlpha = 1
    ctx.fillStyle = '#7B3A0E'
    ctx.save()
    ctx.translate(-20, 22)
    ctx.rotate(-legSwing * 0.05)
    ctx.fillRect(-4, 0, 8, 18)
    ctx.restore()
    ctx.save()
    ctx.translate(2, 22)
    ctx.rotate(legSwing * 0.05)
    ctx.fillRect(-4, 0, 8, 18)
    ctx.restore()

    // Head
    ctx.globalAlpha = 0.92
    ctx.fillStyle = '#7B3A0E'
    ctx.beginPath()
    ctx.ellipse(36, -7, 18, 15, -0.2, 0, TAU)
    ctx.fill()

    // Trunk
    ctx.globalAlpha = 0.88
    ctx.strokeStyle = '#6B2D05'
    ctx.lineWidth = 7
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(51, -3)
    ctx.bezierCurveTo(62, 4, 60, 18, 49, 22)
    ctx.stroke()

    // Tusks
    ctx.globalAlpha = 0.85
    ctx.strokeStyle = '#F0EDD5'
    ctx.lineWidth = 3.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(42, -1, 13, 0.4, 1.7)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(41, 5, 9, 0.2, 1.4)
    ctx.stroke()

    // Eye
    ctx.globalAlpha = 1
    ctx.fillStyle = '#1a0800'
    ctx.beginPath()
    ctx.arc(42, -12, 2.5, 0, TAU)
    ctx.fill()

    ctx.restore()
}

function drawHunter(ctx: CanvasRenderingContext2D, h: Hunter) {
    ctx.save()
    ctx.translate(h.x, h.y)
    if (h.flip) ctx.scale(-1, 1)

    const legSwing = Math.sin(h.t * 0.14) * 7

    ctx.globalAlpha = 0.86

    // Spear (behind body)
    ctx.strokeStyle = '#5C3D11'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(4, -7)
    ctx.lineTo(24, -25)
    ctx.stroke()
    ctx.fillStyle = '#9E9E9E'
    ctx.beginPath()
    ctx.moveTo(24, -25)
    ctx.lineTo(20, -33)
    ctx.lineTo(30, -29)
    ctx.closePath()
    ctx.fill()

    // Legs
    ctx.strokeStyle = '#8B4513'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(0, 4)
    ctx.lineTo(-5 + legSwing * 0.28, 21)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, 4)
    ctx.lineTo(5 - legSwing * 0.28, 21)
    ctx.stroke()

    // Body
    ctx.strokeStyle = '#C47C3A'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, -12)
    ctx.lineTo(0, 4)
    ctx.stroke()

    // Arms
    ctx.strokeStyle = '#D4A87A'
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(0, -6)
    ctx.lineTo(-8, 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, -6)
    ctx.lineTo(7, -10)
    ctx.stroke()

    // Head
    ctx.fillStyle = '#E8C589'
    ctx.beginPath()
    ctx.arc(0, -19, 8, 0, TAU)
    ctx.fill()

    // Hair
    ctx.fillStyle = '#3d1a00'
    ctx.beginPath()
    ctx.arc(0, -24, 5, Math.PI, 0)
    ctx.fill()

    ctx.globalAlpha = 1
    ctx.restore()
}

function startMammoths(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): () => void {
    let cancelled = false
    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)

    const mammoths: Mammoth[] = []
    const hunters: Hunter[] = []
    const particles: SplatParticle[] = []
    const floatingTexts: FloatingText[] = []
    let mammothScore = 0
    let hunterScore = 0
    let giantMammoth: GiantMammoth | null = null
    let nextGiantMammothAt = performance.now() + randomGiantMammothDelayMs()

    const onResize = () => {
        w = canvas.width = window.innerWidth
        h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', onResize)

    const onCanvasClick = (e: MouseEvent) => {
        const cx = e.clientX
        const cy = e.clientY

        // Hunter hit — footprint burst
        for (let j = hunters.length - 1; j >= 0; j--) {
            const hu = hunters[j]
            const dx = cx - hu.x
            const dy = cy - hu.y
            if (dx * dx + dy * dy < 35 * 35) {
                for (let p = 0; p < 16; p++) {
                    const angle = Math.random() * TAU
                    const speed = 1 + Math.random() * 3.5
                    particles.push({
                        x: hu.x,
                        y: hu.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 4 + Math.random() * 8,
                        opacity: 1,
                        color: ['#3d1a00', '#5C3D11', '#7B3A0E'][Math.floor(Math.random() * 3)],
                        gravity: 0.08,
                        fade: 0.03,
                        shrink: 0.97,
                    })
                }
                hunters[j] = makeHunter(w, h)
                mammothScore++
                return
            }
        }

        // Mammoth hit — dodge or damage
        for (let k = mammoths.length - 1; k >= 0; k--) {
            const m = mammoths[k]
            const dx = cx - m.x
            const dy = cy - m.y
            if (dx * dx + dy * dy < 45 * 45) {
                if (Math.random() < MAMMOTH_DODGE_CHANCE) {
                    ninjaDodge(m)
                    return
                }
                m.health--
                for (let p = 0; p < 8; p++) {
                    const angle = Math.random() * TAU
                    particles.push({
                        x: m.x,
                        y: m.y,
                        vx: Math.cos(angle) * (1.5 + Math.random() * 3),
                        vy: Math.sin(angle) * (1.5 + Math.random() * 3),
                        size: 2 + Math.random() * 6,
                        opacity: 1,
                        color: ['#8B4513', '#A0522D', '#C07040'][Math.floor(Math.random() * 3)],
                        gravity: 0.05,
                        fade: 0.03,
                        shrink: 0.985,
                    })
                }
                if (m.health <= 0) {
                    for (let p = 0; p < 22; p++) {
                        const angle = Math.random() * TAU
                        const speed = 2 + Math.random() * 5
                        particles.push({
                            x: m.x,
                            y: m.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            size: 3 + Math.random() * 9,
                            opacity: 1,
                            color: ['#8B4513', '#A0522D', '#C07040', '#F0EDD5'][Math.floor(Math.random() * 4)],
                            gravity: 0.05,
                            fade: 0.02,
                            shrink: 0.985,
                        })
                    }
                    mammoths[k] = makeMammoth(w, h)
                    hunterScore++
                }
                return
            }
        }
    }
    window.addEventListener('click', onCanvasClick)

    const onMouseMove = (e: MouseEvent) => {
        const mx = e.clientX
        const my = e.clientY
        const nearMammoth = mammoths.some(m => {
            const dx = mx - m.x
            const dy = my - m.y
            return dx * dx + dy * dy < 50 * 50
        })
        const nearHunter = hunters.some(hu => {
            const dx = mx - hu.x
            const dy = my - hu.y
            return dx * dx + dy * dy < 50 * 50
        })
        const spear = document.documentElement.style.getPropertyValue('--cursor-spear')
        const paw = document.documentElement.style.getPropertyValue('--cursor-paw')
        if (nearHunter && paw) document.documentElement.style.cursor = paw
        else if (nearMammoth && spear) document.documentElement.style.cursor = spear
        else document.documentElement.style.cursor = ''
    }
    window.addEventListener('mousemove', onMouseMove)

    for (let i = 0; i < 5; i++) mammoths.push(makeMammoth(w, h))
    for (let i = 0; i < 4; i++) hunters.push(makeHunter(w, h))

    const battleAudio = new Audio('/cave_throat_singing.mp3')
    battleAudio.loop = true
    battleAudio.volume = 1

    const ninjaDodge = (m: Mammoth) => {
        const dir = Math.random() > 0.5 ? -1 : 1
        m.vy = dir * 7
        m.vx *= 2.2
        m.vx = Math.sign(m.vx) * Math.min(Math.abs(m.vx), 3)
        for (let p = 0; p < 10; p++) {
            const angle = Math.random() * TAU
            particles.push({
                x: m.x,
                y: m.y,
                vx: Math.cos(angle) * (1 + Math.random() * 2),
                vy: Math.sin(angle) * (1 + Math.random() * 2),
                size: 3 + Math.random() * 6,
                opacity: 0.8,
                color: ['#4c1d95', '#6d28d9', '#a78bfa', '#1e1b4b'][Math.floor(Math.random() * 4)],
                gravity: 0.02,
                fade: 0.04,
                shrink: 0.97,
            })
        }
        floatingTexts.push({ x: m.x, y: m.y - 30, vy: -1.5, text: 'DODGE!', opacity: 1, color: '#7c3aed', size: 14 })
    }

    const resumeOnClick = () => {
        if (battleAudio.paused) battleAudio.play().catch(() => {})
    }
    window.addEventListener('click', resumeOnClick)

    battleAudio.play().catch(() => {})

    function tick() {
        if (cancelled) return
        ctx.clearRect(0, 0, w, h)
        ctx.globalAlpha = 1

        // ── mammoths ────────────────────────────────────
        for (let i = mammoths.length - 1; i >= 0; i--) {
            const m = mammoths[i]
            m.t++
            m.x += m.vx
            m.y += m.vy + Math.sin(m.t * 0.022) * 0.4
            m.vy *= 0.96

            const margin = 60
            if (m.x < margin) {
                m.x = margin
                m.vx = Math.abs(m.vx)
                m.flip = false
            }
            if (m.x > w - margin) {
                m.x = w - margin
                m.vx = -Math.abs(m.vx)
                m.flip = true
            }
            if (m.y < margin) {
                m.y = margin
                m.vy = Math.abs(m.vy) * 0.5
            }
            if (m.y > h - margin) {
                m.y = h - margin
                m.vy = -Math.abs(m.vy) * 0.5
            }

            // Hit test — mammoth tramples nearby hunters
            for (let j = hunters.length - 1; j >= 0; j--) {
                const hu = hunters[j]
                const dx = m.x - hu.x
                const dy = m.y - hu.y
                if (dx * dx + dy * dy < 45 * 45) {
                    for (let p = 0; p < 14; p++) {
                        const angle = Math.random() * TAU
                        const speed = 1.5 + Math.random() * 3.5
                        particles.push({
                            x: hu.x,
                            y: hu.y,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed,
                            size: 2 + Math.random() * 5,
                            opacity: 1,
                            color: ['#d97706', '#92400e', '#fbbf24'][Math.floor(Math.random() * 3)],
                            gravity: 0.06,
                            fade: 0.025,
                            shrink: 0.98,
                        })
                    }
                    hunters[j] = makeHunter(w, h)
                    mammothScore++
                }
            }

            drawMammoth(ctx, m)

            // HP bar
            const barW = 36
            const barH = 4
            const barX = m.x - barW / 2
            const barY = m.y - 46
            ctx.fillStyle = 'rgba(0,0,0,0.35)'
            ctx.fillRect(barX, barY, barW, barH)
            ctx.fillStyle = '#e53e3e'
            ctx.fillRect(barX, barY, barW * (m.health / MAMMOTH_HEALTH), barH)
        }

        // ── giant mammoth ────────────────────────────────
        const now = performance.now()
        if (!giantMammoth && now >= nextGiantMammothAt) {
            giantMammoth = makeGiantMammoth(w, h)
        }
        if (giantMammoth) {
            giantMammoth.t++
            giantMammoth.x += giantMammoth.vx
            giantMammoth.y += giantMammoth.vy + Math.sin(giantMammoth.t * 0.018) * 0.3
            if (giantMammoth.x < -200) {
                giantMammoth = null
                nextGiantMammothAt = now + randomGiantMammothDelayMs()
            } else {
                const gm = giantMammoth
                const stompRadius = 70 * gm.scale

                // Stomp — kill any hunter within range
                for (let j = hunters.length - 1; j >= 0; j--) {
                    const hu = hunters[j]
                    const dx = hu.x - gm.x
                    const dy = hu.y - gm.y
                    if (dx * dx + dy * dy < stompRadius * stompRadius) {
                        for (let p = 0; p < 20; p++) {
                            const angle = Math.random() * TAU
                            const speed = 2 + Math.random() * 5
                            particles.push({
                                x: hu.x,
                                y: hu.y,
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed,
                                size: 4 + Math.random() * 8,
                                opacity: 1,
                                color: ['#3d1a00', '#5C3D11', '#7B3A0E'][Math.floor(Math.random() * 3)],
                                gravity: 0.08,
                                fade: 0.025,
                                shrink: 0.97,
                            })
                        }
                        floatingTexts.push({
                            x: hu.x,
                            y: hu.y - 20,
                            vy: -1.5,
                            text: 'STOMP!',
                            opacity: 1,
                            color: '#dc2626',
                            size: 18,
                        })
                        hunters[j] = makeHunter(w, h)
                        mammothScore++
                    }
                }

                // Throw stone at nearest hunter
                gm.throwCooldown--
                if (gm.throwCooldown <= 0) {
                    gm.throwCooldown = 80 + Math.floor(Math.random() * 60)
                    let nearest: Hunter | null = null
                    let nearestDist = Infinity
                    for (const hu of hunters) {
                        const ddx = hu.x - gm.x
                        const ddy = hu.y - gm.y
                        const dist = Math.sqrt(ddx * ddx + ddy * ddy)
                        if (dist < nearestDist) {
                            nearestDist = dist
                            nearest = hu
                        }
                    }
                    if (nearest) {
                        const ddx = nearest.x - gm.x
                        const ddy = nearest.y - gm.y
                        const dist = Math.max(nearestDist, 1)
                        const speed = 6 + Math.random() * 3
                        gm.stones.push({
                            x: gm.x,
                            y: gm.y - 20,
                            vx: (ddx / dist) * speed,
                            vy: (ddy / dist) * speed - 4,
                            size: 10 + Math.random() * 6,
                        })
                    }
                }

                // Update and draw stones
                for (let s = gm.stones.length - 1; s >= 0; s--) {
                    const st = gm.stones[s]
                    st.x += st.vx
                    st.y += st.vy
                    st.vy += 0.18
                    if (st.x < -40 || st.x > w + 40 || st.y > h + 40) {
                        gm.stones.splice(s, 1)
                        continue
                    }
                    // Hit hunter
                    let stoneHit = false
                    for (let j = hunters.length - 1; j >= 0; j--) {
                        const hu = hunters[j]
                        const dx = st.x - hu.x
                        const dy = st.y - hu.y
                        if (dx * dx + dy * dy < (st.size + 20) * (st.size + 20)) {
                            for (let p = 0; p < 16; p++) {
                                const angle = Math.random() * TAU
                                const speed = 2 + Math.random() * 4
                                particles.push({
                                    x: hu.x,
                                    y: hu.y,
                                    vx: Math.cos(angle) * speed,
                                    vy: Math.sin(angle) * speed,
                                    size: 3 + Math.random() * 7,
                                    opacity: 1,
                                    color: ['#6b7280', '#374151', '#9ca3af'][Math.floor(Math.random() * 3)],
                                    gravity: 0.06,
                                    fade: 0.025,
                                    shrink: 0.975,
                                })
                            }
                            floatingTexts.push({
                                x: hu.x,
                                y: hu.y - 20,
                                vy: -1.5,
                                text: '💥',
                                opacity: 1,
                                color: '#fff',
                                size: 20,
                            })
                            hunters[j] = makeHunter(w, h)
                            mammothScore++
                            gm.stones.splice(s, 1)
                            stoneHit = true
                            break
                        }
                    }
                    if (stoneHit) continue
                    // Draw stone
                    ctx.save()
                    ctx.fillStyle = '#4b5563'
                    ctx.strokeStyle = '#1f2937'
                    ctx.lineWidth = 1.5
                    ctx.beginPath()
                    ctx.arc(st.x, st.y, st.size, 0, TAU)
                    ctx.fill()
                    ctx.stroke()
                    ctx.restore()
                }

                // Draw scaled mammoth
                ctx.save()
                ctx.translate(gm.x, gm.y)
                ctx.scale(gm.scale, gm.scale)
                drawMammoth(ctx, { ...gm, x: 0, y: 0 })
                ctx.restore()
                // Health bar
                const barW = 80 * gm.scale
                const barH = 8
                const barX = gm.x - barW / 2
                const barY = gm.y - 55 * gm.scale
                ctx.fillStyle = 'rgba(0,0,0,0.4)'
                ctx.fillRect(barX, barY, barW, barH)
                ctx.fillStyle = '#e53e3e'
                ctx.fillRect(barX, barY, barW * (gm.health / GIANT_MAMMOTH_HEALTH), barH)
                // Lives text
                ctx.fillStyle = '#fff'
                ctx.font = `bold ${12 * gm.scale}px sans-serif`
                ctx.textAlign = 'center'
                ctx.fillText(`♥ ${gm.health}`, gm.x, barY - 4)
                ctx.textAlign = 'left'
            }
        }

        // ── hunters ─────────────────────────────────────
        for (let i = hunters.length - 1; i >= 0; i--) {
            const hu = hunters[i]
            hu.t++

            if (hu.spearsLeft > 0) {
                // Armed — advance into battle
                hu.x += hu.vx
                hu.flip = false
                if (hu.x > w + 80) {
                    hunters[i] = makeHunter(w, h)
                    continue
                }
            } else {
                // Out of spears — retreat to base to resupply
                hu.x -= hu.vx + 0.6
                hu.flip = true
                if (hu.x <= HUNTER_BASE_X) {
                    hu.x = HUNTER_BASE_X
                    hu.flip = false
                    hu.spearsLeft = HUNTER_SPEAR_COUNT
                    floatingTexts.push({
                        x: hu.x,
                        y: hu.y - 24,
                        vy: -1.4,
                        text: 'RELOAD!',
                        opacity: 1,
                        color: '#d97706',
                        size: 13,
                    })
                }
            }
            hu.y += hu.vy + Math.sin(hu.t * 0.026) * 0.3

            // Shoot spear — aim at nearest mammoth when possible (only while armed)
            if (hu.spearsLeft > 0) {
                hu.shootCooldown--
            }
            if (hu.spearsLeft > 0 && hu.shootCooldown <= 0) {
                hu.shootCooldown = 18 + Math.floor(Math.random() * 22)
                let nearestMammoth: Mammoth | null = null
                let nearestDist = Infinity
                for (const m of mammoths) {
                    const ddx = m.x - hu.x
                    const ddy = m.y - hu.y
                    const dist = Math.sqrt(ddx * ddx + ddy * ddy)
                    if (dist < nearestDist) {
                        nearestDist = dist
                        nearestMammoth = m
                    }
                }
                const speed = 5 + Math.random() * 2
                if (nearestMammoth) {
                    const ddx = nearestMammoth.x - hu.x
                    const ddy = nearestMammoth.y - hu.y
                    const dist = Math.max(nearestDist, 1)
                    hu.spears.push({
                        x: hu.x + (ddx / dist) * 22,
                        y: hu.y - 12,
                        vx: (ddx / dist) * speed,
                        vy: (ddy / dist) * speed,
                    })
                } else {
                    const dir = hu.flip ? -1 : 1
                    hu.spears.push({
                        x: hu.x + dir * 22,
                        y: hu.y - 12,
                        vx: dir * speed,
                        vy: (Math.random() - 0.5) * 1.2,
                    })
                }
                hu.spearsLeft--
            }

            // Update spears
            for (let j = hu.spears.length - 1; j >= 0; j--) {
                const sp = hu.spears[j]
                sp.x += sp.vx
                sp.y += sp.vy
                sp.vy += 0.03

                if (sp.x < -20 || sp.x > w + 20 || sp.y > h + 20) {
                    hu.spears.splice(j, 1)
                    continue
                }

                // Hit test against mammoths
                let hit = false
                for (let k = mammoths.length - 1; k >= 0; k--) {
                    const m = mammoths[k]
                    const dx = sp.x - m.x
                    const dy = sp.y - m.y
                    if (dx * dx + dy * dy < 40 * 40) {
                        if (Math.random() < MAMMOTH_DODGE_CHANCE) {
                            ninjaDodge(m)
                            hu.spears.splice(j, 1)
                            hit = true
                            break
                        }
                        m.health--
                        for (let p = 0; p < 6; p++) {
                            const angle = Math.random() * TAU
                            particles.push({
                                x: m.x,
                                y: m.y,
                                vx: Math.cos(angle) * (1 + Math.random() * 2.5),
                                vy: Math.sin(angle) * (1 + Math.random() * 2.5),
                                size: 2 + Math.random() * 5,
                                opacity: 1,
                                color: ['#8B4513', '#A0522D', '#C07040'][Math.floor(Math.random() * 3)],
                                gravity: 0.05,
                                fade: 0.03,
                                shrink: 0.985,
                            })
                        }
                        hu.spears.splice(j, 1)
                        if (m.health <= 0) {
                            for (let p = 0; p < 18; p++) {
                                const angle = Math.random() * TAU
                                const speed = 1.2 + Math.random() * 4.5
                                particles.push({
                                    x: m.x,
                                    y: m.y,
                                    vx: Math.cos(angle) * speed,
                                    vy: Math.sin(angle) * speed,
                                    size: 3 + Math.random() * 7,
                                    opacity: 1,
                                    color: ['#8B4513', '#A0522D', '#C07040'][Math.floor(Math.random() * 3)],
                                    gravity: 0.05,
                                    fade: 0.022,
                                    shrink: 0.985,
                                })
                            }
                            mammoths[k] = makeMammoth(w, h)
                            hunterScore++
                        }
                        hit = true
                        break
                    }
                }

                // Hit test against giant mammoth
                if (!hit && giantMammoth) {
                    const gdx = sp.x - giantMammoth.x
                    const gdy = sp.y - giantMammoth.y
                    const hitRadius = 55 * giantMammoth.scale
                    if (gdx * gdx + gdy * gdy < hitRadius * hitRadius) {
                        giantMammoth.health--
                        hu.spears.splice(j, 1)
                        for (let p = 0; p < 8; p++) {
                            const angle = Math.random() * TAU
                            particles.push({
                                x: giantMammoth.x,
                                y: giantMammoth.y,
                                vx: Math.cos(angle) * (1 + Math.random() * 2.5),
                                vy: Math.sin(angle) * (1 + Math.random() * 2.5),
                                size: 2 + Math.random() * 5,
                                opacity: 1,
                                color: '#e53e3e',
                                gravity: 0.04,
                                fade: 0.03,
                                shrink: 0.98,
                            })
                        }
                        if (giantMammoth.health <= 0) {
                            // Explosion on death
                            for (let p = 0; p < 30; p++) {
                                const angle = Math.random() * TAU
                                const speed = 2 + Math.random() * 6
                                particles.push({
                                    x: giantMammoth.x,
                                    y: giantMammoth.y,
                                    vx: Math.cos(angle) * speed,
                                    vy: Math.sin(angle) * speed,
                                    size: 4 + Math.random() * 10,
                                    opacity: 1,
                                    color: ['#8B4513', '#A0522D', '#F0EDD5', '#e53e3e'][Math.floor(Math.random() * 4)],
                                    gravity: 0.05,
                                    fade: 0.018,
                                    shrink: 0.985,
                                })
                            }
                            hunterScore += GIANT_MAMMOTH_HEALTH
                            giantMammoth = null
                            nextGiantMammothAt = performance.now() + randomGiantMammothDelayMs()
                        }
                        hit = true
                    }
                }

                if (!hit) {
                    // Draw spear in flight
                    const angle = Math.atan2(sp.vy, sp.vx)
                    ctx.save()
                    ctx.translate(sp.x, sp.y)
                    ctx.rotate(angle)
                    ctx.strokeStyle = '#5C3D11'
                    ctx.lineWidth = 2.5
                    ctx.lineCap = 'round'
                    ctx.beginPath()
                    ctx.moveTo(-12, 0)
                    ctx.lineTo(8, 0)
                    ctx.stroke()
                    ctx.fillStyle = '#9E9E9E'
                    ctx.beginPath()
                    ctx.moveTo(8, 0)
                    ctx.lineTo(4, -3.5)
                    ctx.lineTo(4, 3.5)
                    ctx.closePath()
                    ctx.fill()
                    ctx.restore()
                }
            }

            drawHunter(ctx, hu)
        }

        // ── particles ───────────────────────────────────
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i]
            p.x += p.vx
            p.y += p.vy
            p.vy += p.gravity ?? 0.05
            p.opacity -= p.fade ?? 0.018
            p.size *= p.shrink ?? 0.985
            if (p.opacity <= 0 || p.size < 0.5) {
                particles.splice(i, 1)
                continue
            }
            ctx.globalAlpha = p.opacity
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, TAU)
            ctx.fill()
        }

        ctx.globalAlpha = 1

        // ── floating texts ───────────────────────────────
        for (let i = floatingTexts.length - 1; i >= 0; i--) {
            const ft = floatingTexts[i]
            ft.y += ft.vy
            ft.opacity -= 0.022
            if (ft.opacity <= 0) {
                floatingTexts.splice(i, 1)
                continue
            }
            ctx.globalAlpha = ft.opacity
            ctx.fillStyle = ft.color
            ctx.font = `bold ${ft.size}px sans-serif`
            ctx.textAlign = 'center'
            ctx.fillText(ft.text, ft.x, ft.y)
            ctx.textAlign = 'left'
        }

        ctx.globalAlpha = 1

        // ── scoreboards ─────────────────────────────────
        drawScorePanel(ctx, {
            x: 18,
            y: 18,
            width: 130,
            label: 'Hunters',
            score: hunterScore,
            align: 'left',
            background: 'rgba(254,243,199,0.82)',
            border: '#d97706',
            labelColor: '#92400e',
            scoreColor: '#78350f',
            glow: 'rgba(217,119,6,0.18)',
        })
        drawScorePanel(ctx, {
            x: w - 148,
            y: 18,
            width: 130,
            label: 'Mammoths',
            score: mammothScore,
            align: 'right',
            background: 'rgba(245,225,200,0.82)',
            border: '#8B4513',
            labelColor: '#5C3D11',
            scoreColor: '#3d1a00',
            glow: 'rgba(139,69,19,0.18)',
        })

        requestAnimationFrame(tick)
    }

    requestAnimationFrame(tick)

    return () => {
        cancelled = true
        battleAudio.pause()
        battleAudio.currentTime = 0
        window.removeEventListener('resize', onResize)
        window.removeEventListener('click', onCanvasClick)
        window.removeEventListener('click', resumeOnClick)
        window.removeEventListener('mousemove', onMouseMove)
        document.documentElement.style.cursor = ''
    }
}

// ─── theme control ───────────────────────────────────────────────────────────

type AnimationTheme = 'angels' | 'mammoths' | 'off'

let cancelCurrent: (() => void) | null = null

function applyTheme(theme: AnimationTheme) {
    const canvas = document.querySelector<HTMLCanvasElement>('#crazy-bg')
    if (!canvas) return

    cancelCurrent?.()
    cancelCurrent = null

    canvas.dataset.theme = theme

    if (theme === 'angels') {
        canvas.dataset.angelScoreboardSide = 'left'
        canvas.dataset.satanScoreboardSide = 'right'
        delete canvas.dataset.mammothAttacksHunters
        delete canvas.dataset.hunterScoreboardSide
        delete canvas.dataset.mammothScoreboardSide
    } else {
        delete canvas.dataset.angelScoreboardSide
        delete canvas.dataset.satanScoreboardSide
        if (theme === 'mammoths') {
            canvas.dataset.mammothAttacksHunters = 'true'
            canvas.dataset.hunterScoreboardSide = 'left'
            canvas.dataset.mammothScoreboardSide = 'right'
            canvas.dataset.hunterClickKill = 'true'
            canvas.dataset.mammothClickKill = 'true'
            canvas.dataset.mammothHoverSpear = 'true'
            canvas.dataset.hunterHoverPaw = 'true'
            canvas.dataset.giantMammothLives = '100'
            canvas.dataset.giantMammothStomp = 'true'
            canvas.dataset.giantMammothThrowsStones = 'true'
            canvas.dataset.mammothContained = 'true'
            canvas.dataset.mammothHealth = String(MAMMOTH_HEALTH)
            canvas.dataset.mammothDodge = 'true'
            canvas.dataset.mammothDodgeVisual = 'true'
            canvas.dataset.battleAudio = 'cave_throat_singing'
            canvas.dataset.hunterSpears = String(HUNTER_SPEAR_COUNT)
            canvas.dataset.hunterResupply = 'true'
        } else {
            delete canvas.dataset.mammothAttacksHunters
            delete canvas.dataset.hunterScoreboardSide
            delete canvas.dataset.mammothScoreboardSide
            delete canvas.dataset.hunterClickKill
            delete canvas.dataset.mammothClickKill
            delete canvas.dataset.mammothHoverSpear
            delete canvas.dataset.hunterHoverPaw
            delete canvas.dataset.giantMammothLives
            delete canvas.dataset.giantMammothStomp
            delete canvas.dataset.giantMammothThrowsStones
            delete canvas.dataset.mammothContained
            delete canvas.dataset.mammothHealth
            delete canvas.dataset.mammothDodge
            delete canvas.dataset.mammothDodgeVisual
            delete canvas.dataset.battleAudio
            delete canvas.dataset.hunterSpears
            delete canvas.dataset.hunterResupply
        }
    }

    if (theme === 'off') {
        canvas.style.display = 'none'
        const ctx2d = canvas.getContext('2d')
        if (ctx2d) ctx2d.clearRect(0, 0, canvas.width, canvas.height)
        return
    }

    canvas.style.display = ''

    // In test mode (E2E), skip the animation loop — only the data-theme attribute matters.
    if (window.__noCrazyBackground) return

    const ctx2d = canvas.getContext('2d')
    if (!ctx2d) return

    cancelCurrent = theme === 'mammoths' ? startMammoths(canvas, ctx2d) : startAngels()
}

// Always register so React can call it even in test mode.
window.__setAnimationTheme = (theme: AnimationTheme) => {
    localStorage.setItem('animation-theme', theme)
    applyTheme(theme)
}

// ─── bootstrap ───────────────────────────────────────────────────────────────

{
    const saved = localStorage.getItem('animation-theme') as AnimationTheme | null
    const initial: AnimationTheme = saved === 'mammoths' || saved === 'off' ? saved : 'angels'
    applyTheme(initial)
}

function startAngels(): () => void {
    let rafId: number

    const canvas = document.querySelector<HTMLCanvasElement>('#crazy-bg')
    if (!canvas) return () => {}
    const ctx = canvas.getContext('2d')
    if (!ctx) return () => {}

    let w = 0
    let h = 0
    const angels: Angel[] = []
    const satans: Satan[] = []
    const splats: SplatParticle[] = []
    const goalStars: GoalStar[] = []
    let angelScore = 0
    let satanScore = 0
    let nextGiantSatanAt = performance.now() + randomGiantSatanDelayMs()
    let giantSatan: GiantSatan | null = null

    const resize = () => {
        w = canvas.width = window.innerWidth
        h = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < 15; i++) angels.push(makeAngel(w, h))
    for (let i = 0; i < 7; i++) satans.push(makeSatan(w, h))

    function tick(now: number) {
        ctx!.clearRect(0, 0, w, h)
        ctx!.globalAlpha = 1

        if (!giantSatan && now >= nextGiantSatanAt) {
            giantSatan = makeGiantSatan(w, h, now)
        }

        // ── angels ────────────────────────────────────
        for (let i = angels.length - 1; i >= 0; i--) {
            const a = angels[i]
            a.t++
            a.wingAngle += 0.14
            a.x += a.vx
            a.y += a.vy + Math.sin(a.t * 0.03) * 0.55

            a.shootCooldown--
            if (a.shootCooldown <= 0) {
                a.shootCooldown = 55 + Math.floor(Math.random() * 60)
                const dir = a.flip ? -1 : 1
                a.hearts.push({
                    x: a.x + dir * 36,
                    y: a.y - 2,
                    vx: dir * (3.5 + Math.random() * 2.5),
                    vy: (Math.random() - 0.5) * 2,
                    size: 7 + Math.random() * 7,
                    opacity: 1,
                    hue: Math.random() * 60 + 330,
                })
            }

            for (let j = a.hearts.length - 1; j >= 0; j--) {
                const hrt = a.hearts[j]
                hrt.x += hrt.vx
                hrt.y += hrt.vy
                hrt.vy += 0.04
                hrt.opacity -= 0.008

                const hitSatanIdx = satans.findIndex(s => hitTest(hrt, s.x, s.y, 30 + hrt.size))
                if (hitSatanIdx !== -1) {
                    angelScore += 1
                    splats.push(...makeSatanBloodSplat(satans[hitSatanIdx].x, satans[hitSatanIdx].y))
                    satans[hitSatanIdx] = makeSatan(w, h)
                    a.hearts.splice(j, 1)
                    continue
                }

                if (giantSatan && hitTest(hrt, giantSatan.x, giantSatan.y, 58 * giantSatan.scale + hrt.size)) {
                    angelScore += 1
                    giantSatan.health--

                    if (giantSatan.health <= 0) {
                        splats.push(...makeSatanBloodSplat(giantSatan.x, giantSatan.y))
                        angelScore += 20
                        giantSatan = null
                        nextGiantSatanAt = now + randomGiantSatanDelayMs()
                    } else if (Math.random() < 0.64) {
                        splats.push(...makeSatanHitSparks(hrt.x, hrt.y))
                    }

                    a.hearts.splice(j, 1)
                    continue
                }

                if (hrt.opacity <= 0) {
                    a.hearts.splice(j, 1)
                    continue
                }
                drawColoredHeart(ctx!, hrt.x, hrt.y, hrt.size, hrt.opacity, hrt.hue, hrt.color)
            }

            drawAngel(ctx!, a)

            if (a.x >= w - 36) {
                angelScore += 20
                goalStars.push(
                    makeGoalStar(
                        Math.max(36, w - 36),
                        clamp(a.y, 44, h - 44),
                        '#facc15',
                        '#fff7b3',
                        'rgba(250, 204, 21, 0.98)',
                    ),
                )
                angels[i] = makeAngel(w, h)
                continue
            }

            if (a.x < -100 || a.x > w + 100) {
                angels[i] = makeAngel(w, h)
            }
        }

        // -- satans -------------------------------------------------
        for (let i = satans.length - 1; i >= 0; i--) {
            const s = satans[i]
            s.t++
            s.wingAngle += 0.18
            s.tailAngle += 0.12
            s.x += s.vx
            s.y += s.vy + Math.sin(s.t * 0.04) * 0.7

            s.shootCooldown--
            if (s.shootCooldown <= 0) {
                s.shootCooldown = 38 + Math.floor(Math.random() * 50)
                const dir = s.flip ? -1 : 1
                s.hearts.push({
                    x: s.x + dir * 38,
                    y: s.y - 3,
                    vx: dir * (4.4 + Math.random() * 2.8),
                    vy: (Math.random() - 0.5) * 2.4,
                    size: 6 + Math.random() * 6,
                    opacity: 0.95,
                    hue: 0,
                    color: '#050505',
                })
            }

            for (let j = s.hearts.length - 1; j >= 0; j--) {
                const hrt = s.hearts[j]
                hrt.x += hrt.vx
                hrt.y += hrt.vy
                hrt.vy += 0.025
                hrt.opacity -= 0.01

                const hitAngelIdx = angels.findIndex(a => hitTest(hrt, a.x, a.y, 26 + hrt.size))
                if (hitAngelIdx !== -1) {
                    satanScore += 1
                    splats.push(...makeAngelSplat(angels[hitAngelIdx].x, angels[hitAngelIdx].y))
                    angels[hitAngelIdx] = makeAngel(w, h)
                    s.hearts.splice(j, 1)
                    continue
                }

                if (hrt.opacity <= 0) {
                    s.hearts.splice(j, 1)
                    continue
                }
                drawColoredHeart(ctx!, hrt.x, hrt.y, hrt.size, hrt.opacity, hrt.hue, hrt.color)
            }

            drawSatan(ctx!, s)

            if (s.x <= 36) {
                satanScore += 50
                goalStars.push(
                    makeGoalStar(36, clamp(s.y, 44, h - 44), '#050505', '#991b1b', 'rgba(248, 113, 113, 0.68)'),
                )
                satans[i] = makeSatan(w, h)
                continue
            }

            if (s.x < -120 || s.x > w + 120) {
                satans[i] = makeSatan(w, h)
            }
        }

        // -- giant satan -------------------------------------------
        if (giantSatan) {
            const s = giantSatan
            const targetCluster = findLargestAngelCluster(angels, w, h)
            steerGiantSatanTowardCluster(s, targetCluster, w, h)

            s.t++
            s.wingAngle += 0.25
            s.tailAngle += 0.18
            s.x += s.vx
            s.y += s.vy + Math.sin(s.t * 0.035) * 0.62

            const verticalMargin = Math.min(92, Math.max(48, h * 0.2))
            const maxY = Math.max(verticalMargin, h - verticalMargin)
            if (s.y <= verticalMargin || s.y >= maxY) s.vy *= -1
            s.y = clamp(s.y, verticalMargin, maxY)

            s.fireCooldown--
            if (s.fireCooldown <= 0 && targetCluster) {
                if (s.burstShotsLeft <= 0) {
                    s.burstShotsLeft = 10 + Math.floor(Math.random() * 8)
                }

                fireGiantSatanMachineGun(s, targetCluster)
                s.burstShotsLeft--
                s.fireCooldown =
                    s.burstShotsLeft > 0 ? 2 + Math.floor(Math.random() * 2) : 16 + Math.floor(Math.random() * 14)
            }

            for (let j = s.hearts.length - 1; j >= 0; j--) {
                const hrt = s.hearts[j]
                hrt.x += hrt.vx
                hrt.y += hrt.vy
                hrt.opacity -= 0.012

                const hitAngelIdx = angels.findIndex(a => hitTest(hrt, a.x, a.y, 28 + hrt.size))
                if (hitAngelIdx !== -1) {
                    satanScore += 1
                    splats.push(...makeAngelSplat(angels[hitAngelIdx].x, angels[hitAngelIdx].y))
                    angels[hitAngelIdx] = makeAngel(w, h)
                    s.hearts.splice(j, 1)
                    continue
                }

                if (hrt.opacity <= 0 || hrt.x < -90 || hrt.x > w + 90 || hrt.y < -90 || hrt.y > h + 90) {
                    s.hearts.splice(j, 1)
                    continue
                }
                drawColoredHeart(ctx!, hrt.x, hrt.y, hrt.size, hrt.opacity, hrt.hue, hrt.color)
            }

            const fadeMs = 900
            const opacity = clamp(Math.min(now - s.spawnedAt, s.expiresAt - now) / fadeMs, 0, 1)
            drawSatan(ctx!, s, s.scale, opacity)
            drawGiantSatanHealth(ctx!, s, opacity)

            if (s.x <= 36 + 38 * s.scale) {
                satanScore += 45
                goalStars.push(
                    makeGoalStar(36, clamp(s.y, 44, h - 44), '#050505', '#f87171', 'rgba(248, 113, 113, 0.88)'),
                )
                giantSatan = null
                nextGiantSatanAt = now + randomGiantSatanDelayMs()
            } else if (now >= s.expiresAt || s.x < -220 || s.x > w + 220) {
                giantSatan = null
                nextGiantSatanAt = now + randomGiantSatanDelayMs()
            }
        }

        for (let i = splats.length - 1; i >= 0; i--) {
            const p = splats[i]
            p.x += p.vx
            p.y += p.vy
            p.vy += p.gravity ?? 0.05
            p.opacity -= p.fade ?? 0.018
            p.size *= p.shrink ?? 0.985
            if (p.opacity <= 0) {
                splats.splice(i, 1)
                continue
            }

            ctx!.save()
            ctx!.globalAlpha = p.opacity
            ctx!.fillStyle = p.color
            ctx!.beginPath()
            ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx!.fill()
            ctx!.restore()
        }

        for (let i = goalStars.length - 1; i >= 0; i--) {
            const star = goalStars[i]
            star.rotation += star.spin
            star.scale += 0.026
            star.opacity -= 0.012
            if (star.opacity <= 0) {
                goalStars.splice(i, 1)
                continue
            }
            drawGoalStar(ctx!, star)
        }

        const stackedPanels = w < 330
        const panelWidth = Math.min(168, Math.max(118, stackedPanels ? w - 36 : w * 0.18))
        drawScorePanel(ctx!, {
            x: 18,
            y: 18,
            width: panelWidth,
            label: 'Andilci',
            score: angelScore,
            align: 'left',
            background: 'rgba(255, 255, 255, 0.74)',
            border: 'rgba(255, 228, 168, 0.96)',
            labelColor: '#7c3aed',
            scoreColor: '#1f2937',
            glow: 'rgba(255, 255, 255, 0.36)',
        })
        drawScorePanel(ctx!, {
            x: stackedPanels ? 18 : Math.max(18, w - panelWidth - 18),
            y: stackedPanels ? 92 : 18,
            width: panelWidth,
            label: 'Certici',
            score: satanScore,
            align: 'right',
            background: 'rgba(17, 24, 39, 0.78)',
            border: 'rgba(248, 113, 113, 0.62)',
            labelColor: '#fca5a5',
            scoreColor: '#fff7ed',
            glow: 'rgba(127, 29, 29, 0.45)',
        })

        rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
        cancelAnimationFrame(rafId)
        window.removeEventListener('resize', resize)
    }
}
