import { useLanguage } from '#fe/i18n/language-context.tsx'

import robinIcon from './Robin.svg'

interface RobinFabProps {
    readonly onOpen: () => void
}

export const RobinFab = ({ onOpen }: RobinFabProps) => {
    const { t } = useLanguage()
    return (
        <div className="robin-fab">
            <div className="tooltip">{t.robin.tooltip}</div>
            <button type="button" className="trigger" onClick={onOpen}>
                <img src={robinIcon} alt="Robin" className="icon" />
            </button>
        </div>
    )
}
