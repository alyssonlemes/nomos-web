import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Mail, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { AuthService } from '@/services/auth.service';
import { OrganizationService } from '@/services/organization.service';
import { InvitationService, Invitation } from '@/services/invitation.service';

/**
 * Página de Onboarding de Organização - Nomos
 * Exibida quando usuário não possui organização
 * Opções: Aceitar convite ou Criar nova organização
 */
export default function OnboardingOrganization() {
  const [activeTab, setActiveTab] = useState('invites');
  const [organizationName, setOrganizationName] = useState('');
  const [organizationDocument, setOrganizationDocument] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInvites, setIsLoadingInvites] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [inviteToReject, setInviteToReject] = useState<number | null>(null);

  // Carregar convites ao montar o componente
  useEffect(() => {
    loadInvites();
  }, []);

  const loadInvites = async () => {
    try {
      setIsLoadingInvites(true);
      const data = await InvitationService.getMyInvitations();
      setInvites(data);
    } catch (err) {
      console.error('Erro ao carregar convites:', err);
      // Não exibir erro aqui, apenas deixar a lista vazia
      setInvites([]);
    } finally {
      setIsLoadingInvites(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      if (!organizationName.trim()) {
        throw new Error('Nome da organização é obrigatório');
      }
      if (!organizationDocument.trim()) {
        throw new Error('CNPJ/CPF é obrigatório');
      }

      await OrganizationService.createOrganization({
        name: organizationName,
        document: organizationDocument,
      });

      setSuccess('Organização criada com sucesso!');
      // Redirecionar para home após criação
      setTimeout(() => {
        window.location.href = '/home';
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar organização';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvite = async (inviteId: number) => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await InvitationService.acceptInvite(inviteId);
      setSuccess('Convite aceito com sucesso!');
      // Redirecionar para home após aceitar
      setTimeout(() => {
        window.location.href = '/home';
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao aceitar convite';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleRejectInvite = async () => {
    if (inviteToReject === null) return;

    setError('');
    setSuccess('');
    setIsLoading(true);
    setRejectDialogOpen(false);

    try {
      await InvitationService.rejectInvite(inviteToReject);
      setSuccess('Convite rejeitado');
      setInviteToReject(null);
      // Recarregar convites
      loadInvites();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao rejeitar convite';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const openRejectDialog = (inviteId: number) => {
    setInviteToReject(inviteId);
    setRejectDialogOpen(true);
  };

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="/black_logo.png" 
            alt="Nomos" 
            className="h-32 mx-auto dark:hidden"
          />
          <img 
            src="/white_logo.png" 
            alt="Nomos" 
            className="h-32 mx-auto hidden dark:block"
          />
          <h1 className="text-4xl font-bold text-foreground mb-2">Bem-vindo ao Nomos</h1>
          <p className="text-muted-foreground">
            Para continuar, você precisa estar vinculado a uma organização
          </p>
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

        {/* Conteúdo Principal */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="invites" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Convites {invites.length > 0 && `(${invites.length})`}
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Organização
            </TabsTrigger>
          </TabsList>

          {/* Tab de Convites */}
          <TabsContent value="invites" className="space-y-4">
            {isLoadingInvites ? (
              <Card className="min-h-[360px] flex items-center justify-center">
                <CardContent className="pt-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">Carregando convites...</p>
                </CardContent>
              </Card>
            ) : invites.length === 0 ? (
              <Card className="min-h-[360px] flex items-center justify-center">
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground mb-4">
                    Você não possui convites de organização no momento
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Crie uma nova organização ou peça para ser convidado
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {invites.map((invite) => (
                  <Card key={invite.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-foreground">
                            {invite.organization_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Convidado por {invite.invited_by_email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => openRejectDialog(invite.id)}
                            disabled={isLoading}
                            className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                          >
                            Rejeitar
                          </Button>
                          <Button
                            onClick={() => handleAcceptInvite(invite.id)}
                            disabled={isLoading}
                          >
                            Aceitar {isLoading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab de Criar Organização */}
          <TabsContent value="create">
            <Card className="min-h-[360px]">
              <CardHeader>
                <CardTitle>Criar Nova Organização</CardTitle>
                <CardDescription>
                  Preencha as informações para criar sua organização
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOrganization} className="space-y-6">
                  {/* Nome da Organização */}
                  <div className="space-y-2">
                    <label
                      htmlFor="org-name"
                      className="block text-sm font-medium text-foreground"
                    >
                      Nome da Organização
                    </label>
                    <Input
                      id="org-name"
                      placeholder="Ex: Acme Jurídica"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {/* CNPJ/CPF */}
                  <div className="space-y-2">
                    <label
                      htmlFor="org-doc"
                      className="block text-sm font-medium text-foreground"
                    >
                      CNPJ / CPF
                    </label>
                    <Input
                      id="org-doc"
                      placeholder="00.000.000/0000-00"
                      value={organizationDocument}
                      onChange={(e) => setOrganizationDocument(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        'Criar Organização'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer - Logout */}
        <div className="text-center border-t pt-6">
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Desconectar
          </Button>
        </div>
      </div>

      {/* Dialog de Confirmação */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar Convite</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar este convite? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectInvite}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeitar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
