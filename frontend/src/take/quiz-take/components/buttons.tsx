import { Button, type WithOnClick } from '#fe/shared/button.tsx'
import './buttons.scss'

export const NextButton = ({ onClick }: WithOnClick) => (
    <Button id="next" className="button primary" onClick={onClick}>
        Next question
    </Button>
)

export const EvaluateButton = ({ onClick }: WithOnClick) => (
    <Button id="evaluate" className="button primary" onClick={onClick}>
        Evaluate
    </Button>
)

export const BackButton = ({ onClick }: WithOnClick) => (
    <Button id="back" className="button secondary" onClick={onClick}>
        Back
    </Button>
)

interface StartButtonProps extends WithOnClick {
    readonly disabled?: boolean
}

export const StartButton = ({ onClick, disabled = false }: StartButtonProps) => (
    <Button id="start" type="button" className="button primary" onClick={onClick} disabled={disabled}>
        Start
    </Button>
)

interface FlagButtonProps {
    readonly isFlagged: boolean
    readonly onClick: () => void
}

export const FlagButton = ({ isFlagged, onClick }: FlagButtonProps) => (
    <Button
        type="button"
        className="button flag-button"
        onClick={onClick}
        data-testid="flag-toggle"
        data-flagged={isFlagged}
        title={isFlagged ? 'Remove problematic flag' : 'Flag as problematic'}
    >
        {isFlagged ? '⚑ Flagged as problematic' : '⚐ Flag as problematic'}
    </Button>
)

interface BookmarkButtonProps {
    readonly isBookmarked: boolean
    readonly onClick: () => void
}

export const BookmarkButton = ({ isBookmarked, onClick }: BookmarkButtonProps) => (
    <Button
        type="button"
        className="button bookmark-button"
        onClick={onClick}
        data-testid="bookmark-toggle"
        data-bookmarked={isBookmarked}
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this question'}
    >
        {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
    </Button>
)
