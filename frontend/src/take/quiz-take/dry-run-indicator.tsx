import './dry-run-indicator.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'

export const DryRunIndicator = () => {
    const { t } = useLanguage()
    return (
        <div className="dry-run-indicator" data-testid="dry-run-indicator">
            {t.take.dryRunNotice}
        </div>
    )
}
