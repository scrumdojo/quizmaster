import { Button } from '#fe/shared/button.tsx'

import trashIcon from './trash-delete-bin.svg'
import './trash-button.scss'

type TrashButtonProps = {
    onClick: () => void
    disabled?: boolean
}

export const TrashButton = ({ onClick, disabled }: TrashButtonProps) => (
    <Button className="trash-button" onClick={onClick} disabled={disabled}>
        <img src={trashIcon} alt="Delete" width="20" height="20" />
    </Button>
)
