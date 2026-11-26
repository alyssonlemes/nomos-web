import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import {
  BotaoAcompanhar,
  ListaPrazos,
  SeloAcompanhamento,
  useAcompanhamento,
} from '@/components/ProcessoAcompanhamento';
import { LegalAction, LegalActionService } from '@/services/legal-action.service';
import { LegalActionStatusService, type LegalActionStatus } from '@/services/catalogo-processo';
import { ClientService } from '@/services/client.service';
import { formatActionType, formatLegalStatus } from '@/utils/formats';
import { AndamentosProcesso } from './ficha/andamentos-processo';
import { DadosProcesso } from './ficha/dados-processo';
import { PublicacoesProcesso } from './ficha/publicacoes-processo';
import { AbasProcesso, AbaProcesso, ListaAbasProcesso, NavegacaoAbas } from './ficha/abas-processo';

function rotuloTipo(action: LegalAction): string {
  if (action.action_type?.name) return action.action_type.name;
  if (action.action_type?.code) return formatActionType(action.action_type.code);
  return '—';
}

export default function ProcessoViewPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const actionId = params?.id ? parseInt(params.id, 10) : null;
  const idValido = actionId !== null && !Number.isNaN(actionId) ? actionId : null;

  const [action, setAction] = useState<LegalAction | null>(null);
  const [clientName, setClientName] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<LegalActionStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendentesPublicacao, setPendentesPublicacao] = useState<number | null>(null);
  const [aba, setAba] = useState<AbaProcesso>('dados');

  const loadAction = useCallback(async (silencioso = false) => {
    if (!idValido) return;
    try {
      if (!silencioso) setIsLoading(true);
      const data = await LegalActionService.getLegalActionById(idValido);
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
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar processo');
    } finally {
      if (!silencioso) setIsLoading(false);
    }
  }, [idValido]);

  const recarregarAposPrazo = useCallback(() => {
    loadAction(true);
  }, [loadAction]);

  const acompanhamento = useAcompanhamento(idValido, recarregarAposPrazo);
  const registrarPendentes = useCallback((quantidade: number) => {
    setPendentesPublicacao(quantidade);
  }, []);

  useEffect(() => {
    if (!idValido) {
      toast.error('ID do processo inválido');
      setIsLoading(false);
      return;
    }
    loadAction();
  }, [idValido, loadAction]);

  useEffect(() => {
    if (!idValido) return;
    let ativo = true;
    LegalActionService.getPublicacoes('pendente', 0, 1, undefined, idValido)
      .then((dados) => {
        if (ativo) setPendentesPublicacao(dados.pendentes);
      })
      .catch(() => {
        if (ativo) setPendentesPublicacao(null);
      });
    return () => {
      ativo = false;
    };
  }, [idValido]);

  useEffect(() => {
    LegalActionStatusService.getLegalActionStatuses(0, 500)
      .then(({ statuses: lista }) => setStatuses(lista))
      .catch(() => setStatuses([]));
  }, []);

  const statusLabel = (code: string | null | undefined) => {
    if (!code) return '—';
    const match = statuses.find((item) => item.code === code);
    if (match?.name) return match.name;
    return formatLegalStatus(code);
  };

  const prazosAbertos = acompanhamento.dados?.prazos.filter((prazo) => prazo.status !== 'cumprido').length ?? 0;
  const andamentos = action?.movimentos?.length ?? 0;

  return (
    <div className="min-h-full p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <Button
          variant="ghost"
          onClick={() => setLocation('/legal-actions')}
          className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Processos
        </Button>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold text-foreground">
              {isLoading ? 'Carregando...' : action?.number || action?.title || 'Processo'}
            </h1>
            <p className="text-muted-foreground">
              {action?.title && !isLoading ? action.title : 'Detalhes da ação jurídica'}
            </p>
            {action && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <SeloAcompanhamento dados={acompanhamento.dados} />
                <span className="text-sm text-muted-foreground">
                  Cota do plano: {acompanhamento.dados ? `${acompanhamento.dados.em_uso} de ${acompanhamento.dados.limite}` : '—'}
                </span>
              </div>
            )}
          </div>
          {action && (
            <BotaoAcompanhar
              dados={acompanhamento.dados}
              carregando={acompanhamento.carregando}
              salvando={acompanhamento.salvando}
              onAlternar={acompanhamento.alternar}
            />
          )}
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && action && (
          <>
          <AbasProcesso aba={aba} onChange={setAba}>
            <ListaAbasProcesso
              complementos={{
                andamentos: ` (${andamentos})`,
                prazos: ` (${prazosAbertos})`,
                publicacoes: pendentesPublicacao === null ? '' : ` (${pendentesPublicacao})`,
              }}
            />

            <TabsContent value="dados">
              <DadosProcesso
                action={action}
                clientName={clientName}
                statusLabel={statusLabel(action.legal_status)}
                tipoLabel={rotuloTipo(action)}
              />
            </TabsContent>
            <TabsContent value="andamentos">
              <AndamentosProcesso action={action} />
            </TabsContent>
            <TabsContent value="prazos">
              <ListaPrazos
                dados={acompanhamento.dados}
                carregando={acompanhamento.carregando}
                salvando={acompanhamento.salvando}
                onCumprir={acompanhamento.cumprir}
              />
            </TabsContent>
            <TabsContent value="publicacoes">
              <PublicacoesProcesso actionId={action.id} onPendentes={registrarPendentes} />
            </TabsContent>
          </AbasProcesso>
          <NavegacaoAbas
            aba={aba}
            onChange={setAba}
            acaoFinal={
              <Button type="button" className="gap-2" onClick={() => setLocation(`/legal-actions/${action.id}/editar`)}>
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            }
          />
          </>
        )}
      </div>
    </div>
  );
}
