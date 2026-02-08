import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable, Column } from '@/components/ui/data-table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Pencil, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { ClientService, Client } from '@/services/client.service';

/**
 * Página de Clientes - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Lista de clientes da organização com paginação
 */

export default function ClientesPage() {
  const [, setLocation] = useLocation();
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    loadClients();
  }, [currentPage]);

  const loadClients = async () => {
    try {
      setIsLoading(true);
      setError('');
      const skip = (currentPage - 1) * ITEMS_PER_PAGE;
      const data = await ClientService.getClients(skip, ITEMS_PER_PAGE);
      setClients(data.clients);
      setTotal(data.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      setError('');
      setSuccess('');
      await ClientService.deleteClient(id);
      setSuccess('Cliente excluído com sucesso!');
      loadClients();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir cliente';
      setError(errorMessage);
    }
  };

  const handleEdit = (id: number) => {
    setLocation(`/clientes/${id}/editar`);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const columns: Column<Client>[] = [
    {
      header: 'Nome',
      accessorKey: 'name',
      className: 'font-medium text-foreground',
    },
    {
      header: 'Email',
      accessorKey: 'email',
    },
    {
      header: 'Telefone',
      cell: (client) => client.phone || '-',
    },
    {
      header: 'Documento',
      cell: (client) => client.document || '-',
      className: 'font-mono',
    },
    {
      header: 'Cadastro',
      cell: (client) => new Date(client.created_at).toLocaleDateString('pt-BR'),
    },
    {
      header: 'Ações',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (client) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(client.id);
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
            onConfirm={() => handleDelete(client.id, client.name)}
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
    <div className="p-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Clientes</h1>
            <p className="text-muted-foreground">
              Gerencie os clientes da sua organização
            </p>
          </div>
          <Button className="gap-2" onClick={() => setLocation('/clientes/novo')}>
            <Plus className="w-4 h-4" />
            Novo Cliente
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

        {/* Tabela de Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Clientes</CardTitle>
            <CardDescription>
              Total de {total} cliente{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhum cliente cadastrado ainda
                </p>
                <Button variant="outline" onClick={() => setLocation('/clientes/novo')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Cliente
                </Button>
              </div>
            ) : (
              <>
                <DataTable columns={columns} data={clients} />

                {/* Paginação */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                      <span className="ml-2">
                        (Exibindo {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, total)} de {total})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Anterior
                      </Button>
                      
                      {/* Números das páginas */}
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
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
                        <ChevronRight className="h-4 w-4 ml-1" />
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
