import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Building2 } from 'lucide-react';
import { OrganizationService, Organization } from '@/services/organization.service';
import { useRequireOrganization } from '@/hooks/useRequireOrganization';

/**
 * Página de Configurações - Nomos
 * Exibe informações da organização do usuário logado
 */
export default function Configuracoes() {
  const { hasOrganization } = useRequireOrganization();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasOrganization) return;

    loadOrganization();
  }, [hasOrganization]);

  const loadOrganization = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await OrganizationService.getUserOrganization();
      setOrganization(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar organização';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="w-full flex-1 px-8">
        {/* Header */}
        <div className="mb-8 text-center max-w-2xl mx-auto pt-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as informações da sua organização</p>
        </div>

        {/* Mensagens */}
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Carregando */}
        {isLoading ? (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando informações da organização...</span>
            </CardContent>
          </Card>
        ) : organization ? (
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Informações da Organização */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Informações da Organização</CardTitle>
                    <CardDescription>Dados da sua organização registrada no Nomos</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Nome da Organização
                  </label>
                  <div className="p-3 bg-muted rounded-md text-foreground">
                    {organization.name}
                  </div>
                </div>

                {/* Documento */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    CNPJ / CPF
                  </label>
                  <div className="p-3 bg-muted rounded-md text-foreground font-mono">
                    {organization.document}
                  </div>
                </div>

                {/* Representante Legal */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Representante Legal (nome)
                  </label>
                  <div className="p-3 bg-muted rounded-md text-foreground">
                    {organization.legal_representative_name || 'Nao informado'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Representante Legal (CPF)
                  </label>
                  <div className="p-3 bg-muted rounded-md text-foreground font-mono">
                    {organization.legal_representative_document || 'Nao informado'}
                  </div>
                </div>

                {/* Data de Criação */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Data de Criação
                  </label>
                  <div className="p-3 bg-muted rounded-md text-foreground">
                    {new Date(organization.created_at).toLocaleDateString('pt-BR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {/* Última Atualização */}
                {organization.updated_at && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Última Atualização
                    </label>
                    <div className="p-3 bg-muted rounded-md text-foreground">
                      {new Date(organization.updated_at).toLocaleDateString('pt-BR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TODO: Adicionar mais seções como Membres, Plano, etc */}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Nenhuma organização encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
