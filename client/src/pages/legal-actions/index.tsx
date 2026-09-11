import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { DataListing, Column, LISTING_PAGE_SIZE, SortDirection } from '@/components/listing/DataListing';
import { LegalActionService, LegalAction } from '@/services/legal-action.service';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';
import { formatLegalStatus, formatActionType } from '@/utils/formats';
import { canAccess, getCurrentRole } from '@/lib/rbac';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toast } from 'sonner';

export default function ProcessosPage() {
  const [, setLocation] = useLocation();
  const currentRole = getCurrentRole();
  const canReadLegalActions = canAccess(currentRole, 'legalActions.read');
  const canWriteLegalActions = canAccess(currentRole, 'legalActions.write');
  const shouldShowOwnDataNotice = currentRole === 'MEMBER' || currentRole === 'VIEWER';
  const [actions, setActions] = useState<LegalAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statuses, setStatuses] = useState<LegalActionStatus[]>([]);
  const [selectedStatusCode, setSelectedStatusCode] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const debouncedSearch = useDebouncedValue(search, 300);

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE);

  useEffect(() => {
    loadActions();
  }, [currentPage, selectedStatusCode, debouncedSearch, sortBy, sortDir]);

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const { statuses } = await LegalActionStatusService.getLegalActionStatuses(0, 500);
        setStatuses(statuses);
      } catch {
        setStatuses([]);
      }
    };

    loadStatuses();
  }, []);

  const loadActions = async () => {
    try {
      setIsLoading(true);
      const skip = (currentPage - 1) * LISTING_PAGE_SIZE;
      const data = await LegalActionService.getLegalActions(
        skip,
        LISTING_PAGE_SIZE,
        selectedStatusCode === 'all' ? undefined : selectedStatusCode,
        undefined,
        debouncedSearch || undefined,
        sortBy,
        sortDir,
      );
      const maxPage = Math.max(1, Math.ceil((data.total || 0) / LISTING_PAGE_SIZE));
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
        return;
      }
      setActions(data.actions || []);
      setTotal(data.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar processos';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await LegalActionService.deleteLegalAction(id);
      toast.success('Processo excluído com sucesso!');
      loadActions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir processo';
      toast.error(errorMessage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatusCode(value);
    setCurrentPage(1);
  };

  const handleSortChange = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortDir(direction);
    setCurrentPage(1);
  };

  const getActionTypeCode = (row: LegalAction) => {
    const actionType = row.action_type as string | { code?: string } | null;
    return typeof actionType === 'string' ? actionType : actionType?.code;
  };

  const columns: Column<LegalAction>[] = [
    {
      id: 'number',
      header: 'Número',
      accessorKey: 'number',
      className: 'font-mono',
      sortValue: (row) => row.number || '',
      exportValue: (row) => row.number || '-',
      cell: (row) => row.number || '-',
    },
    {
      id: 'title',
      header: 'Assunto',
      accessorKey: 'title',
      sortValue: (row) => row.title || '',
      exportValue: (row) => row.title || '-',
      cell: (row) => row.title || '-',
    },
    {
      id: 'action_type',
      header: 'Tipo',
      sortValue: (row) => formatActionType(getActionTypeCode(row)),
      exportValue: (row) => formatActionType(getActionTypeCode(row)),
      cell: (row) => formatActionType(getActionTypeCode(row)),
    },
    {
      id: 'legal_status',
      header: 'Status',
      accessorKey: 'legal_status',
      sortValue: (row) => formatLegalStatus(row.legal_status),
      exportValue: (row) => formatLegalStatus(row.legal_status),
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          {formatLegalStatus(row.legal_status)}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Criado em',
      accessorKey: 'created_at',
      exportValue: (row) => new Date(row.created_at).toLocaleDateString('pt-BR'),
      cell: (row) => new Date(row.created_at).toLocaleDateString('pt-BR'),
    },
    {
      id: 'actions',
      header: 'Ações',
      sortable: false,
      hideable: false,
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) =>
        canWriteLegalActions ? (
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/legal-actions/${row.id}/editar`)}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/legal-actions/${row.id}`)}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
              title="Visualizar"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <ConfirmDialog
              title="Excluir processo"
              description={`Tem certeza que deseja excluir o processo "${row.number || row.title}"? Essa acao nao pode ser desfeita.`}
              confirmText="Excluir"
              cancelText="Cancelar"
              onConfirm={() => handleDelete(row.id)}
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
        ) : (
          <div className="text-xs text-muted-foreground">Sem ações</div>
        ),
    },
  ];

  if (!canReadLegalActions) {
    return (
      <div className="p-8 min-h-full">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Você não tem permissão para acessar Processos.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <DataListing
      storageKey="processos"
      title="Processos"
      description="Gerencie as ações jurídicas da sua organização"
      badge={
        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          {total} processo{total !== 1 ? 's' : ''}
        </span>
      }
      notice={
        shouldShowOwnDataNotice ? (
          <Alert>
            <AlertDescription>Você vê apenas seus dados.</AlertDescription>
          </Alert>
        ) : null
      }
      searchPlaceholder="Buscar por número ou assunto..."
      searchValue={search}
      onSearchChange={handleSearchChange}
      filters={[
        {
          id: 'status',
          value: selectedStatusCode,
          placeholder: 'Todo status',
          onChange: handleStatusChange,
          options: [
            { value: 'all', label: 'Todo status' },
            ...statuses.map((status) => ({
              value: status.code,
              label: status.name || status.code,
            })),
          ],
        },
      ]}
      primaryAction={
        canWriteLegalActions
          ? { label: 'Novo processo', onClick: () => setLocation('/legal-actions/novo') }
          : undefined
      }
        columns={columns}
        data={actions}
        isLoading={isLoading}
        sortKey={sortBy}
        sortDirection={sortDir}
        onSortChange={handleSortChange}
      emptyTitle="Nenhum processo encontrado"
      emptyDescription={
        search || selectedStatusCode !== 'all'
          ? 'Tente outro termo ou filtro.'
          : 'Cadastre o primeiro processo da organização.'
      }
      emptyAction={
        canWriteLegalActions && !search && selectedStatusCode === 'all' ? (
          <Button
            variant="outline"
            onClick={() => setLocation('/legal-actions/novo')}
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Processo
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
      exportFilename="processos"
    />
  );
}
