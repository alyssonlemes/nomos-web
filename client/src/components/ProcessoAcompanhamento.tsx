import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LegalActionService,
  MonitoramentoProcesso,
  PrazoProcesso,
} from '@/services/legal-action.service';

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Aguardando o tribunal',
  ENCONTRADO: 'Acompanhando',
  NAO_ENCONTRADO: 'Não localizado no tribunal',
};

type GrupoPrazo = 'aberto' | 'cumprido';

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const [ano, mes, dia] = valor.slice(0, 10).split('-');
  if (!ano || !mes || !dia) return valor;
  return `${dia}/${mes}/${ano}`;
}

function textoPrazo(prazo: PrazoProcesso): string {
  if (prazo.status === 'cumprido') return 'Cumprido';
  if (prazo.status === 'aberto' && prazo.data_vencimento) {
    return `Vencimento estimado em ${formatarData(prazo.data_vencimento)}`;
  }
  return 'O texto não traz a quantidade de dias. Confira o prazo na íntegra.';
}

export function useAcompanhamento(actionId: number | null, onMovimentacao?: () => void) {
  const [dados, setDados] = useState<MonitoramentoProcesso | null>(null);
  const [carregando, setCarregando] = useState(Boolean(actionId));
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!actionId) return;
    try {
      setCarregando(true);
      setDados(await LegalActionService.getMonitoramento(actionId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao consultar o acompanhamento');
    } finally {
      setCarregando(false);
    }
  }, [actionId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const alternar = async () => {
    if (!actionId || !dados) return;
    setSalvando(true);
    try {
      const atualizado = dados.ativo
        ? await LegalActionService.encerrarMonitoramento(actionId)
        : await LegalActionService.ativarMonitoramento(actionId);
      setDados(atualizado);
      toast.success(atualizado.ativo ? 'Acompanhamento ligado.' : 'Acompanhamento encerrado.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar o acompanhamento');
    } finally {
      setSalvando(false);
    }
  };

  const cumprir = async (prazoId: number) => {
    if (!actionId) return;
    setSalvando(true);
    try {
      await LegalActionService.cumprirPrazo(actionId, prazoId);
      await carregar();
      onMovimentacao?.();
      toast.success('Prazo marcado como cumprido.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao marcar o prazo');
    } finally {
      setSalvando(false);
    }
  };

  return { dados, carregando, salvando, alternar, cumprir };
}

interface BotaoAcompanharProps {
  dados: MonitoramentoProcesso | null;
  carregando: boolean;
  salvando: boolean;
  onAlternar: () => void;
}

export function BotaoAcompanhar({ dados, carregando, salvando, onAlternar }: BotaoAcompanharProps) {
  return (
    <Button
      type="button"
      variant={dados?.ativo ? 'outline' : 'default'}
      disabled={carregando || salvando || !dados}
      onClick={onAlternar}
    >
      {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : dados?.ativo ? 'Encerrar' : 'Acompanhar'}
    </Button>
  );
}

export function seloAcompanhamento(dados: MonitoramentoProcesso | null): string | null {
  if (!dados?.ativo || !dados.status) return null;
  return STATUS_LABEL[dados.status] ?? dados.status;
}

interface ListaPrazosProps {
  dados: MonitoramentoProcesso | null;
  carregando: boolean;
  salvando: boolean;
  onCumprir: (prazoId: number) => void;
}

export function ListaPrazos({ dados, carregando, salvando, onCumprir }: ListaPrazosProps) {
  const [grupo, setGrupo] = useState<GrupoPrazo>('aberto');
  const prazos = dados?.prazos ?? [];
  const abertos = prazos.filter((prazo) => prazo.status !== 'cumprido');
  const cumpridos = prazos.filter((prazo) => prazo.status === 'cumprido');
  const visiveis = grupo === 'aberto' ? abertos : cumpridos;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Cota do plano: {dados ? `${dados.em_uso} de ${dados.limite}` : '—'}.
        </p>
        <div className="flex gap-2" role="group" aria-label="Situação dos prazos">
          <Button
            type="button"
            size="sm"
            variant={grupo === 'aberto' ? 'default' : 'outline'}
            onClick={() => setGrupo('aberto')}
          >
            Abertos ({abertos.length})
          </Button>
          <Button
            type="button"
            size="sm"
            variant={grupo === 'cumprido' ? 'default' : 'outline'}
            onClick={() => setGrupo('cumprido')}
          >
            Cumpridos ({cumpridos.length})
          </Button>
        </div>
      </div>

      {carregando && <p className="text-sm text-muted-foreground">Carregando prazos...</p>}

      {!carregando && visiveis.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {grupo === 'aberto' ? 'Nenhum prazo em aberto.' : 'Nenhum prazo cumprido.'}
        </p>
      )}

      <ul className="space-y-3">
        {visiveis.map((prazo) => (
          <li key={prazo.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{textoPrazo(prazo)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {prazo.origem === 'PUBLICACAO' ? 'Publicação' : 'Andamento'} em {formatarData(prazo.data_movimentacao)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{prazo.conteudo}</p>
              </div>
              {grupo === 'aberto' && (
                <Button type="button" variant="outline" size="sm" disabled={salvando} onClick={() => onCumprir(prazo.id)}>
                  Cumprido
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SeloAcompanhamento({ dados }: { dados: MonitoramentoProcesso | null }) {
  const texto = seloAcompanhamento(dados);
  if (!texto) return null;
  return <Badge variant="outline">{texto}</Badge>;
}
