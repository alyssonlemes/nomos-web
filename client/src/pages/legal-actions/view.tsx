import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Loader2,
  FileText,
  Scale,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  XCircle,
  Edit,
} from 'lucide-react';
import { LegalActionService, LegalAction } from '@/services/legal-action.service';
import { ClientService } from '@/services/client.service';
import { Badge } from '@/components/ui/badge';
import { formatLegalStatus, formatActionType } from '@/utils/formats';

function getActionTypeLabel(action: LegalAction): string {
  if (action.action_type?.name) return action.action_type.name;
  if (action.action_type?.code) return formatActionType(action.action_type.code);
  return '—';
}

/**
 * Página de Visualização de Processo - Nomos
 * Exibe informações detalhadas da ação jurídica
 */

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export default function ProcessoViewPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const actionId = params?.id ? parseInt(params.id) : null;

  const [action, setAction] = useState<LegalAction | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (actionId) {
      loadAction();
    } else {
      setError('ID do processo inválido');
      setIsLoading(false);
    }
  }, [actionId]);

  const loadAction = async () => {
    if (!actionId) return;

    try {
      setIsLoading(true);
      setError('');
      const data = await LegalActionService.getLegalActionById(actionId);
      setAction(data);

      if (data.client_id) {
        try {
          const client = await ClientService.getClientById(data.client_id);
          setClientName(client.name);
        } catch {
          setClientName(data.client_name ?? `Cliente #${data.client_id}`);
        }
      } else {
        setClientName(data.client_name ?? null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar processo';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/legal-actions')}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Processos
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLoading ? 'Carregando...' : action?.number || action?.title || 'Processo'}
          </h1>
          <p className="text-muted-foreground">
            {action?.title && !isLoading ? action.title : 'Detalhes da ação jurídica'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && action && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Informações básicas</CardTitle>
                    <CardDescription>Número, título e descrição</CardDescription>
                  </div>
                  <Badge variant={action.is_active ? 'default' : 'secondary'}>
                    {action.is_active ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Inativo</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Número</p>
                    <p className="text-base font-mono text-foreground">{action.number || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Título</p>
                    <p className="text-base text-foreground">{action.title || '—'}</p>
                  </div>
                </div>
                {action.description != null && action.description !== '' && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                      <p className="text-base text-foreground whitespace-pre-wrap">{action.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Dados processuais</CardTitle>
                <CardDescription>Tipo, status e tribunal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Scale className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo da ação</p>
                    <p className="text-base text-foreground">{getActionTypeLabel(action)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="outline" className="font-normal">
                      {formatLegalStatus(action.legal_status)}
                    </Badge>
                  </div>
                </div>
                {action.court_name && (
                  <div className="flex items-start gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tribunal</p>
                      <p className="text-base text-foreground">{action.court_name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de abertura</p>
                    <p className="text-base text-foreground">{formatDate(action.filing_date)}</p>
                  </div>
                </div>
                {action.closing_date && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de encerramento</p>
                      <p className="text-base text-foreground">{formatDate(action.closing_date)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
                <CardDescription>Parte vinculada ao processo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                    <p className="text-base text-foreground">{clientName ?? '—'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Button variant="outline" onClick={() => setLocation('/legal-actions')} className="hover:bg-muted">
                Voltar
              </Button>
              <Button onClick={() => setLocation(`/legal-actions/${action.id}/editar`)} className="gap-2">
                <Edit className="h-4 w-4" />
                Editar processo
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
