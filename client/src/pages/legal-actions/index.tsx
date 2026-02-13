import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { LegalActionService, LegalAction } from '@/services/legal-action.service';
import { formatLegalStatus, formatActionType } from '@/utils/formats';

export default function ProcessosPage() {
  const [, setLocation] = useLocation();
  const [actions, setActions] = useState<LegalAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    loadActions();
  }, [currentPage]);

  const loadActions = async () => {
    try {
      setIsLoading(true);
      setError('');
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const data = await LegalActionService.getLegalActions(skip, ITEMS_PER_PAGE);
      setActions(data.actions || []);
      setTotal(data.total || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar processos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleDelete = async (id: number, action: LegalAction) => {
    try {
      setError('');
      setSuccess('');
      await LegalActionService.deleteLegalAction(id);
      setSuccess('Processo excluído com sucesso!');
      loadActions();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir processo';
      setError(errorMessage);
    }
  };

  const columns: Column<LegalAction>[] = [
    {
      header: 'Número',
      accessorKey: 'number',
      className: 'font-mono',
      cell: (row) => row.number || '-',
    },
    {
      header: 'Assunto',
      accessorKey: 'title',
      cell: (row) => row.title || '-',
    },
    {
      header: 'Tipo',
      accessorKey: 'action_type',
      cell: (row) => formatActionType(row.action_type),
    },
    {
      header: 'Status',
      accessorKey: 'legal_status',
      cell: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
          {formatLegalStatus(row.legal_status)}
        </span>
      ),
    },
    {
      header: 'Criado em',
      accessorKey: 'created_at',
      cell: (row) => new Date(row.created_at).toLocaleDateString('pt-BR'),
    },
    {
      header: 'Ações',
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/processos/${row.id}/editar`)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/processos/${row.id}`)}
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Processos</h1>
            <p className="text-muted-foreground">Gerencie as ações jurídicas da sua organização</p>
          </div>
          <Button className="gap-2" onClick={() => setLocation('/processos/novo')}>
            <Plus className="w-4 h-4" />
            Novo Processo
          </Button>
        </div>

        {/* Mensagens */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Lista de Processos</CardTitle>
            <CardDescription>
              Total de {total} processo{total !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : actions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Nenhum processo encontrado</p>
                <Button variant="outline" onClick={() => setLocation('/processos/novo')} className="hover:bg-muted hover:text-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Processo
                </Button>
              </div>
            ) : (
              <>
                <DataTable columns={columns} data={actions} />

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                      <span className="ml-2">
                        (Exibindo {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, total)} de {total})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                        Anterior
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) pageNum = i + 1;
                          else if (currentPage <= 3) pageNum = i + 1;
                          else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                          else pageNum = currentPage - 2 + i;

                          return (
                            <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => goToPage(pageNum)} className="h-8 w-8 p-0">
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
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
