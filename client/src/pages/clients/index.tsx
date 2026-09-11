import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { DataListing, Column, LISTING_PAGE_SIZE } from '@/components/listing/DataListing';
import { ClientService, Client } from '@/services/client.service';
import { canAccess, getCurrentRole } from '@/lib/rbac';
import { formatClientStatus } from '@/utils/formats';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toast } from 'sonner';

/**
 * Página de Clientes - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Lista de clientes da organização com paginação
 */

export default function ClientesPage() {
  const [, setLocation] = useLocation();
  const currentRole = getCurrentRole();
  const canWriteClients = canAccess(currentRole, 'clients.write');
  const shouldShowOwnDataNotice = currentRole === 'MEMBER' || currentRole === 'VIEWER';
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearch = useDebouncedValue(search, 300);

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE);

  useEffect(() => {
    loadClients();
  }, [currentPage, debouncedSearch, statusFilter]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      const skip = (currentPage - 1) * LISTING_PAGE_SIZE;
      const data = await ClientService.getClients(
        skip,
        LISTING_PAGE_SIZE,
        debouncedSearch || undefined,
        statusFilter === 'all' ? undefined : statusFilter,
      );
      const maxPage = Math.max(1, Math.ceil((data.total ?? 0) / LISTING_PAGE_SIZE));
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
        return;
      }
      setClients(data.clients);
      setTotal(data.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ClientService.deleteClient(id);
      toast.success('Cliente excluído com sucesso!');
      loadClients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      toast.error(errorMessage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const columns: Column<Client>[] = [
    {
      id: 'name',
      header: 'Nome',
      accessorKey: 'name',
      className: 'font-medium text-foreground',
    },
    {
      id: 'email',
      header: 'E-mail',
      accessorKey: 'email',
    },
    {
      id: 'phone',
      header: 'Telefone',
      accessorKey: 'phone',
      sortValue: (client) => client.phone || '',
      exportValue: (client) => client.phone || '-',
      cell: (client) => client.phone || '-',
    },
    {
      id: 'document',
      header: 'Documento',
      accessorKey: 'document',
      className: 'font-mono',
      sortValue: (client) => client.document || '',
      exportValue: (client) => client.document || '-',
      cell: (client) => client.document || '-',
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortValue: (client) => formatClientStatus(client.status),
      exportValue: (client) => formatClientStatus(client.status),
      cell: (client) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            client.status === 'active'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {formatClientStatus(client.status)}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Cadastro',
      accessorKey: 'created_at',
      exportValue: (client) => new Date(client.created_at).toLocaleDateString('pt-BR'),
      cell: (client) => new Date(client.created_at).toLocaleDateString('pt-BR'),
    },
    {
      id: 'actions',
      header: 'Ações',
      headerClassName: 'text-right',
      className: 'text-right',
      sortable: false,
      hideable: false,
      cell: (client) =>
        canWriteClients ? (
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setLocation(`/clientes/${client.id}/editar`);
              }}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <ConfirmDialog
              title="Excluir cliente"
              description={`Tem certeza que deseja excluir o cliente "${client.name}"? Essa acao nao pode ser desfeita.`}
              confirmText="Excluir"
              cancelText="Cancelar"
              onConfirm={() => handleDelete(client.id)}
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
        ) : null,
    },
  ];

  return (
    <DataListing
      storageKey="clientes"
      title="Clientes"
      description="Gerencie os clientes da sua organização"
      badge={
        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          {total} cliente{total !== 1 ? 's' : ''}
        </span>
      }
      notice={
        shouldShowOwnDataNotice ? (
          <Alert>
            <AlertDescription>Você vê apenas seus dados.</AlertDescription>
          </Alert>
        ) : null
      }
      searchPlaceholder="Buscar por nome, e-mail ou documento..."
      searchValue={search}
      onSearchChange={handleSearchChange}
      filters={[
        {
          id: 'status',
          value: statusFilter,
          placeholder: 'Todo status',
          onChange: handleStatusChange,
          options: [
            { value: 'all', label: 'Todo status' },
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' },
            { value: 'prospect', label: 'Prospecção' },
            { value: 'archived', label: 'Arquivado' },
          ],
        },
      ]}
      primaryAction={
        canWriteClients
          ? { label: 'Novo cliente', onClick: () => setLocation('/clientes/novo') }
          : undefined
      }
      columns={columns}
      data={clients}
      isLoading={isLoading}
      emptyTitle="Nenhum cliente encontrado"
      emptyDescription={
        search || statusFilter !== 'all'
          ? 'Tente outro termo ou filtro.'
          : 'Cadastre o primeiro cliente da organização.'
      }
      emptyAction={
        canWriteClients && !search && statusFilter === 'all' ? (
          <Button variant="outline" onClick={() => setLocation('/clientes/novo')}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Cliente
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
      exportFilename="clientes"
    />
  );
}
