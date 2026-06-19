import type { ReactNode } from 'react'

import { HelpTooltip } from '#fe/shared'

export interface StatsTableColumn {
    readonly label: string
    readonly tooltip?: string
}

interface StatsTableProps {
    readonly testId: string
    readonly caption: string
    readonly columns: readonly (string | StatsTableColumn)[]
    readonly rows: readonly (readonly ReactNode[])[]
}

const columnLabel = (column: string | StatsTableColumn) => (typeof column === 'string' ? column : column.label)

export const StatsTable = ({ testId, caption, columns, rows }: StatsTableProps) => (
    <div className="stats-table">
        <div className="stats-table__scroller">
            <table data-testid={testId}>
                <caption>{caption}</caption>
                <thead>
                    <tr>
                        {columns.map(column => (
                            <th key={columnLabel(column)}>
                                <span className="stats-table__column-label">
                                    <span className="stats-table__column-text">{columnLabel(column)}</span>
                                    {typeof column !== 'string' && column.tooltip && (
                                        <HelpTooltip label={`${column.label} statistics column`}>
                                            {column.tooltip}
                                        </HelpTooltip>
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => (
                                <td key={j}>{cell}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
)
