import type { ReactNode } from "react"

export interface AdminDataTableColumn<T> {
  key: string
  label: string
  render: (item: T) => ReactNode
  className?: string
}

export function AdminDataTable<T>({
  columns,
  rows,
  getRowKey,
  emptyLabel = "No records found",
}: {
  columns: AdminDataTableColumn<T>[]
  rows: T[]
  getRowKey: (item: T) => string
  emptyLabel?: string
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border/70">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="px-4 py-3 font-semibold">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={getRowKey(row)} className="bg-card/40 align-top">
                  {columns.map((column) => (
                    <td key={column.key} className={column.className ?? "px-4 py-4"}>
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="bg-card/40 px-4 py-8 text-center text-muted-foreground"
                >
                  {emptyLabel}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
