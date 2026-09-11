import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Columns3, Download, Loader2, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Column,
  DataTable,
  SortDirection,
  getColumnExportValue,
  getColumnId,
  isColumnHideable,
  sortRows,
} from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export const LISTING_PAGE_SIZE = 10;
export type { Column, SortDirection } from '@/components/ui/data-table';

export interface ListingFilterOption {
  value: string;
  label: string;
}

export interface ListingFilter {
  id: string;
  value: string;
  placeholder?: string;
  options: ListingFilterOption[];
  onChange: (value: string) => void;
}

export interface ListingPagination {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

interface DataListingProps<T extends { id: number | string }> {
  title: string;
  description?: string;
  badge?: ReactNode;
  notice?: ReactNode;
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: ListingFilter[];
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  extraActions?: ReactNode;
  enableColumnToggle?: boolean;
  enableExport?: boolean;
  exportFilename?: string;
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pagination?: ListingPagination;
  storageKey: string;
  sortKey?: string;
  sortDirection?: SortDirection;
  onSortChange?: (sortKey: string, sortDirection: SortDirection) => void;
}

function downloadCsv(filename: string, rows: string[][]) {
  const escapeCell = (value: string) => {
    if (/[";\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csv = rows.map((row) => row.map((cell) => escapeCell(cell ?? '')).join(';')).join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getPageNumbers(current: number, total: number): number[] {
  return Array.from({ length: Math.min(5, total) }, (_, index) => {
    if (total <= 5) return index + 1;
    if (current <= 3) return index + 1;
    if (current >= total - 2) return total - 4 + index;
    return current - 2 + index;
  });
}

export function DataListing<T extends { id: number | string }>({
  title,
  description,
  badge,
  notice,
  searchPlaceholder = 'Buscar...',
  searchValue,
  onSearchChange,
  filters = [],
  primaryAction,
  extraActions,
  enableColumnToggle = true,
  enableExport = true,
  exportFilename,
  columns,
  data,
  isLoading = false,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription,
  emptyAction,
  pagination,
  storageKey,
  sortKey: controlledSortKey,
  sortDirection: controlledSortDirection,
  onSortChange,
}: DataListingProps<T>) {
  const [internalSortKey, setInternalSortKey] = useState<string>();
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection>('asc');
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>([]);
  const sortKey = onSortChange ? controlledSortKey : internalSortKey;
  const sortDirection = onSortChange ? (controlledSortDirection ?? 'asc') : internalSortDirection;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`listing-cols:${storageKey}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHiddenColumnIds(parsed.filter((id) => typeof id === 'string'));
        }
      }
    } catch {
      setHiddenColumnIds([]);
    }
  }, [storageKey]);

  const hideableColumns = useMemo(
    () =>
      columns
        .map((column, index) => ({ column, id: getColumnId(column, index) }))
        .filter(({ column }) => isColumnHideable(column)),
    [columns],
  );

  const visibleColumns = useMemo(
    () =>
      columns.filter((column, index) => !hiddenColumnIds.includes(getColumnId(column, index))),
    [columns, hiddenColumnIds],
  );

  const handleSort = (columnId: string) => {
    const column = columns.find((item, index) => getColumnId(item, index) === columnId);
    const nextKey = column?.sortField || columnId;
    const nextDirection: SortDirection =
      sortKey === nextKey || sortKey === columnId
        ? sortDirection === 'asc'
          ? 'desc'
          : 'asc'
        : 'asc';

    if (onSortChange) {
      onSortChange(nextKey, nextDirection);
      return;
    }

    setInternalSortKey(nextKey);
    setInternalSortDirection(nextDirection);
  };

  const tableData = useMemo(
    () => (onSortChange ? data : sortRows(data, visibleColumns, sortKey, sortDirection)),
    [data, onSortChange, visibleColumns, sortKey, sortDirection],
  );

  const toggleColumn = (columnId: string, visible: boolean) => {
    const next = visible
      ? hiddenColumnIds.filter((id) => id !== columnId)
      : [...hiddenColumnIds, columnId];

    const remainingVisible = hideableColumns.filter(({ id }) => !next.includes(id)).length;
    if (!visible && remainingVisible === 0) {
      toast.error('Mantenha pelo menos uma coluna visível.');
      return;
    }

    setHiddenColumnIds(next);
    localStorage.setItem(`listing-cols:${storageKey}`, JSON.stringify(next));
  };

  const handleExport = () => {
    if (tableData.length === 0) {
      toast.error('Nada para exportar.');
      return;
    }

    const exportColumns = visibleColumns.filter(
      (column) => column.header && column.header !== 'Ações',
    );
    const headerRow = exportColumns.map((column) => column.header);
    const rows = tableData.map((item) =>
      exportColumns.map((column) => getColumnExportValue(item, column)),
    );
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(exportFilename ? `${exportFilename}-${date}` : `${storageKey}-${date}`, [
      headerRow,
      ...rows,
    ]);
    toast.success('Arquivo exportado.');
  };

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
          {badge}
        </div>

        {notice && <div className="mb-6">{notice}</div>}

        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 rounded-xl pl-9 bg-background"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => (
              <Select key={filter.id} value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className="h-10 min-w-[160px] rounded-xl bg-background">
                  <SelectValue placeholder={filter.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}

            {primaryAction && (
              <Button className="h-10 gap-2 rounded-xl" onClick={primaryAction.onClick}>
                <Plus className="h-4 w-4" />
                {primaryAction.label}
              </Button>
            )}

            {extraActions}

            {enableColumnToggle && hideableColumns.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-10 gap-2 rounded-xl bg-background">
                    <Columns3 className="h-4 w-4" />
                    Colunas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs uppercase tracking-wide text-muted-foreground">
                    Exibir colunas
                  </DropdownMenuLabel>
                  {hideableColumns.map(({ column, id }) => (
                    <DropdownMenuCheckboxItem
                      key={id}
                      checked={!hiddenColumnIds.includes(id)}
                      onCheckedChange={(checked) => toggleColumn(id, Boolean(checked))}
                      onSelect={(event) => event.preventDefault()}
                    >
                      {column.header}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {enableExport && (
              <Button
                variant="outline"
                className="h-10 gap-2 rounded-xl bg-background"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tableData.length === 0 ? (
            <div className="text-center py-16 px-6">
              <p className="text-foreground font-medium mb-1">{emptyTitle}</p>
              {emptyDescription && (
                <p className="text-muted-foreground mb-4">{emptyDescription}</p>
              )}
              {emptyAction}
            </div>
          ) : (
            <>
              <DataTable
                columns={visibleColumns}
                data={tableData}
                sortKey={sortKey}
                sortDirection={sortDirection}
                onSort={handleSort}
              />

              {pagination && pagination.total > 0 && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-4 py-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Página {pagination.page} de {Math.max(1, pagination.totalPages)}
                    <span className="ml-2">
                      (Exibindo {(pagination.page - 1) * pagination.pageSize + 1}-
                      {Math.min(pagination.page * pagination.pageSize, pagination.total)} de{' '}
                      {pagination.total})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pagination.onPageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                    >
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {getPageNumbers(pagination.page, Math.max(1, pagination.totalPages)).map((pageNum) => (
                        <Button
                          key={pageNum}
                          variant={pagination.page === pageNum ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => pagination.onPageChange(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => pagination.onPageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
