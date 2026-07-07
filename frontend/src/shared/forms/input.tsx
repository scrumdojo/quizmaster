import type { KeyboardEvent } from 'react'
import './input.scss'

export interface InputProps<V> {
    readonly placeholder?: string
    readonly className?: string
    readonly id?: string
    readonly value: V
    readonly onChange: (value: V) => void
    readonly onKeyDown?: (event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    readonly min?: number
    readonly step?: number | 'any'
}

export function Input<V>(type: string, toText: (value: V) => string, toValue: (value: string) => V) {
    return ({ placeholder, className, id, value, onChange, min, step }: InputProps<V>) => (
        <input
            type={type}
            id={id}
            className={className}
            placeholder={placeholder}
            min={min}
            step={step}
            value={toText(value)}
            onChange={e => onChange(toValue(e.target.value))}
        />
    )
}

export const TextInput = Input<string>(
    'text',
    v => v,
    s => s,
)

export const NumberInput = Input<number>(
    'number',
    v => v.toString(),
    s => Number(s),
)

export const DateInput = Input<string>(
    'date',
    v => v,
    s => s,
)

export const DecimalInput = ({ id, className, placeholder, value, onChange }: InputProps<string>) => (
    <input
        type="text"
        inputMode="decimal"
        id={id}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
    />
)
