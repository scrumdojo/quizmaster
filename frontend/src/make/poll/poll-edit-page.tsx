import './poll-edit-page.scss'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { fetchWorkspacePoll, postPoll, putPoll } from '#fe/make/api/poll.ts'
import { Button, Field, Form, SubmitButton, TextInput, TrashButton } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import { Page } from '#fe/shared/page.tsx'
import { urls, useWorkspaceId } from '#fe/urls.ts'
import type { PollTake } from '#shared/types/poll.ts'

interface AnswerDraft {
    readonly key: number
    readonly id: number | null
    readonly text: string
}

const emptyAnswers: readonly AnswerDraft[] = [
    { key: 1, id: null, text: '' },
    { key: 2, id: null, text: '' },
]

export const PollEditPage = () => {
    const workspaceId = useWorkspaceId()
    const { id: pollId } = useParams()
    const navigate = useNavigate()
    const workspaceUrl = urls.workspace(workspaceId, 'polls')
    const isEdit = pollId !== undefined

    const [question, setQuestion] = useState('')
    const [answers, setAnswers] = useState<readonly AnswerDraft[]>(emptyAnswers)
    const [pollLoaded, setPollLoaded] = useState(false)

    const applyPoll = (poll: PollTake) => {
        setQuestion(poll.question)
        setAnswers(poll.answers.map((answer, idx) => ({ key: idx + 1, id: answer.id, text: answer.text })))
        setPollLoaded(true)
    }

    useApi(pollId, id => fetchWorkspacePoll(workspaceId, id), applyPoll)

    const setAnswerText = (key: number, text: string) =>
        setAnswers(answers.map(answer => (answer.key === key ? { ...answer, text } : answer)))

    const addAnswer = () =>
        setAnswers([...answers, { key: Math.max(...answers.map(a => a.key)) + 1, id: null, text: '' }])

    const removeAnswer = (key: number) => setAnswers(answers.filter(answer => answer.key !== key))

    const submit = () => {
        const filled = answers.filter(answer => answer.text.trim() !== '')
        const save = isEdit
            ? putPoll(workspaceId, pollId, { question, answers: filled.map(({ id, text }) => ({ id, text })) })
            : postPoll(workspaceId, { question, answers: filled.map(answer => answer.text) })
        void save.then(() => navigate(workspaceUrl))
    }

    return (
        <Page
            id={isEdit ? 'edit-poll-page' : 'create-poll-page'}
            title={isEdit ? 'Edit Poll' : 'Create Poll'}
            subtitle="Ask one question, offer a few answers, and collect votes from your audience."
            back={{ to: workspaceUrl, label: 'Back to workspace' }}
        >
            {(!isEdit || pollLoaded) && (
                <Form onSubmit={submit}>
                    <Field label="Poll question" required>
                        <TextInput id="poll-question" placeholder="question" value={question} onChange={setQuestion} />
                    </Field>
                    <Field label="Answers" required>
                        {answers.map(answer => (
                            <div key={answer.key} className="poll-answer-row">
                                <TextInput
                                    className="poll-answer"
                                    placeholder="answer"
                                    value={answer.text}
                                    onChange={text => setAnswerText(answer.key, text)}
                                />
                                <TrashButton onClick={() => removeAnswer(answer.key)} disabled={answers.length < 3} />
                            </div>
                        ))}
                        <Button id="add-poll-answer" onClick={addAnswer}>
                            + Add answer
                        </Button>
                    </Field>
                    <SubmitButton />
                </Form>
            )}
        </Page>
    )
}
