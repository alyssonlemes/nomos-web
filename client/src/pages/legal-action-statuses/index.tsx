import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { DataListing, Column, LISTING_PAGE_SIZE, SortDirection } from '@/components/listing/DataListing';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toast } from 'sonner';

export default function LegalActionStatusesPage() {
  const [, setLocation] = useLocation();
  const [statuses, setStatuses] = useState<LegalActionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const debouncedSearch = useDebouncedValue(search, 300);

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE) || 1;

  useEffect(() => {
    loadStatuses();
  }, [currentPage, debouncedSearch, sortBy, sortDir]);

  const loadStatuses = async () => {
    try {
      setIsLoading(true);
      const skip = (currentPage - 1) * LISTING_PAGE_SIZE;
      const data = await LegalActionStatusService.getLegalActionStatuses(
        skip,
        LISTING_PAGE_SIZE,
        debouncedSearch || undefined,
        sortBy,
        sortDir,
      );
      const maxPage = Math.max(1, Math.ceil((data.total ?? 0) / LISTING_PAGE_SIZE));
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
        return;
      }
      setStatuses(data.statuses ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar status de ações';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, status: LegalActionStatus) => {
    try {
      await LegalActionStatusService.deleteLegalActionStatus(id);
      toast.success('Status de ação excluído com sucesso!');
      loadStatuses();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir status de ação';
      toast.error(errorMessage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleSortChange = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortDir(direction);
    setCurrentPage(1);
  };

  const columns: Column<LegalActionStatus>[] = [
    {
      id: 'name',
      header: 'Nome',
      accessorKey: 'name',
      sortValue: (row) => row.name || '',
      exportValue: (row) => row.name || '-',
      cell: (row) => row.name || '-',
    },
    {
      id: 'code',
      header: 'Código',
      accessorKey: 'code',
      sortValue: (row) => row.code || '',
      exportValue: (row) => row.code || '-',
      cell: (row) => <span className="font-mono text-sm">{row.code || '-'}</span>,
    },
    {
      id: 'description',
      header: 'Descrição',
      accessorKey: 'description',
      sortValue: (row) => row.description || '',
      exportValue: (row) => row.description || '-',
      cell: (row) => (
        <span className="text-muted-foreground line-clamp-2 max-w-[200px]">
          {row.description || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      sortable: false,
      hideable: false,
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/legal-action-statuses/${row.id}/editar`)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/legal-action-statuses/${row.id}`)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            title="Excluir status de ação"
            description={`Tem certeza que deseja excluir o status "${row.name}"? Se houver processos usando este status, a exclusão não será permitida.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            onConfirm={() => handleDelete(row.id, row)}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      ),
    },
  ];

  return (
    <DataListing
      storageKey="status-acao"
      title="Status de Ações"
      description="Gerencie os status das ações jurídicas (ex.: Pré-processual, Em andamento)"
      badge={
        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          {total} status
        </span>
      }
      searchPlaceholder="Buscar por nome ou código..."
      searchValue={search}
      onSearchChange={handleSearchChange}
      primaryAction={{
        label: 'Novo status',
        onClick: () => setLocation('/legal-action-statuses/novo'),
      }}
      columns={columns}
      data={statuses}
      isLoading={isLoading}
      sortKey={sortBy}
      sortDirection={sortDir}
      onSortChange={handleSortChange}
      emptyTitle={search ? 'Nenhum status encontrado para a busca.' : 'Nenhum status de ação cadastrado.'}
      emptyAction={
        !search ? (
          <Button
            variant="outline"
            onClick={() => setLocation('/legal-action-statuses/novo')}
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Status
          </Button>
        ) : null
      }
      pagination={{
        page: currentPage,
        totalPages,
        total,
        pageSize: LISTING_PAGE_SIZE,
        onPageChange: setCurrentPage,
      }}
      exportFilename="status-de-acao"
    />
  );
}
