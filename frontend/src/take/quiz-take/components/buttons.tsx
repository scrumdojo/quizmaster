import { useLanguage } from '#fe/i18n/language-context.tsx'
import { Button, type WithOnClick } from '#fe/shared/button.tsx'
import './buttons.scss'

export const NextButton = ({ onClick }: WithOnClick) => {
    const { t } = useLanguage()
    return (
        <Button id="next" className="button primary" onClick={onClick}>
            {t.take.nextQuestion}
        </Button>
    )
}

interface EvaluateButtonProps extends WithOnClick {
    readonly disabled?: boolean
}

export const EvaluateButton = ({ onClick, disabled = false }: EvaluateButtonProps) => {
    const { t } = useLanguage()
    return (
        <Button id="evaluate" className="button primary" onClick={onClick} disabled={disabled}>
            {t.take.evaluate}
        </Button>
    )
}

export const BackButton = ({ onClick }: WithOnClick) => {
    const { t } = useLanguage()
    return (
        <Button id="back" className="button secondary" onClick={onClick}>
            {t.common.back}
        </Button>
    )
}

interface StartButtonProps extends WithOnClick {
    readonly disabled?: boolean
}

export const StartButton = ({ onClick, disabled = false }: StartButtonProps) => {
    const { t } = useLanguage()
    return (
        <Button id="start" type="button" className="button primary" onClick={onClick} disabled={disabled}>
            {t.take.start}
        </Button>
    )
}

interface FlagButtonProps {
    readonly isFlagged: boolean
    readonly onClick: () => void
}

export const FlagButton = ({ isFlagged, onClick }: FlagButtonProps) => {
    const { t } = useLanguage()
    return (
        <Button
            type="button"
            className="button secondary flag-button"
            onClick={onClick}
            data-testid="flag-toggle"
            data-flagged={isFlagged}
            title={isFlagged ? t.take.removeFlag : t.take.flagThisQuestion}
        >
            {isFlagged ? t.take.flagged : t.take.flag}
        </Button>
    )
}

interface BookmarkButtonProps {
    readonly isBookmarked: boolean
    readonly onClick: () => void
}

export const BookmarkButton = ({ isBookmarked, onClick }: BookmarkButtonProps) => {
    const { t } = useLanguage()
    return (
        <Button
            type="button"
            className="button bookmark-button"
            onClick={onClick}
            data-testid="bookmark-toggle"
            data-bookmarked={isBookmarked}
            title={isBookmarked ? t.take.removeBookmarkTitle : t.take.bookmarkThisQuestion}
        >
            {isBookmarked ? t.take.bookmarked : t.take.bookmark}
        </Button>
    )
}
