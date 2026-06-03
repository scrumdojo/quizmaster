import './field-note.scss'

interface FieldNoteProps {
    readonly children: React.ReactNode
    readonly id?: string
}

export const FieldNote = ({ children, id }: FieldNoteProps) => (
    <p id={id} className="field-note">
        {children}
    </p>
)
