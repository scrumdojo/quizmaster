import './progress-bar.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'

interface ProgressBarProps {
    readonly current: number
    readonly total: number
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
    const { t } = useLanguage()
    const percent = total > 0 ? Math.round((current / total) * 100) : 0
    return (
        <div className="quiz-progress">
            <div className="meta">
                <span className="position">{t.take.questionPosition(current, total)}</span>
                <span className="percent">{percent}%</span>
            </div>
            <progress id="progress-bar" value={current} max={total} />
        </div>
    )
}
