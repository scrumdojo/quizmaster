import './field.scss'
import { FieldNote } from './field-note.tsx'
import { HelpTooltip } from './help-tooltip.tsx'

interface FieldProps {
    readonly label: string
    readonly children: React.ReactNode
    readonly required?: boolean
    readonly note?: React.ReactNode
    readonly tooltip?: React.ReactNode
}

const Required = () => <span className="required">*</span>

export const Field = ({ label, children, required = false, note, tooltip }: FieldProps) => (
    <div className="field">
        <div className="label">
            {label} {required && <Required />}
            {tooltip && <HelpTooltip label={label}>{tooltip}</HelpTooltip>}
        </div>
        {note && <FieldNote>{note}</FieldNote>}
        {children}
    </div>
)
