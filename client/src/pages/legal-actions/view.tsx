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
  Users,
  History as HistoryIcon,
  Tag,
} from 'lucide-react';
import { LegalActionService, LegalAction, DataJudAssunto } from '@/services/legal-action.service';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';
import { ClientService } from '@/services/client.service';
import { Badge } from '@/components/ui/badge';
import { formatLegalStatus, formatActionType } from '@/utils/formats';
import { toast } from 'sonner';

function getActionTypeLabel(action: LegalAction): string {
  if (action.action_type?.name) return action.action_type.name;
  if (action.action_type?.code) return formatActionType(action.action_type.code);
  return '—';
}

function parseAssuntos(assuntosJson?: string | null): DataJudAssunto[] {
  if (!assuntosJson) return [];
  try {
    const parsed = JSON.parse(assuntosJson);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === 'string') return { nome: item };
        return { codigo: item.codigo, nome: item.nome };
      });
    }
    if (typeof parsed === 'object' && parsed !== null) return [parsed];
  } catch {
    return [{ nome: assuntosJson }];
  }
  return [];
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
  const [statuses, setStatuses] = useState<LegalActionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (actionId) {
      loadAction();
    } else {
      toast.error('ID do processo inválido');
      setIsLoading(false);
    }
  }, [actionId]);

  useEffect(() => {
    LegalActionStatusService.getLegalActionStatuses(0, 500)
      .then(({ statuses }) => setStatuses(statuses))
      .catch(() => setStatuses([]));
  }, []);

  const getStatusLabel = (code: string | null | undefined) => {
    if (!code) return '—';
    const match = statuses.find((s) => s.code === code);
    if (match?.name) return match.name;
    return formatLegalStatus(code);
  };

  const loadAction = async () => {
    if (!actionId) return;

    try {
      setIsLoading(true);
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
      toast.error(errorMessage);
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
                <CardDescription>Tipo, status, tribunal e detalhes do DataJud</CardDescription>
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
                      {getStatusLabel(action.legal_status)}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tribunal / Fórum</p>
                    <p className="text-base text-foreground">{action.court_name || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Órgão Julgador</p>
                    <p className="text-base text-foreground">{action.orgao_julgador || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Comarca / Vara</p>
                    <p className="text-base text-foreground">
                      {[action.comarca, action.vara].filter(Boolean).join(' — ') || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Scale className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Valor da causa</p>
                    <p className="text-base font-semibold text-foreground">
                      {action.valor_causa != null
                        ? Number(action.valor_causa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Magistrado</p>
                    <p className="text-base text-foreground">{action.magistrado || '—'}</p>
                  </div>
                </div>
                {action.segredo_justica && (
                  <div className="flex items-start gap-3">
                    <Badge variant="destructive">Segredo de Justiça</Badge>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de abertura / ajuizamento</p>
                    <p className="text-base text-foreground">{formatDate(action.filing_date)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de encerramento</p>
                    <p className="text-base text-foreground">{formatDate(action.closing_date)}</p>
                  </div>
                </div>
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

            {/* ── Assuntos TPU ────────────────────────────────────────── */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  Assuntos do Processo (TPU)
                </CardTitle>
                <CardDescription>Matérias do direito classificadas pelo CNJ</CardDescription>
              </CardHeader>
              <CardContent>
                {parseAssuntos(action.assuntos_json).length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {parseAssuntos(action.assuntos_json).map((ass, i) => (
                      <Badge key={i} variant="secondary" className="text-xs font-normal">
                        {ass.codigo ? `[${ass.codigo}] ` : ''}{ass.nome || 'Assunto'}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">— NENHUM ASSUNTO REGISTRADO —</p>
                )}
              </CardContent>
            </Card>

            {/* ── Partes do Processo ───────────────────────────────────── */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  Partes do Processo ({action.partes?.length ?? 0})
                </CardTitle>
                <CardDescription>Polos ativos, passivos e representantes</CardDescription>
              </CardHeader>
              <CardContent>
                {action.partes && action.partes.length > 0 ? (
                  <div className="space-y-3">
                    {action.partes.map((parte) => (
                      <div key={parte.id} className="flex items-start justify-between p-3 rounded-lg border bg-card">
                        <div>
                          <p className="font-medium text-sm text-foreground">{parte.nome}</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {parte.polo && <Badge variant="outline" className="text-xs uppercase">{parte.polo}</Badge>}
                            {parte.tipo_participacao && <Badge variant="secondary" className="text-xs capitalize">{parte.tipo_participacao}</Badge>}
                            {parte.documento && <span className="text-xs font-mono text-muted-foreground">CPF/CNPJ: {parte.documento}</span>}
                            {parte.oab && <span className="text-xs text-muted-foreground">OAB: {parte.oab}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2 text-center border border-dashed rounded-md bg-muted/20">
                    — NENHUMA PARTE REGISTRADA —
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ── Histórico de Movimentações ────────────────────────────── */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HistoryIcon className="h-5 w-5 text-muted-foreground" />
                  Histórico de Movimentações ({action.movimentos?.length ?? 0})
                </CardTitle>
                <CardDescription>Andamento do processo extraído do DataJud</CardDescription>
              </CardHeader>
              <CardContent>
                {action.movimentos && action.movimentos.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {action.movimentos.map((mov) => (
                      <div key={mov.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                        <HistoryIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{mov.nome}</p>
                            <span className="text-xs font-mono text-muted-foreground shrink-0">
                              {mov.data_hora ? new Date(mov.data_hora).toLocaleString('pt-BR') : '—'}
                            </span>
                          </div>
                          {mov.codigo && (
                            <span className="text-xs text-muted-foreground">Código TPU: {mov.codigo}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground py-2 text-center border border-dashed rounded-md bg-muted/20">
                    — NENHUMA MOVIMENTAÇÃO REGISTRADA —
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-end gap-4">
              <Button variant="outline" onClick={() => setLocation('/legal-actions')} className="hover:bg-accent hover:text-accent-foreground">
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
