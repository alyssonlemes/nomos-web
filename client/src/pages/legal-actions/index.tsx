import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Eye, Plus, Edit, Trash2 } from 'lucide-react';
import { LegalActionService, LegalAction } from '@/services/legal-action.service';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';
import { formatLegalStatus, formatActionType } from '@/utils/formats';
import { SelectField } from '@/components/ui/select-field';
import { canAccess, getCurrentRole } from '@/lib/rbac';

export default function ProcessosPage() {
  const [, setLocation] = useLocation();
  const currentRole = getCurrentRole();
  const canReadLegalActions = canAccess(currentRole, 'legalActions.read');
  const canWriteLegalActions = canAccess(currentRole, 'legalActions.write');
  const shouldShowOwnDataNotice = currentRole === 'MEMBER' || currentRole === 'VIEWER';
  const [actions, setActions] = useState<LegalAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [statuses, setStatuses] = useState<LegalActionStatus[]>([]);
  const [selectedStatusCode, setSelectedStatusCode] = useState('all');

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    loadActions();
  }, [currentPage, selectedStatusCode]);

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
      setError('');
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const data = await LegalActionService.getLegalActions(
        skip,
        ITEMS_PER_PAGE,
        selectedStatusCode === 'all' ? undefined : selectedStatusCode,
      );
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
      cell: (row: any) => {
        const code =
          typeof row.action_type === 'string'
            ? row.action_type
            : row.action_type?.code;
        return formatActionType(code);
      },
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
      cell: (row) => canWriteLegalActions ? (
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
      ) : (
        <div className="text-xs text-muted-foreground">Sem ações</div>
      ),
      headerClassName: 'text-right',
      className: 'text-right',
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
    <div className="p-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Processos</h1>
            <p className="text-muted-foreground">Gerencie as ações jurídicas da sua organização</p>
          </div>
          {canWriteLegalActions && (
            <Button className="gap-2" onClick={() => setLocation('/legal-actions/novo')}>
              <Plus className="w-4 h-4" />
              Novo Processo
            </Button>
          )}
        </div>

        {shouldShowOwnDataNotice && (
          <Alert className="mb-6">
            <AlertDescription>Você vê apenas seus dados.</AlertDescription>
          </Alert>
        )}

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
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle>Lista de Processos</CardTitle>
                <CardDescription>
                  Total de {total} processo{total !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="w-full md:w-64">
                <SelectField
                  id="status_filter"
                  label="Status jurídico"
                  value={selectedStatusCode}
                  onChange={(e: { target: { value: string } }) => {
                    setSelectedStatusCode(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={[
                    { value: 'all', label: 'Todos os status' },
                    ...statuses.map((status) => ({
                      value: status.code,
                      label: status.name || status.code,
                    })),
                  ]}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : actions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">Nenhum processo encontrado</p>
                {canWriteLegalActions && (
                  <Button variant="outline" onClick={() => setLocation('/legal-actions/novo')} className="hover:bg-accent hover:text-accent-foreground">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Processo
                  </Button>
                )}
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
