import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { InvitationService } from '@/services/invitation.service';
import { canAccess, getCurrentRole } from '@/lib/rbac';

/**
 * Pagina de Convidar Usuarios - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Envio de convite por email
 */

export default function UsuariosNewPage() {
  const [, setLocation] = useLocation();
  const currentRole = getCurrentRole();
  const canManageInvites = canAccess(currentRole, 'invitations.manage');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'member' | 'viewer' | 'assistant'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Email e obrigatorio');
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error('Email invalido');
      return;
    }

    try {
      setIsLoading(true);
      await InvitationService.inviteUser({ email: trimmedEmail, role });
      setSuccess('Convite enviado com sucesso');
      setEmail('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao enviar convite';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!canManageInvites) {
    return (
      <div className="p-8 min-h-full">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Apenas administradores e proprietários podem convidar usuários.</AlertDescription>
          </Alert>
          <Button onClick={() => setLocation('/home')}>Voltar para Home</Button>
        </div>
      </div>
    );
  }

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
            Voltar para Usuarios
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Convidar Usuario</h1>
          <p className="text-muted-foreground">
            Envie um convite por email para um novo usuario
          </p>
        </div>

        {/* Mensagens */}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Conteudo */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Email do Usuario</CardTitle>
              <CardDescription>
                O usuario recebera um email com o convite
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />

                <div className="space-y-2 mt-4">
                  <label htmlFor="role" className="block text-sm font-medium text-foreground">
                    Papel
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as 'admin' | 'member' | 'viewer' | 'assistant')
                    }
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="admin">Administrador</option>
                    <option value="member">Membro</option>
                    <option value="viewer">Visualizador</option>
                    <option value="assistant">Assistente</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botoes de Acao */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/usuarios')}
              className="hover:bg-accent hover:text-accent-foreground"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Convite'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
