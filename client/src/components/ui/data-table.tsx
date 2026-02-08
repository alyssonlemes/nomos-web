import { ReactNode } from 'react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  hoverable?: boolean;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  onRowClick,
  hoverable = true,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`text-left py-3 px-4 font-medium text-sm text-muted-foreground ${column.headerClassName || ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={`border-b border-border ${
                hoverable ? 'hover:bg-muted/50 transition-colors' : ''
              } ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((column, index) => (
                <td
                  key={index}
                  className={`py-3 px-4 text-sm ${column.className || 'text-muted-foreground'}`}
                >
                  {column.cell
                    ? column.cell(item)
                    : column.accessorKey
                    ? String(item[column.accessorKey] ?? '-')
                    : '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
