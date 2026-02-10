import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Eye, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataTable, Column } from '@/components/ui/data-table';
import { UserService, UserResponse } from '@/services/user.service';
import { toast } from 'sonner';

/**
 * Pagina de Usuarios/Funcionarios - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Lista de funcionarios da organizacao
 */

export default function UsuariosListPage() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await UserService.getUsers(0, 100);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteDialog = (user: UserResponse) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setDeleteDialogOpen(false);
    setError('');

    try {
      await UserService.unlinkOrganization(userToDelete.id);
      toast.success('Usuário desvinculado da organização.');
      console.log('Usuário desvinculado da organização:', userToDelete.id);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      toast.error(errorMessage);
      setError(errorMessage);
    }
  };

  const columns: Column<UserResponse>[] = [
    {
      header: 'Nome',
      accessorKey: 'full_name',
      cell: (user: UserResponse) => (
        <div className="font-medium text-foreground">{user.full_name}</div>
      ),
    },
    {
      header: 'E-mail',
      accessorKey: 'email',
      cell: (user: UserResponse) => (
        <div className="text-muted-foreground">{user.email}</div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: (user: UserResponse) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.is_active 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {user.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      header: 'Cadastrado em',
      accessorKey: 'created_at',
      cell: (user: UserResponse) => (
        <div className="text-sm text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString('pt-BR')}
        </div>
      ),
    },
    {
      header: 'Ações',
      cell: (user: UserResponse) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/usuarios/${user.id}/editar`)}
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visualizar usuário</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDeleteDialog(user)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Excluir usuário</p>
            </TooltipContent>
          </Tooltip>
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Usuarios</h1>
            <p className="text-muted-foreground">
              Gerencie os funcionarios da sua organizacao
            </p>
          </div>
          <Button className="gap-2" onClick={() => setLocation('/usuarios/novo')}>
            <Plus className="w-4 h-4" />
            Novo Usuario
          </Button>
        </div>

        {/* Mensagens de Erro */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Conteudo */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
            <CardDescription>
              {total > 0 ? `${total} usuário${total !== 1 ? 's' : ''} cadastrado${total !== 1 ? 's' : ''}` : 'Nenhum usuário cadastrado'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  Nenhum usuário encontrado
                </p>
                <Button onClick={() => setLocation('/usuarios/novo')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Convidar Primeiro Usuário
                </Button>
              </div>
            ) : (
              <DataTable
                data={users}
                columns={columns}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{userToDelete?.full_name}</strong> da organização?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
