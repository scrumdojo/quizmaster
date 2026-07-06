import { useState } from 'react'
import { useNavigate } from 'react-router'

import { postPoll } from '#fe/make/api/poll.ts'
import { Button, Field, Form, SubmitButton, TextInput } from '#fe/shared'
import { Page } from '#fe/shared/page.tsx'
import { urls, useWorkspaceId } from '#fe/urls.ts'

interface AnswerDraft {
    readonly id: number
    readonly text: string
}

export const CreatePollPage = () => {
    const workspaceId = useWorkspaceId()
    const navigate = useNavigate()
    const workspaceUrl = urls.workspace(workspaceId, 'polls')

    const [question, setQuestion] = useState('')
    const [answers, setAnswers] = useState<readonly AnswerDraft[]>([
        { id: 1, text: '' },
        { id: 2, text: '' },
    ])

    const setAnswerText = (id: number, text: string) =>
        setAnswers(answers.map(answer => (answer.id === id ? { ...answer, text } : answer)))

    const addAnswer = () => setAnswers([...answers, { id: Math.max(...answers.map(a => a.id)) + 1, text: '' }])

    const submit = () => {
        const request = { question, answers: answers.map(a => a.text).filter(text => text.trim() !== '') }
        void postPoll(workspaceId, request).then(() => navigate(workspaceUrl))
    }

    return (
        <Page
            id="create-poll-page"
            title="Create Poll"
            subtitle="Ask one question, offer a few answers, and collect votes from your audience."
            back={{ to: workspaceUrl, label: 'Back to workspace' }}
        >
            <Form onSubmit={submit}>
                <Field label="Poll question" required>
                    <TextInput id="poll-question" placeholder="question" value={question} onChange={setQuestion} />
                </Field>
                <Field label="Answers" required>
                    {answers.map(answer => (
                        <TextInput
                            key={answer.id}
                            className="poll-answer"
                            placeholder="answer"
                            value={answer.text}
                            onChange={text => setAnswerText(answer.id, text)}
                        />
                    ))}
                    <Button id="add-poll-answer" onClick={addAnswer}>
                        + Add answer
                    </Button>
                </Field>
                <SubmitButton />
            </Form>
        </Page>
    )
}
