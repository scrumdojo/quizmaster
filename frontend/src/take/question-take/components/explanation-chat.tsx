import type { KeyboardEvent } from 'react'
import { useState } from 'react'

import { Alert, TextInput } from '#fe/shared'

import { useExplanationChat } from '../use-explanation-chat.ts'
import './explanation-chat.scss'

interface ExplanationChatProps {
    readonly questionId: number
}

export const ExplanationChat = ({ questionId }: ExplanationChatProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const { promptText, setPromptText, loading, error, messages, ask } = useExplanationChat(questionId)

    const submitPrompt = () => {
        if (loading || promptText.trim().length === 0) return
        void ask()
    }

    const onPromptKeyDown = (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (event.key !== 'Enter') return
        event.preventDefault()
        submitPrompt()
    }

    return (
        <div className="explanation-chat" data-testid="explanation-chat">
            <button
                type="button"
                className="explanation-chat__toggle"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(open => !open)}
            >
                Ask a follow-up question
            </button>
            {isOpen && (
                <div className="explanation-chat__composer" data-testid="explanation-chat-composer">
                    {messages.length > 0 && (
                        <div className="explanation-chat__messages">
                            {messages.map((message, index) => (
                                <p
                                    key={`${message.role}-${index}`}
                                    className={`explanation-chat__message explanation-chat__message--${message.role}`}
                                >
                                    {message.text}
                                </p>
                            ))}
                        </div>
                    )}
                    {error && <Alert type="error">{error}</Alert>}
                    <div className="explanation-chat__input-row">
                        <TextInput
                            id="explanation-chat-prompt"
                            className="explanation-chat__input"
                            placeholder="Ask a follow-up question..."
                            value={promptText}
                            onChange={setPromptText}
                            onKeyDown={onPromptKeyDown}
                        />
                        <button
                            type="button"
                            className="explanation-chat__send"
                            disabled={loading || promptText.trim().length === 0}
                            onClick={submitPrompt}
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
