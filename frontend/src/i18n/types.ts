export type Language = 'en' | 'nl'

export interface Translations {
    readonly common: {
        readonly back: string
        readonly save: string
        readonly cancel: string
        readonly delete: string
        readonly edit: string
        readonly take: string
        readonly share: string
        readonly statistics: string
        readonly dryRun: string
        readonly actions: string
    }
    readonly home: {
        readonly eyebrow: string
        readonly title: string
        readonly intro: string
        readonly createWorkspace: string
        readonly workflowBadge: string
        readonly workflowStep1Title: string
        readonly workflowStep1Body: string
        readonly workflowStep2Title: string
        readonly workflowStep2Body: string
        readonly workflowStep3Title: string
        readonly workflowStep3Body: string
        readonly highlightStartFastTitle: string
        readonly highlightStartFastBody: string
        readonly highlightShapeTitle: string
        readonly highlightShapeBody: string
        readonly highlightOrganizeTitle: string
        readonly highlightOrganizeBody: string
    }
}
