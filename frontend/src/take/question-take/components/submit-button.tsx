import './submit-button.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'

interface SubmitButtonProps {
    readonly disabled: boolean
}

export const SubmitButton = ({ disabled }: SubmitButtonProps) => {
    const { t } = useLanguage()
    return <input type="submit" value={t.take.submit} className="submit-btn" disabled={disabled} />
}
