import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, Edit2 } from 'lucide-react';
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
import { DataListing, Column, LISTING_PAGE_SIZE, SortDirection } from '@/components/listing/DataListing';
import { UserService, UserResponse } from '@/services/user.service';
import { toast } from 'sonner';
import { canAccess, getCurrentRole, getRoleLabel, ROLE_OPTIONS } from '@/lib/rbac';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

/**
 * Pagina de Usuarios/Funcionarios - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Lista de funcionarios da organizacao
 */

export default function UsuariosListPage() {
  const [, setLocation] = useLocation();
  const currentRole = getCurrentRole();
  const canManageInvites = canAccess(currentRole, 'invitations.manage');
  const canEditUsers = canAccess(currentRole, 'users.write');
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserResponse | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  const totalPages = Math.ceil(total / LISTING_PAGE_SIZE);

  useEffect(() => {
    loadUsers();
  }, [currentPage, debouncedSearch, statusFilter, roleFilter, sortBy, sortDir]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const skip = (currentPage - 1) * LISTING_PAGE_SIZE;
      const data = await UserService.getUsers(skip, LISTING_PAGE_SIZE, {
        search: debouncedSearch || undefined,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        role: roleFilter === 'all' ? undefined : roleFilter,
        sortBy,
        sortDir,
      });
      const maxPage = Math.max(1, Math.ceil((data.total ?? 0) / LISTING_PAGE_SIZE));
      if (currentPage > maxPage) {
        setCurrentPage(maxPage);
        return;
      }
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuários';
      toast.error(errorMessage);
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

    try {
      await UserService.unlinkOrganization(userToDelete.id);
      toast.success('Usuário desvinculado da organização.');
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir usuário';
      toast.error(errorMessage);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRoleChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleSortChange = (key: string, direction: SortDirection) => {
    setSortBy(key);
    setSortDir(direction);
    setCurrentPage(1);
  };

  const columns: Column<UserResponse>[] = [
    {
      id: 'user',
      header: 'Usuário',
      accessorKey: 'full_name',
      sortField: 'full_name',
      exportValue: (user) => `${user.full_name} (${user.email})`,
      cell: (user) => (
        <div>
          <div className="font-medium text-foreground">{user.full_name}</div>
          <div className="text-xs text-muted-foreground">{user.email}</div>
        </div>
      ),
    },
    {
      id: 'role',
      header: 'Perfil',
      sortField: 'role',
      sortValue: (user) => (user.role ? getRoleLabel(user.role) : ''),
      exportValue: (user) => (user.role ? getRoleLabel(user.role) : '-'),
      cell: (user) => (
        <span className="text-foreground">{user.role ? getRoleLabel(user.role) : '-'}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'is_active',
      sortField: 'is_active',
      sortValue: (user) => (user.is_active ? 1 : 0),
      exportValue: (user) => (user.is_active ? 'Ativo' : 'Inativo'),
      cell: (user) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.is_active
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {user.is_active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
    {
      id: 'created_at',
      header: 'Cadastrado em',
      accessorKey: 'created_at',
      exportValue: (user) => new Date(user.created_at).toLocaleDateString('pt-BR'),
      cell: (user) => (
        <div className="text-sm text-muted-foreground">
          {new Date(user.created_at).toLocaleDateString('pt-BR')}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      sortable: false,
      hideable: false,
      cell: (user) => (
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/usuarios/${user.id}`)}
                className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visualizar usuário</p>
            </TooltipContent>
          </Tooltip>
          {canEditUsers && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation(`/usuarios/${user.id}/edit`)}
                  className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Editar usuário</p>
              </TooltipContent>
            </Tooltip>
          )}
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
    <>
      <DataListing
        storageKey="usuarios"
        title="Usuários"
        description="Gerencie os funcionários da sua organização"
        badge={
          <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            {total} usuário{total !== 1 ? 's' : ''}
          </span>
        }
        searchPlaceholder="Buscar por nome ou e-mail..."
        searchValue={search}
        onSearchChange={handleSearchChange}
        filters={[
          {
            id: 'role',
            value: roleFilter,
            placeholder: 'Todo perfil',
            onChange: handleRoleChange,
            options: [
              { value: 'all', label: 'Todo perfil' },
              ...ROLE_OPTIONS.map((role) => ({ value: role.value, label: role.label })),
            ],
          },
          {
            id: 'status',
            value: statusFilter,
            placeholder: 'Todo status',
            onChange: handleStatusChange,
            options: [
              { value: 'all', label: 'Todo status' },
              { value: 'active', label: 'Ativo' },
              { value: 'inactive', label: 'Inativo' },
            ],
          },
        ]}
        primaryAction={
          canManageInvites
            ? { label: 'Novo usuário', onClick: () => setLocation('/usuarios/novo') }
            : undefined
        }
        columns={columns}
        data={users}
        isLoading={isLoading}
        sortKey={sortBy}
        sortDirection={sortDir}
        onSortChange={handleSortChange}
        emptyTitle="Nenhum usuário encontrado"
        emptyDescription={search || statusFilter !== 'all' || roleFilter !== 'all' ? 'Tente outro termo ou filtro.' : 'Convide o primeiro usuário da organização.'}
        emptyAction={
          canManageInvites && !search && statusFilter === 'all' && roleFilter === 'all' ? (
            <Button onClick={() => setLocation('/usuarios/novo')}>
              <Plus className="w-4 h-4 mr-2" />
              Convidar Primeiro Usuário
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
        exportFilename="usuarios"
      />

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
    </>
  );
}
