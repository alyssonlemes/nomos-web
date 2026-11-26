import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LISTING_PAGE_SIZE } from '@/components/listing/DataListing';
import {
  LegalActionService,
  PublicacaoIntegracao,
} from '@/services/legal-action.service';
import { temPermissao } from '@/lib/rbac';

type Situacao = 'pendente' | 'tratada' | 'todas';

function formatarData(valor: string | null): string {
  if (!valor) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor.trim());
  if (!match) return valor.slice(0, 10);
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function textoPrazo(item: PublicacaoIntegracao): string | null {
  if (item.prazo_status === 'cumprido') return 'Prazo cumprido';
  if (item.prazo_status === 'aberto' && item.prazo_vencimento) {
    const vencimento = formatarData(item.prazo_vencimento);
    if (item.dias_prazo != null) {
      return `Prazo de ${item.dias_prazo} dias, vencimento em ${vencimento}`;
    }
    return `Vencimento em ${vencimento}`;
  }
  if (item.prazo_status === 'conferir') return 'Confira o prazo no texto';
  return null;
}

function paginasVisiveis(atual: number, total: number): number[] {
  return Array.from({ length: Math.min(5, total) }, (_, index) => {
    if (total <= 5) return index + 1;
    if (atual <= 3) return index + 1;
    if (atual >= total - 2) return total - 4 + index;
    return atual - 2 + index;
  });
}

export default function PublicacoesPage() {
  const [, setLocation] = useLocation();
  const podeTratar = temPermissao('processos', 'editar');
  const [situacao, setSituacao] = useState<Situacao>('pendente');
  const [pagina, setPagina] = useState(1);
  const [itens, setItens] = useState<PublicacaoIntegracao[]>([]);
  const [total, setTotal] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [tratandoId, setTratandoId] = useState<number | null>(null);
  const pedido = useRef(0);
  const situacaoRef = useRef(situacao);
  const paginaRef = useRef(pagina);
  situacaoRef.current = situacao;
  paginaRef.current = pagina;

  const carregar = useCallback(async () => {
    const atual = ++pedido.current;
    const situacaoAtual = situacaoRef.current;
    const paginaAtual = paginaRef.current;
    try {
      setCarregando(true);
      const skip = (paginaAtual - 1) * LISTING_PAGE_SIZE;
      const dados = await LegalActionService.getPublicacoes(situacaoAtual, skip, LISTING_PAGE_SIZE);
      if (atual !== pedido.current) return;
      const maxPage = Math.max(1, Math.ceil(dados.total / LISTING_PAGE_SIZE));
      if (paginaRef.current > maxPage) {
        setPagina(maxPage);
        return;
      }
      if (situacaoRef.current !== situacaoAtual || paginaRef.current !== paginaAtual) return;
      setItens(dados.publicacoes);
      setTotal(dados.total);
      setPendentes(dados.pendentes);
    } catch (err) {
      if (atual !== pedido.current) return;
      setItens([]);
      setTotal(0);
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar publicações');
    } finally {
      if (atual === pedido.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    setItens([]);
    carregar();
  }, [situacao, pagina, carregar]);

  const tratar = async (id: number) => {
    setTratandoId(id);
    try {
      await LegalActionService.tratarPublicacao(id);
      toast.success('Publicação tratada.');
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao tratar a publicação');
    } finally {
      setTratandoId(null);
    }
  };

  const totalPaginas = Math.max(1, Math.ceil(total / LISTING_PAGE_SIZE));
  const inicio = total === 0 ? 0 : (pagina - 1) * LISTING_PAGE_SIZE + 1;
  const fim = Math.min(pagina * LISTING_PAGE_SIZE, total);

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Publicações</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Atualizações que chegaram do acompanhamento. {pendentes} a tratar.
          </p>
        </div>

        <div className="flex gap-2">
          {(
            [
              ['pendente', 'A tratar'],
              ['tratada', 'Tratadas'],
              ['todas', 'Todas'],
            ] as const
          ).map(([valor, rotulo]) => (
            <Button
              key={valor}
              type="button"
              variant={situacao === valor ? 'default' : 'outline'}
              onClick={() => {
                setSituacao(valor);
                setPagina(1);
              }}
            >
              {rotulo}
            </Button>
          ))}
        </div>

        {carregando && itens.length === 0 && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando publicações...
          </p>
        )}

        {!carregando && itens.length === 0 && (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              Nenhuma atualização nesta lista. Elas aparecem aqui quando o acompanhamento de um processo recebe uma movimentação nova.
            </CardContent>
          </Card>
        )}

        {itens.map((item) => {
          const prazo = textoPrazo(item);
          return (
            <Card key={item.id}>
              <CardContent className="py-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.numero}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.titulo}</p>
                  </div>
                  <Badge variant="outline">{formatarData(item.data_movimentacao)}</Badge>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{item.conteudo}</p>
                {prazo && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    {prazo}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation(`/legal-actions/${item.legal_action_id}`)}
                  >
                    Abrir processo
                  </Button>
                  {podeTratar && !item.tratado_em && (
                    <Button type="button" disabled={tratandoId === item.id} onClick={() => tratar(item.id)}>
                      {tratandoId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tratar'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {total > LISTING_PAGE_SIZE && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Página {pagina} de {totalPaginas}
              <span className="ml-2">
                (Exibindo {inicio}-{fim} de {total})
              </span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPagina((atual) => atual - 1)}
                disabled={pagina <= 1 || carregando}
              >
                Anterior
              </Button>
              <div className="flex items-center gap-1">
                {paginasVisiveis(pagina, totalPaginas).map((numero) => (
                  <Button
                    key={numero}
                    type="button"
                    variant={pagina === numero ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0"
                    disabled={carregando}
                    onClick={() => setPagina(numero)}
                  >
                    {numero}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPagina((atual) => atual + 1)}
                disabled={pagina >= totalPaginas || carregando}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
