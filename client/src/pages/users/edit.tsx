import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserService, UserResponse } from '@/services/user.service';
import { AccessProfileService, AccessProfile } from '@/services/access-profile.service';
import { ehAdministrador, temPermissao } from '@/lib/rbac';
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
  const canUpdateRole = temPermissao('usuarios', 'editar');

  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [profileId, setProfileId] = useState('');

  // Form errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    AccessProfileService.list()
      .then(setProfiles)
      .catch(() => setProfiles([]));
  }, []);

  useEffect(() => {
    if (userId) {
      loadUser();
    } else {
      toast.error('ID de usuário inválido');
      setIsLoading(false);
    }
  }, [userId]);

  const loadUser = async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const data = await UserService.getUserById(userId);
      setUser(data);
      setFullName(data.full_name);
      setEmail(data.email);
      setProfileId(data.profile_id ? String(data.profile_id) : '');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuário';
      toast.error(errorMessage);
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

    try {
      // Update basic user data
      const updatedUser = await UserService.updateUser(userId, {
        full_name: fullName,
        email: email,
      });

      // Update role if changed and user has permission
      if (canUpdateRole && profileId && Number(profileId) !== user.profile_id) {
        await UserService.updateUserRole(userId, { profile_id: Number(profileId) });
      }

      setUser(updatedUser);
      toast.success('Usuário atualizado com sucesso!');
      setLocation(`/usuarios/${userId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    (user && (fullName !== user.full_name || email !== user.email || (profileId && Number(profileId) !== user.profile_id))) || false;

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
                    <Select value={profileId} onValueChange={setProfileId}>
                      <SelectTrigger id="role" className="h-10 w-full">
                        <SelectValue placeholder="Selecione o perfil" />
                      </SelectTrigger>
                      <SelectContent>
                        {profiles
                          .filter((perfil) => ehAdministrador() || perfil.name !== 'Administrador')
                          .map((perfil) => (
                            <SelectItem key={perfil.id} value={String(perfil.id)}>
                              {perfil.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    {profileId && (
                      <p className="text-xs text-muted-foreground">
                        {profiles.find((item) => String(item.id) === profileId)?.description}
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
