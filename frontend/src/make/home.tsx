import { useState } from 'react'
import { Link } from 'react-router'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import { fetchWorkspaces } from '#fe/make/api/workspace.ts'
import type { Workspace } from '#fe/make/model/workspace.ts'
import { DateInput, Field, Form, LinkButton, TextInput } from '#fe/shared'
import { urls } from '#fe/urls.ts'
import './home.scss'

export const HomePage = () => {
    const { t } = useLanguage()
    const [query, setQuery] = useState('')
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [workspaces, setWorkspaces] = useState<readonly Workspace[] | null>(null)

    const searchWorkspaces = async () => {
        setWorkspaces(
            await fetchWorkspaces({ query: query || undefined, from: from || undefined, to: to || undefined }),
        )
    }

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

            <section className="home-workspaces" aria-label={t.home.existingWorkspacesTitle}>
                <h2 className="home-workspaces__title">{t.home.existingWorkspacesTitle}</h2>
                <Form id="workspace-filter-form" onSubmit={searchWorkspaces}>
                    <div className="home-workspaces__filters">
                        <Field label={t.home.workspaceFilterQueryLabel}>
                            <TextInput
                                id="workspace-filter-query"
                                placeholder={t.home.workspaceFilterQueryLabel}
                                value={query}
                                onChange={setQuery}
                            />
                        </Field>
                        <Field label={t.home.workspaceFilterFromLabel}>
                            <DateInput id="workspace-filter-from" value={from} onChange={setFrom} />
                        </Field>
                        <Field label={t.home.workspaceFilterToLabel}>
                            <DateInput id="workspace-filter-to" value={to} onChange={setTo} />
                        </Field>
                        <button type="submit" className="primary button">
                            {t.home.workspaceFilterSubmitLabel}
                        </button>
                    </div>
                </Form>

                {workspaces &&
                    (workspaces.length > 0 ? (
                        <ul className="home-workspaces__list">
                            {workspaces.map(workspace => (
                                <li key={workspace.guid}>
                                    <Link className="home-workspaces__link" to={urls.workspace(workspace.guid)}>
                                        {workspace.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="home-workspaces__empty">{t.home.workspaceFilterEmptyResult}</p>
                    ))}
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
