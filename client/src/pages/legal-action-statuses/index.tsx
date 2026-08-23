import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { AlertCircle, Loader2, Eye, Plus, Edit, Trash2, Search } from 'lucide-react';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';
import { toast } from 'sonner';

const ITEMS_PER_PAGE = 10;

export default function LegalActionStatusesPage() {
  const [, setLocation] = useLocation();
  const [statuses, setStatuses] = useState<LegalActionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;

  useEffect(() => {
    loadStatuses();
  }, [currentPage, search]);

  const loadStatuses = async () => {
    try {
      setIsLoading(true);
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const data = await LegalActionStatusService.getLegalActionStatuses(
        skip,
        ITEMS_PER_PAGE,
        search || undefined
      );
      setStatuses(data.statuses ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar status de ações';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
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

  const columns: Column<LegalActionStatus>[] = [
    {
      header: 'Nome',
      accessorKey: 'name',
      cell: (row) => row.name || '-',
    },
    {
      header: 'Código',
      accessorKey: 'code',
      cell: (row) => (
        <span className="font-mono text-sm">{row.code || '-'}</span>
      ),
    },
    {
      header: 'Descrição',
      accessorKey: 'description',
      cell: (row) => (
        <span className="text-muted-foreground line-clamp-2 max-w-[200px]">
          {row.description || '—'}
        </span>
      ),
    },
    {
      header: 'Ações',
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
      headerClassName: 'text-right',
      className: 'text-right',
    },
  ];

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Status de Ações</h1>
            <p className="text-muted-foreground">Gerencie os status das ações jurídicas (ex.: Pré-processual, Em andamento)</p>
          </div>
          <Button className="gap-2" onClick={() => setLocation('/legal-action-statuses/novo')}>
            <Plus className="w-4 h-4" />
            Novo Status
          </Button>
        </div>


        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Lista de Status de Ações</CardTitle>
                <CardDescription>
                  Total de {total} status
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou código..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : statuses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {search ? 'Nenhum status encontrado para a busca.' : 'Nenhum status de ação cadastrado.'}
                </p>
                {!search && (
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/legal-action-statuses/novo')}
                    className="hover:bg-accent hover:text-accent-foreground"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Status
                  </Button>
                )}
              </div>
            ) : (
              <>
                <DataTable columns={columns} data={statuses} />

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                      <span className="ml-2">
                        (Exibindo {(currentPage - 1) * ITEMS_PER_PAGE + 1}-
                        {Math.min(currentPage * ITEMS_PER_PAGE, total)} de {total})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => goToPage(pageNum)}
                              className="h-8 w-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
