import { useEffect, useRef } from 'react'
import './timeout-reached-modal.scss'
import { useLanguage } from '#fe/i18n/language-context.tsx'
import { EvaluateButton } from '#fe/take/quiz-take/components/buttons.tsx'

interface TimeOutReachedModalProps {
    readonly onConfirm: () => void
}

export const TimeOutReachedModal = ({ onConfirm }: TimeOutReachedModalProps) => {
    const { t } = useLanguage()
    const dialogRef = useRef<HTMLDialogElement>(null)
    useEffect(() => {
        if (dialogRef.current) {
            dialogRef.current.showModal()
        }
    }, [])

    return (
        <dialog ref={dialogRef} className="timeout-modal">
            <p>{t.take.timesUp}</p>
            <EvaluateButton onClick={onConfirm} />
        </dialog>
    )
}
