import './question-select.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { QuestionListItem } from '#fe/make/model/question-list-item.ts'
import { tagToColor } from '#fe/make/model/tag.ts'

const MIN_WEIGHT = 1
const MAX_WEIGHT = 5

interface QuestionItemProps {
    readonly question: QuestionListItem
    readonly selected: boolean
    readonly weight: number
    readonly onSelect: (id: number) => void
    readonly onWeightChange: (id: number, weight: number) => void
}

export const QuestionItem = ({ question, selected, weight, onSelect, onWeightChange }: QuestionItemProps) => {
    const { t } = useLanguage()
    const inputId = `question-select-${question.id}`
    const weightId = `question-weight-${question.id}`

    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = Number(e.target.value)
        onWeightChange(question.id, value)
    }

    return (
        <div key={question.id} className="question-item">
            {question.tags.length > 0 && (
                <div className="question-tag-row">
                    {question.tags.map(tag => (
                        <span key={tag} className="question-tag-badge" style={{ background: tagToColor(tag) }}>
                            {tag}
                        </span>
                    ))}
                </div>
            )}
            <input id={inputId} type="checkbox" checked={selected} onChange={() => onSelect(question.id)} />
            <label htmlFor={inputId}>{question.question}</label>
            <label className="question-weight-label">
                {t.quiz.weightLabel}
                <input
                    id={weightId}
                    type="number"
                    className="question-weight-input"
                    min={MIN_WEIGHT}
                    max={MAX_WEIGHT}
                    value={weight}
                    onChange={handleWeightChange}
                />
            </label>
        </div>
    )
}

interface QuestionSelectProps {
    readonly questions: readonly QuestionListItem[]
    readonly selectedIds: ReadonlySet<number>
    readonly weights: ReadonlyMap<number, number>
    readonly onSelect: (id: number) => void
    readonly onWeightChange: (id: number, weight: number) => void
}

export const QuestionSelect = ({ questions, selectedIds, weights, onSelect, onWeightChange }: QuestionSelectProps) => (
    <div className="question-select">
        {questions.map(question => (
            <QuestionItem
                key={question.id}
                question={question}
                selected={selectedIds.has(question.id)}
                weight={weights.get(question.id) ?? 1}
                onSelect={onSelect}
                onWeightChange={onWeightChange}
            />
        ))}
    </div>
)
