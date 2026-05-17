import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserService, UserResponse } from '@/services/user.service';
import { canAccess, getCurrentRole, ROLE_OPTIONS, UserRole } from '@/lib/rbac';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

/**
 * Página de Edição de Usuário - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Permite editar dados e permissões do usuário
 */

export default function UsuariosEditPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const userId = params.id ? parseInt(params.id) : null;
  const currentRole = getCurrentRole();
  const canUpdateRole = canAccess(currentRole, 'users.write');

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');

  // Form errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

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
      setFullName(data.full_name);
      setEmail(data.email);
      setRole(data.role);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuário';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!fullName.trim()) {
      errors.fullName = 'Nome completo é obrigatório';
    }

    if (!email.trim()) {
      errors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'E-mail inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!userId || !user) return;

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Update basic user data
      const updatedUser = await UserService.updateUser(userId, {
        full_name: fullName,
        email: email,
      });

      // Update role if changed and user has permission
      if (canUpdateRole && role !== user.role && role) {
        await UserService.updateUserRole(userId, { role: role as UserRole });
      }

      setUser(updatedUser);
      toast.success('Usuário atualizado com sucesso!');
      setLocation(`/usuarios/${userId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    (user && (fullName !== user.full_name || email !== user.email || role !== user.role)) || false;

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation(`/usuarios/${userId}`)}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Editar Usuário
          </h1>
          <p className="text-muted-foreground">
            Atualize as informações do funcionário
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
                <CardTitle>Informações Básicas</CardTitle>
                <CardDescription>
                  Edite os dados cadastrais do usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nome Completo */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Nome Completo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (formErrors.fullName) {
                        setFormErrors({ ...formErrors, fullName: '' });
                      }
                    }}
                    placeholder="Digite o nome completo"
                    className={formErrors.fullName ? 'border-destructive' : ''}
                  />
                  {formErrors.fullName && (
                    <p className="text-sm text-destructive">{formErrors.fullName}</p>
                  )}
                </div>

                {/* E-mail */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    E-mail <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formErrors.email) {
                        setFormErrors({ ...formErrors, email: '' });
                      }
                    }}
                    placeholder="Digite o e-mail"
                    className={formErrors.email ? 'border-destructive' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">{formErrors.email}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Card de Permissões */}
            {canUpdateRole && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Permissões</CardTitle>
                  <CardDescription>
                    Defina o nível de acesso do usuário
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">
                      Perfil de Acesso <span className="text-destructive">*</span>
                    </Label>
                    <Select value={role} onValueChange={(value) => setRole(value as UserRole | '')}>
                      <SelectTrigger id="role" className="h-10 w-full">
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
                    {role && (
                      <p className="text-xs text-muted-foreground">
                        {ROLE_OPTIONS.find((item) => item.value === role)?.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Botões de Ação */}
            <div className="flex justify-between gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation(`/usuarios/${userId}`)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
                className="gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
