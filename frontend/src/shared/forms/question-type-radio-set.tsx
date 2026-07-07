import { useLanguage } from '#fe/i18n/language-context.tsx'
import type { QuestionType } from '#shared/types/enums.ts'

import { RadioSet } from './radio-set.tsx'

interface QuestionTypeRadioSetProps {
    readonly name: string
    readonly value: QuestionType
    readonly onChange: (value: QuestionType) => void
}

export const QuestionTypeRadioSet = ({ name, value, onChange }: QuestionTypeRadioSetProps) => {
    const { t } = useLanguage()
    const options: Record<QuestionType, string> = {
        single: t.question.typeSingle,
        multiple: t.question.typeMultiple,
        numerical: t.question.typeNumerical,
    }
    return <RadioSet name={name} value={value} onChange={onChange} options={options} />
}
