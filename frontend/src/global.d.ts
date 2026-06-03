declare const FEATURE_FLAG_ENABLED: boolean

interface ImportMetaEnv {
    readonly DEV: boolean
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

declare module '*.svg' {
    const content: string
    export default content
}

declare module '*.scss' {}
declare module '*.css' {}

interface Window {
    /** Set by E2E test harness to skip the decorative canvas background. */
    __noCrazyBackground?: boolean
    /** Test-only countdown clock state injected by the E2E harness. */
    __quizClockNow?: number
    /** Test-only countdown clock advance function injected by the E2E harness. */
    __advanceQuizClock?: (ms: number) => void
    /** Live-switch the background animation theme and persist to localStorage. */
    __setAnimationTheme?: (theme: 'angels' | 'mammoths' | 'off') => void
}
