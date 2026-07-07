import { useState } from 'react'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { WorkspaceRequest } from '#fe/make/api/workspace.ts'
import { Field, SubmitButton, TextInput, Form, Row, Button } from '#fe/shared'

interface WorkspaceCreateProps {
    readonly onSubmit: (data: WorkspaceRequest) => void
    readonly onBack: () => void
}

export const WorkspaceCreateForm = ({ onSubmit, onBack }: WorkspaceCreateProps) => {
    const { t } = useLanguage()
    const [title, setTitle] = useState<string>('')

    return (
        <Form onSubmit={() => onSubmit({ title })}>
            <Field label={t.workspace.workspaceTitleFieldLabel}>
                <TextInput id="workspace-title" value={title} onChange={setTitle} />
            </Field>
            <Row>
                <Button id="back" className="primary button" onClick={onBack}>
                    {t.common.back}
                </Button>
                <SubmitButton />
            </Row>
        </Form>
    )
}
