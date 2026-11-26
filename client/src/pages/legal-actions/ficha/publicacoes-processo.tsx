import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { temPermissao } from '@/lib/rbac';
import { LegalActionService, PublicacaoIntegracao } from '@/services/legal-action.service';
import {
  formatarDataPublicacao,
  LeituraPublicacao,
  SeloSituacaoPublicacao,
  textoPrazoPublicacao,
} from '../publicacao-leitura';

type Situacao = 'pendente' | 'tratada' | 'todas';

const FILTROS: { value: Situacao; label: string }[] = [
  { value: 'pendente', label: 'A tratar' },
  { value: 'tratada', label: 'Tratadas' },
  { value: 'todas', label: 'Todas' },
];

const TAMANHO_PAGINA = 20;

interface PublicacoesProcessoProps {
  actionId: number;
  onPendentes?: (quantidade: number) => void;
}

export function PublicacoesProcesso({ actionId, onPendentes }: PublicacoesProcessoProps) {
  const podeTratar = temPermissao('processos', 'editar');
  const [situacao, setSituacao] = useState<Situacao>('pendente');
  const [pagina, setPagina] = useState(1);
  const [itens, setItens] = useState<PublicacaoIntegracao[]>([]);
  const [total, setTotal] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [tratandoId, setTratandoId] = useState<number | null>(null);
  const [leitura, setLeitura] = useState<PublicacaoIntegracao | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      const dados = await LegalActionService.getPublicacoes(
        situacao,
        (pagina - 1) * TAMANHO_PAGINA,
        TAMANHO_PAGINA,
        undefined,
        actionId,
      );
      const maxPage = Math.max(1, Math.ceil(dados.total / TAMANHO_PAGINA));
      if (pagina > maxPage) {
        setPagina(maxPage);
        return;
      }
      setItens(dados.publicacoes);
      setTotal(dados.total);
      setPendentes(dados.pendentes);
      onPendentes?.(dados.pendentes);
    } catch (err) {
      setItens([]);
      setTotal(0);
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar publicações');
    } finally {
      setCarregando(false);
    }
  }, [actionId, onPendentes, pagina, situacao]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const tratar = async (id: number) => {
    setTratandoId(id);
    try {
      const atualizado = await LegalActionService.tratarPublicacao(id);
      toast.success('Publicação tratada.');
      setLeitura((atual) => (atual?.id === id ? atualizado : atual));
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao tratar a publicação');
    } finally {
      setTratandoId(null);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{pendentes} a tratar neste processo.</p>
        <div className="flex gap-2" role="group" aria-label="Situação das publicações">
          {FILTROS.map((filtro) => (
            <Button
              key={filtro.value}
              type="button"
              size="sm"
              variant={situacao === filtro.value ? 'default' : 'outline'}
              onClick={() => {
                setSituacao(filtro.value);
                setPagina(1);
              }}
            >
              {filtro.label}
            </Button>
          ))}
        </div>
      </div>

      {carregando && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!carregando && itens.length === 0 && (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma publicação deste processo. Elas aparecem aqui quando o acompanhamento recebe uma movimentação nova.
        </p>
      )}

      <ul className="space-y-3">
        {itens.map((item) => (
          <li key={item.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-3">
              <button type="button" onClick={() => setLeitura(item)} className="min-w-0 text-left">
                <p className="line-clamp-3 text-sm text-foreground hover:underline">{item.conteudo}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <SeloSituacaoPublicacao tratada={Boolean(item.tratado_em)} />
                  <span className="text-xs text-muted-foreground">{formatarDataPublicacao(item.data_movimentacao)}</span>
                  {textoPrazoPublicacao(item) && (
                    <span className="text-xs text-muted-foreground">{textoPrazoPublicacao(item)}</span>
                  )}
                </div>
              </button>
              {podeTratar && !item.tratado_em && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={tratandoId === item.id}
                  onClick={() => tratar(item.id)}
                >
                  {tratandoId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Tratar
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {totalPaginas > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Página {pagina} de {totalPaginas}</p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((atual) => atual - 1)}>
              Anterior
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPagina((atual) => atual + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}

      <LeituraPublicacao
        item={leitura}
        podeTratar={podeTratar}
        tratando={leitura !== null && tratandoId === leitura.id}
        onFechar={() => setLeitura(null)}
        onAbrirProcesso={() => setLeitura(null)}
        exibirAbrirProcesso={false}
        onTratar={tratar}
      />
    </div>
  );
}
