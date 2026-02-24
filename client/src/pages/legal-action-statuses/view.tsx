import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, FileText, Edit } from 'lucide-react';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';

export default function LegalActionStatusViewPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const statusId = params?.id ? parseInt(params.id) : null;

  const [status, setStatus] = useState<LegalActionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (statusId) {
      loadStatus();
    } else {
      setError('ID do status inválido');
      setIsLoading(false);
    }
  }, [statusId]);

  const loadStatus = async () => {
    if (!statusId) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await LegalActionStatusService.getLegalActionStatusById(statusId);
      setStatus(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar status de ação';
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
            onClick={() => setLocation('/legal-action-statuses')}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Status de Ações
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLoading ? 'Carregando...' : status?.name ?? 'Status de ação'}
          </h1>
          <p className="text-muted-foreground">
            {status && !isLoading ? (status.code ? `Código: ${status.code}` : 'Detalhes do status') : 'Detalhes do status de ação'}
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

        {!isLoading && status && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Informações do status</CardTitle>
                <CardDescription>Nome, código e descrição</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="text-base text-foreground">{status.name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Código</p>
                    <p className="text-base font-mono text-foreground">{status.code || '—'}</p>
                  </div>
                </div>
                {(status.description != null && status.description !== '') && (
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                      <p className="text-base text-foreground whitespace-pre-wrap">{status.description}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Button variant="outline" onClick={() => setLocation('/legal-action-statuses')} className="hover:bg-muted">
                Voltar
              </Button>
              <Button onClick={() => setLocation(`/legal-action-statuses/${status.id}/editar`)} className="gap-2">
                <Edit className="h-4 w-4" />
                Editar status
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
