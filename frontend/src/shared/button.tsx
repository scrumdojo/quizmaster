export interface WithOnClick {
    readonly onClick: React.MouseEventHandler<HTMLButtonElement>
}

interface ButtonProps extends WithOnClick {
    readonly id?: string
    readonly className?: string
    readonly type?: 'button' | 'submit'
    readonly children: React.ReactNode
    readonly disabled?: boolean
    readonly title?: string
}

export const Button = ({
    id,
    className,
    type = 'button',
    onClick,
    children,
    disabled,
    title,
    ...data
}: ButtonProps & React.HTMLAttributes<HTMLButtonElement>) => (
    <button
        id={id}
        type={type}
        className={`${className}`}
        onClick={onClick}
        disabled={disabled}
        title={title}
        {...data}
    >
        {children}
    </button>
)
