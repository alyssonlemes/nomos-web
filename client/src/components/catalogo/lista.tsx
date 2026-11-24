import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataListing, Column, LISTING_PAGE_SIZE, SortDirection } from '@/components/listing/DataListing';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { temPermissao } from '@/lib/rbac';
import type { ItemCatalogo } from '@/services/catalogo-processo';
import type { TextosCatalogo } from './textos';

export function ListaCatalogo({ config }: { config: TextosCatalogo }) {
  const [, setLocation] = useLocation();
  const canCreate = temPermissao('processos', 'criar');
  const canEdit = temPermissao('processos', 'editar');
  const canDelete = temPermissao('processos', 'excluir');
  const [itens, setItens] = useState<ItemCatalogo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [versao, setVersao] = useState(0);
  const debouncedSearch = useDebouncedValue(search, 300);
  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE) || 1;

  useEffect(() => {
    let ativo = true;
    const carregar = async () => {
      try {
        setIsLoading(true);
        const skip = (currentPage - 1) * LISTING_PAGE_SIZE;
        const data = await config.cliente.listar(skip, LISTING_PAGE_SIZE, debouncedSearch || undefined, sortBy, sortDir);
        const maxPage = Math.max(1, Math.ceil((data.total ?? 0) / LISTING_PAGE_SIZE));
        if (!ativo) return;
        if (currentPage > maxPage) {
          setCurrentPage(maxPage);
          return;
        }
        setItens(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        if (ativo) toast.error(err instanceof Error ? err.message : config.erroLista);
      } finally {
        if (ativo) setIsLoading(false);
      }
    };
    carregar();
    return () => {
      ativo = false;
    };
  }, [config, currentPage, debouncedSearch, sortBy, sortDir, versao]);

  const columns: Column<ItemCatalogo>[] = [
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
        <span className="text-muted-foreground line-clamp-2 max-w-[200px]">{row.description || '—'}</span>
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
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`${config.base}/${row.id}/editar`)}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`${config.base}/${row.id}`)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            title="Visualizar"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canDelete && (
            <ConfirmDialog
              title={config.excluirTitulo}
              description={config.excluirDescricao(row.name)}
              confirmText="Excluir"
              cancelText="Cancelar"
              onConfirm={async () => {
                try {
                  await config.cliente.excluir(row.id);
                  toast.success(config.sucessoExcluir);
                  setVersao((atual) => atual + 1);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : config.erroExcluir);
                }
              }}
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
          )}
        </div>
      ),
    },
  ];

  return (
    <DataListing
      storageKey={config.storageKey}
      title={config.titulo}
      description={config.descricao}
      badge={
        <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          {config.unidade(total)}
        </span>
      }
      searchPlaceholder={config.busca}
      searchValue={search}
      onSearchChange={(value) => {
        setSearch(value);
        setCurrentPage(1);
      }}
      primaryAction={canCreate ? { label: config.novo, onClick: () => setLocation(`${config.base}/novo`) } : undefined}
      columns={columns}
      data={itens}
      isLoading={isLoading}
      sortKey={sortBy}
      sortDirection={sortDir}
      onSortChange={(key, direction) => {
        setSortBy(key);
        setSortDir(direction);
        setCurrentPage(1);
      }}
      emptyTitle={search ? config.vazioBusca : config.vazio}
      emptyAction={
        !search && canCreate ? (
          <Button
            variant="outline"
            onClick={() => setLocation(`${config.base}/novo`)}
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            {config.primeiro}
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
      exportFilename={config.exportFilename}
    />
  );
}
