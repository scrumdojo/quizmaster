import { useLanguage } from '#fe/i18n/language-context.tsx'
import { LinkButton } from '#fe/shared'
import { urls } from '#fe/urls.ts'
import './home.scss'

export const HomePage = () => {
    const { t } = useLanguage()

    const highlights = [
        { title: t.home.highlightStartFastTitle, description: t.home.highlightStartFastBody },
        { title: t.home.highlightShapeTitle, description: t.home.highlightShapeBody },
        { title: t.home.highlightOrganizeTitle, description: t.home.highlightOrganizeBody },
    ]

    return (
        <main className="home-page">
            <section className="home-hero">
                <div className="home-hero__content">
                    <div className="home-hero__eyebrow">{t.home.eyebrow}</div>
                    <h1>{t.home.title}</h1>
                    <p>{t.home.intro}</p>
                    <div className="home-hero__actions">
                        <LinkButton
                            id="create-workspace-link"
                            className="home-hero__primary-action"
                            to={urls.workspaceNew()}
                            label={t.home.createWorkspace}
                        />
                    </div>
                </div>
                <div className="home-hero__panel" aria-hidden="true">
                    <div className="home-hero__panel-badge">{t.home.workflowBadge}</div>
                    <div className="home-hero__panel-item">
                        <span>1</span>
                        <div>
                            <strong>{t.home.workflowStep1Title}</strong>
                            <p>{t.home.workflowStep1Body}</p>
                        </div>
                    </div>
                    <div className="home-hero__panel-item">
                        <span>2</span>
                        <div>
                            <strong>{t.home.workflowStep2Title}</strong>
                            <p>{t.home.workflowStep2Body}</p>
                        </div>
                    </div>
                    <div className="home-hero__panel-item">
                        <span>3</span>
                        <div>
                            <strong>{t.home.workflowStep3Title}</strong>
                            <p>{t.home.workflowStep3Body}</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="home-highlights">
                {highlights.map(highlight => (
                    <article key={highlight.title} className="home-highlight-card">
                        <h2>{highlight.title}</h2>
                        <p>{highlight.description}</p>
                    </article>
                ))}
            </section>
        </main>
    )
}
