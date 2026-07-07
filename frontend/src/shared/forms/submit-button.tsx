import { useLanguage } from '#fe/i18n/language-context.tsx'

export const SubmitButton = () => {
    const { t } = useLanguage()
    return (
        <button type="submit" className="primary button">
            {t.common.save}
        </button>
    )
}
