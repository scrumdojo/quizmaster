import './help-tooltip.scss'
import type { CSSProperties } from 'react'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

interface HelpTooltipProps {
    readonly label: string
    readonly children: React.ReactNode
}

export const HelpTooltip = ({ label, children }: HelpTooltipProps) => {
    const [open, setOpen] = useState(false)
    const [popoverStyle, setPopoverStyle] = useState<CSSProperties>()
    const tooltipId = useId()
    const containerRef = useRef<HTMLSpanElement>(null)
    const contentRef = useRef<HTMLSpanElement>(null)

    useLayoutEffect(() => {
        if (!open) return

        const placeTooltip = () => {
            const container = containerRef.current
            const content = contentRef.current
            if (!container || !content) return

            const boundary = container.closest('form') ?? document.documentElement
            const boundaryRect = boundary.getBoundingClientRect()
            const containerRect = container.getBoundingClientRect()
            const sidePadding = 16
            const availableWidth = Math.max(180, Math.min(352, boundaryRect.width - sidePadding * 2))
            const contentWidth = Math.min(content.scrollWidth, availableWidth)
            const minLeft = boundaryRect.left + sidePadding - containerRect.left
            const maxLeft = boundaryRect.right - sidePadding - containerRect.left - contentWidth
            const left = Math.min(Math.max(0, minLeft), maxLeft)

            setPopoverStyle({
                left,
                maxWidth: availableWidth,
            })
        }

        placeTooltip()
        window.addEventListener('resize', placeTooltip)
        window.addEventListener('scroll', placeTooltip, true)
        return () => {
            window.removeEventListener('resize', placeTooltip)
            window.removeEventListener('scroll', placeTooltip, true)
        }
    }, [open, children])

    useEffect(() => {
        if (!open) return

        const closeOnOutsideClick = (event: MouseEvent | TouchEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
        }
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', closeOnOutsideClick)
        document.addEventListener('touchstart', closeOnOutsideClick)
        document.addEventListener('keydown', closeOnEscape)
        return () => {
            document.removeEventListener('mousedown', closeOnOutsideClick)
            document.removeEventListener('touchstart', closeOnOutsideClick)
            document.removeEventListener('keydown', closeOnEscape)
        }
    }, [open])

    return (
        <span
            className="help-tooltip"
            ref={containerRef}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
            }}
        >
            <button
                type="button"
                className="help-tooltip__trigger"
                aria-label={`Help for ${label}`}
                aria-describedby={open ? tooltipId : undefined}
                aria-expanded={open}
                onClick={() => setOpen(true)}
                onFocus={() => setOpen(true)}
            />
            {open && (
                <span
                    id={tooltipId}
                    className="help-tooltip__content"
                    role="tooltip"
                    ref={contentRef}
                    style={popoverStyle}
                >
                    {children}
                </span>
            )}
        </span>
    )
}
