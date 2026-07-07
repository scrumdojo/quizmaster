import { useState } from 'react'
import { useNavigate } from 'react-router'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import { postWorkspace, type WorkspaceRequest } from '#fe/make/api/workspace.ts'
import { Alert, Page } from '#fe/shared'
import { tryCatch } from '#fe/shared/helpers.ts'
import { urls } from '#fe/urls.ts'

import { WorkspaceCreateForm } from './workspace-create-form.tsx'

export function WorkspaceCreatePage() {
    const { t } = useLanguage()
    const [errorMessage, setErrorMessage] = useState<string>('')

    const navigate = useNavigate()

    const onSubmit = async (data: WorkspaceRequest) =>
        await tryCatch(setErrorMessage, async () => {
            const response = await postWorkspace(data)
            navigate(urls.workspace(response.guid))
        })

    const onBack = () => {
        navigate(urls.home())
    }

    return (
        <Page title={t.workspace.createTitle} id="create-workspace-page">
            <WorkspaceCreateForm onSubmit={onSubmit} onBack={onBack} />
            {errorMessage && <Alert type="error">{errorMessage}</Alert>}
        </Page>
    )
}
