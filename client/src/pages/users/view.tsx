import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Mail, Calendar, CheckCircle2, XCircle, User, Edit2, Check, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserService, UserResponse } from '@/services/user.service';
import { Badge } from '@/components/ui/badge';
import { canAccess, getCurrentRole, getRoleLabel, ROLE_OPTIONS, UserRole } from '@/lib/rbac';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

/**
 * Página de Visualização de Usuário - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Exibe informações detalhadas do usuário
 */

export default function UsuariosViewPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const userId = params.id ? parseInt(params.id) : null;
  const currentRole = getCurrentRole();
  const canUpdateRole = canAccess(currentRole, 'users.write');

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUser();
    } else {
      setError('ID de usuário inválido');
      setIsLoading(false);
    }
  }, [userId]);

  const loadUser = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError('');
      const data = await UserService.getUserById(userId);
      setUser(data);
      setSelectedRole(data.role);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuário';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!userId || !selectedRole || !user) return;

    setIsUpdatingRole(true);
    try {
      const updatedUser = await UserService.updateUserRole(userId, { role: selectedRole as UserRole });
      setUser(updatedUser);
      setIsEditingRole(false);
      toast.success(`Perfil atualizado para ${getRoleLabel(selectedRole as UserRole)} com sucesso!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar role';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/usuarios')}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Usuários
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLoading ? 'Carregando...' : user?.full_name || 'Usuário'}
          </h1>
          <p className="text-muted-foreground">
            Informações detalhadas do funcionário
          </p>
        </div>

        {/* Mensagens de Erro */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Conteúdo */}
        {!isLoading && user && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>
                      Dados cadastrais do usuário
                    </CardDescription>
                  </div>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Inativo</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                    <p className="text-base font-medium text-foreground">{user.full_name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                    <p className="text-base text-foreground">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                    <p className="text-base text-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {user.updated_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                      <p className="text-base text-foreground">
                        {new Date(user.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card de Permissões */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Permissões</CardTitle>
                <CardDescription>
                  Níveis de acesso e privilégios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-foreground">Perfil de Acesso</span>
                  {isEditingRole ? (
                    <div className="flex items-center gap-2">
                      <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole | '')}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Selecione o perfil" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((roleOption) => (
                            <SelectItem key={roleOption.value} value={roleOption.value}>
                              {roleOption.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUpdateRole}
                        disabled={isUpdatingRole || selectedRole === user.role}
                        className="h-8 w-8 p-0"
                      >
                        {isUpdatingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingRole(false);
                          setSelectedRole(user.role);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{getRoleLabel(user.role)}</Badge>
                      {canUpdateRole && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingRole(true)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-foreground">Superusuário</span>
                  <Badge variant={user.is_superuser ? "default" : "outline"}>
                    {user.is_superuser ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-foreground">ID da Organização</span>
                  <span className="text-sm text-muted-foreground">
                    {user.organization_id || 'Não vinculado'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/usuarios')}
                className="hover:bg-muted"
              >
                Voltar
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
