import { ReactNode } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc';

export interface Column<T> {
  id?: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  hideable?: boolean;
  sortValue?: (item: T) => string | number | boolean | Date | null | undefined;
  exportValue?: (item: T) => string | number | boolean | null | undefined;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  hoverable?: boolean;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSort?: (columnId: string) => void;
}

export function getColumnId<T>(column: Column<T>, index: number): string {
  if (column.id) return column.id;
  if (column.accessorKey) return String(column.accessorKey);
  return column.header ? column.header : `col-${index}`;
}

export function isColumnSortable<T>(column: Column<T>): boolean {
  if (column.sortable === false) return false;
  if (column.header === 'Ações') return false;
  return Boolean(column.accessorKey || column.sortValue);
}

export function isColumnHideable<T>(column: Column<T>): boolean {
  if (column.hideable === false) return false;
  if (column.header === 'Ações' || column.header === '') return false;
  return true;
}

function toComparable(value: unknown): string | number {
  if (value == null || value === '') return '';
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? value.toLocaleLowerCase('pt-BR') : time;
  }
  return String(value).toLocaleLowerCase('pt-BR');
}

export function getColumnSortValue<T>(item: T, column: Column<T>): unknown {
  if (column.sortValue) return column.sortValue(item);
  if (column.accessorKey) return item[column.accessorKey];
  return '';
}

export function sortRows<T>(
  data: T[],
  columns: Column<T>[],
  sortKey?: string,
  sortDirection: SortDirection = 'asc',
): T[] {
  if (!sortKey) return data;

  const column = columns.find((col, index) => getColumnId(col, index) === sortKey);
  if (!column || !isColumnSortable(column)) return data;

  const direction = sortDirection === 'asc' ? 1 : -1;

  return [...data].sort((a, b) => {
    const av = toComparable(getColumnSortValue(a, column));
    const bv = toComparable(getColumnSortValue(b, column));

    if (av === '' && bv === '') return 0;
    if (av === '') return 1;
    if (bv === '') return -1;

    if (typeof av === 'number' && typeof bv === 'number') {
      return (av - bv) * direction;
    }

    return String(av).localeCompare(String(bv), 'pt-BR', { numeric: true, sensitivity: 'base' }) * direction;
  });
}

export function getColumnExportValue<T>(item: T, column: Column<T>): string {
  if (column.exportValue) {
    const value = column.exportValue(item);
    return value == null ? '' : String(value);
  }
  if (column.accessorKey) {
    const value = item[column.accessorKey];
    return value == null ? '' : String(value);
  }
  const sortValue = column.sortValue?.(item);
  return sortValue == null ? '' : String(sortValue);
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  onRowClick,
  hoverable = true,
  sortKey,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted/20">
            {columns.map((column, index) => {
              const columnId = getColumnId(column, index);
              const sortable = Boolean(onSort) && isColumnSortable(column);
              const isActive = sortKey === columnId;

              return (
                <th
                  key={columnId}
                  className={cn(
                    'text-left py-3 px-4 font-medium text-sm text-muted-foreground whitespace-nowrap',
                    column.headerClassName,
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => onSort?.(columnId)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md transition-colors hover:text-foreground',
                        isActive && 'text-foreground',
                      )}
                    >
                      {column.header}
                      {isActive && sortDirection === 'asc' ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : isActive && sortDirection === 'desc' ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronsUpDown className="h-3.5 w-3.5 opacity-60" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={item.id}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'border-b border-border last:border-b-0',
                hoverable && 'hover:bg-muted/50 transition-colors',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map((column, index) => (
                <td
                  key={getColumnId(column, index)}
                  className={cn('py-3.5 px-4 text-sm', column.className || 'text-muted-foreground')}
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
