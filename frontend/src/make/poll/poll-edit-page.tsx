import './poll-edit-page.scss'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'

import { useLanguage } from '#fe/i18n/language-context.tsx'
import { fetchWorkspacePoll, postPoll, putPoll } from '#fe/make/api/poll.ts'
import { Button, Field, Form, SubmitButton, TextInput, TrashButton } from '#fe/shared'
import { useApi } from '#fe/shared/api/hooks.ts'
import { createValidator, ErrorMessage } from '#fe/shared/forms/validations.tsx'
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

type ErrorCode = 'empty-question' | 'empty-answer'

export const PollEditPage = () => {
    const { t } = useLanguage()
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

    const validate = () => {
        const errors = new Set<ErrorCode>()
        if (question.trim() === '') errors.add('empty-question')
        if (answers.some(answer => answer.text.trim() === '')) errors.add('empty-answer')
        return errors
    }

    const errorMessage: Record<ErrorCode, string> = {
        'empty-question': t.question.errorEmptyQuestion,
        'empty-answer': t.question.errorEmptyAnswer,
    }

    const validator = createValidator(validate, errorMessage)

    const submit = () => {
        const save = isEdit
            ? putPoll(workspaceId, pollId, { question, answers: answers.map(({ id, text }) => ({ id, text })) })
            : postPoll(workspaceId, { question, answers: answers.map(answer => answer.text) })
        void save.then(() => navigate(workspaceUrl))
    }

    return (
        <Page
            id={isEdit ? 'edit-poll-page' : 'create-poll-page'}
            title={isEdit ? t.poll.editTitle : t.poll.createTitle}
            subtitle={t.poll.subtitle}
            back={{ to: workspaceUrl, label: t.question.backToWorkspace }}
        >
            {(!isEdit || pollLoaded) && (
                <Form validator={validator} onSubmit={submit}>
                    <Field label={t.poll.questionFieldLabel} required>
                        <TextInput
                            id="poll-question"
                            placeholder={t.poll.questionPlaceholder}
                            value={question}
                            onChange={setQuestion}
                        />
                        <ErrorMessage errorCode="empty-question" />
                    </Field>
                    <Field label={t.poll.answersFieldLabel} required>
                        {answers.map(answer => (
                            <div key={answer.key} className="poll-answer-row">
                                <TextInput
                                    className="poll-answer"
                                    placeholder={t.question.answerPlaceholder}
                                    value={answer.text}
                                    onChange={text => setAnswerText(answer.key, text)}
                                />
                                <TrashButton onClick={() => removeAnswer(answer.key)} disabled={answers.length < 3} />
                            </div>
                        ))}
                        <ErrorMessage errorCode="empty-answer" />
                        <Button id="add-poll-answer" onClick={addAnswer}>
                            {t.poll.addAnswer}
                        </Button>
                    </Field>
                    <SubmitButton />
                </Form>
            )}
        </Page>
    )
}
