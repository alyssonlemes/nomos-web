import { useCallback, useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LegalActionService,
  MonitoramentoProcesso,
  PrazoProcesso,
} from '@/services/legal-action.service';

interface ProcessoAcompanhamentoProps {
  actionId: number;
  onMovimentacao?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  PENDENTE: 'Aguardando o tribunal',
  ENCONTRADO: 'Acompanhando',
  NAO_ENCONTRADO: 'Não localizado no tribunal',
};

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

export default function ProcessoAcompanhamento({ actionId, onMovimentacao }: ProcessoAcompanhamentoProps) {
  const [dados, setDados] = useState<MonitoramentoProcesso | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
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
    if (!dados) return;
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

  const abertos = (dados?.prazos ?? []).filter((prazo) => prazo.status !== 'cumprido');

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              Acompanhamento e prazos
            </CardTitle>
            <CardDescription>
              Movimentações e publicações novas avisam os advogados vinculados. Cota do plano:{' '}
              {dados ? `${dados.em_uso} de ${dados.limite}` : '—'}.
            </CardDescription>
          </div>
          <Button type="button" variant={dados?.ativo ? 'outline' : 'default'} disabled={carregando || salvando || !dados} onClick={alternar}>
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : dados?.ativo ? 'Encerrar' : 'Acompanhar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {carregando && <p className="text-sm text-muted-foreground">Carregando acompanhamento...</p>}
        {dados?.ativo && dados.status && (
          <Badge variant="outline">{STATUS_LABEL[dados.status] ?? dados.status}</Badge>
        )}
        {!carregando && abertos.length === 0 && (
          <p className="text-sm text-muted-foreground">Nenhum prazo em aberto.</p>
        )}
        {abertos.map((prazo) => (
          <div key={prazo.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{textoPrazo(prazo)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {prazo.origem === 'PUBLICACAO' ? 'Publicação' : 'Andamento'} em {formatarData(prazo.data_movimentacao)}
                </p>
                <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">{prazo.conteudo}</p>
              </div>
              <Button type="button" variant="outline" size="sm" disabled={salvando} onClick={() => cumprir(prazo.id)}>
                Cumprido
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
