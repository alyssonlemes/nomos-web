import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { DataListing, Column, LISTING_PAGE_SIZE } from '@/components/listing/DataListing';
import { LegalActionTypeService, LegalActionType } from '@/services/legal-action-type.service';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { toast } from 'sonner';

export default function LegalActionTypesPage() {
  const [, setLocation] = useLocation();
  const [types, setTypes] = useState<LegalActionType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE) || 1;

  useEffect(() => {
    loadTypes();
  }, [currentPage, debouncedSearch]);

  const loadTypes = async () => {
    try {
      setIsLoading(true);
      const skip = (currentPage - 1) * LISTING_PAGE_SIZE;
      const data = await LegalActionTypeService.getLegalActionTypes(
        skip,
        LISTING_PAGE_SIZE,
        debouncedSearch || undefined,
      );
      const maxPage = Math.max(1, Math.ceil((data.total ?? 0) / LISTING_PAGE_SIZE));
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
        return;
      }
      setTypes(data.types ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tipos de ação';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, type: LegalActionType) => {
    try {
      await LegalActionTypeService.deleteLegalActionType(id);
      toast.success('Tipo de ação excluído com sucesso!');
      loadTypes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir tipo de ação';
      toast.error(errorMessage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const columns: Column<LegalActionType>[] = [
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
            onClick={() => setLocation(`/legal-action-types/${row.id}/editar`)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/legal-action-types/${row.id}`)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <ConfirmDialog
            title="Excluir tipo de ação"
            description={`Tem certeza que deseja excluir o tipo "${row.name}"? Se houver processos usando este tipo, a exclusão não será permitida.`}
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
      storageKey="tipos-acao"
      title="Tipos de Ações"
      description="Gerencie os tipos de ações jurídicas (ex.: Trabalhista, Cível)"
      badge={
        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          {total} tipo{total !== 1 ? 's' : ''}
        </span>
      }
      searchPlaceholder="Buscar por nome ou código..."
      searchValue={search}
      onSearchChange={handleSearchChange}
      primaryAction={{ label: 'Novo tipo', onClick: () => setLocation('/legal-action-types/novo') }}
      columns={columns}
      data={types}
      isLoading={isLoading}
      emptyTitle={search ? 'Nenhum tipo encontrado para a busca.' : 'Nenhum tipo de ação cadastrado.'}
      emptyAction={
        !search ? (
          <Button
            variant="outline"
            onClick={() => setLocation('/legal-action-types/novo')}
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Tipo
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
      exportFilename="tipos-de-acao"
    />
  );
}
