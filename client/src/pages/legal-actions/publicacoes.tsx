import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Check, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataListing, Column, LISTING_PAGE_SIZE } from '@/components/listing/DataListing';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  LegalActionService,
  PublicacaoIntegracao,
} from '@/services/legal-action.service';
import { temPermissao } from '@/lib/rbac';
import {
  formatarDataPublicacao,
  LeituraPublicacao,
  SeloSituacaoPublicacao,
  textoPrazoPublicacao,
} from './publicacao-leitura';

type Situacao = 'pendente' | 'tratada' | 'todas';

const FILTROS_SITUACAO: { value: Situacao; label: string }[] = [
  { value: 'pendente', label: 'A tratar' },
  { value: 'tratada', label: 'Tratadas' },
  { value: 'todas', label: 'Todas' },
];

interface AcoesLista {
  podeTratar: boolean;
  tratandoId: number | null;
  onAbrir: (id: number) => void;
  onLer: (item: PublicacaoIntegracao) => void;
  onTratar: (id: number) => void;
}

function colunasPublicacao(acoes: AcoesLista): Column<PublicacaoIntegracao>[] {
  return [
    {
      id: 'processo',
      header: 'Processo',
      className: 'text-foreground',
      sortValue: (row) => row.numero,
      exportValue: (row) => row.numero,
      cell: (row) => (
        <div className="min-w-[160px]">
          <p className="font-mono text-foreground">{row.numero || '—'}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{row.titulo || '—'}</p>
        </div>
      ),
    },
    {
      id: 'conteudo',
      header: 'Publicação',
      className: 'max-w-xl text-foreground',
      sortValue: (row) => row.conteudo,
      exportValue: (row) => row.conteudo,
      cell: (row) => (
        <button
          type="button"
          onClick={() => acoes.onLer(row)}
          className="line-clamp-2 max-w-xl text-left hover:underline"
        >
          {row.conteudo}
        </button>
      ),
    },
    {
      id: 'data',
      header: 'Data',
      className: 'whitespace-nowrap',
      sortValue: (row) => row.data_movimentacao || '',
      exportValue: (row) => formatarDataPublicacao(row.data_movimentacao),
      cell: (row) => formatarDataPublicacao(row.data_movimentacao),
    },
    {
      id: 'prazo',
      header: 'Prazo',
      sortValue: (row) => textoPrazoPublicacao(row) || '',
      exportValue: (row) => textoPrazoPublicacao(row) || '',
      cell: (row) => textoPrazoPublicacao(row) || '—',
    },
    {
      id: 'situacao',
      header: 'Situação',
      sortValue: (row) => (row.tratado_em ? 'Tratada' : 'A tratar'),
      exportValue: (row) => (row.tratado_em ? 'Tratada' : 'A tratar'),
      cell: (row) => <SeloSituacaoPublicacao tratada={Boolean(row.tratado_em)} />,
    },
    {
      id: 'actions',
      header: 'Ações',
      sortable: false,
      hideable: false,
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => acoes.onAbrir(row.legal_action_id)}
            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
            title="Abrir processo"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {acoes.podeTratar && !row.tratado_em && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={acoes.tratandoId === row.id}
              onClick={() => acoes.onTratar(row.id)}
              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
              title="Tratar"
            >
              {acoes.tratandoId === row.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      ),
    },
  ];
}

export default function PublicacoesPage() {
  const [, setLocation] = useLocation();
  const podeTratar = temPermissao('processos', 'editar');
  const [situacao, setSituacao] = useState<Situacao>('pendente');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [itens, setItens] = useState<PublicacaoIntegracao[]>([]);
  const [total, setTotal] = useState(0);
  const [pendentes, setPendentes] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [tratandoId, setTratandoId] = useState<number | null>(null);
  const [leitura, setLeitura] = useState<PublicacaoIntegracao | null>(null);
  const pedido = useRef(0);
  const buscaDebounced = useDebouncedValue(busca, 300);

  const carregar = useCallback(async () => {
    const atual = ++pedido.current;
    try {
      setCarregando(true);
      const skip = (pagina - 1) * LISTING_PAGE_SIZE;
      const dados = await LegalActionService.getPublicacoes(
        situacao,
        skip,
        LISTING_PAGE_SIZE,
        buscaDebounced || undefined,
      );
      if (atual !== pedido.current) return;
      const maxPage = Math.max(1, Math.ceil(dados.total / LISTING_PAGE_SIZE));
      if (pagina > maxPage) {
        setPagina(maxPage);
        return;
      }
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
  }, [situacao, pagina, buscaDebounced]);

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

  return (
    <>
      <DataListing
        storageKey="publicacoes"
        title="Publicações"
        description={`Atualizações que chegaram do acompanhamento. ${pendentes} a tratar.`}
        badge={
          <span className="inline-flex items-center rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
            {total} publicaç{total === 1 ? 'ão' : 'ões'}
          </span>
        }
        searchPlaceholder="Buscar por número, processo ou texto..."
        searchValue={busca}
        onSearchChange={(valor) => {
          setBusca(valor);
          setPagina(1);
        }}
        filters={[
          {
            id: 'situacao',
            value: situacao,
            placeholder: 'Situação',
            onChange: (valor) => {
              setSituacao(valor as Situacao);
              setPagina(1);
            },
            options: FILTROS_SITUACAO,
          },
        ]}
        columns={colunasPublicacao({
          podeTratar,
          tratandoId,
          onAbrir: (id) => setLocation(`/legal-actions/${id}`),
          onLer: setLeitura,
          onTratar: tratar,
        })}
        data={itens}
        isLoading={carregando}
        emptyTitle="Nenhuma publicação encontrada"
        emptyDescription={
          busca || situacao !== 'pendente'
            ? 'Tente outro termo ou filtro.'
            : 'Elas aparecem aqui quando o acompanhamento de um processo recebe uma movimentação nova.'
        }
        pagination={{
          page: pagina,
          totalPages: Math.max(1, Math.ceil(total / LISTING_PAGE_SIZE)),
          total,
          pageSize: LISTING_PAGE_SIZE,
          onPageChange: setPagina,
        }}
        exportFilename="publicacoes"
      />

      <LeituraPublicacao
        item={leitura}
        podeTratar={podeTratar}
        tratando={leitura !== null && tratandoId === leitura.id}
        onFechar={() => setLeitura(null)}
        onAbrirProcesso={(id) => setLocation(`/legal-actions/${id}`)}
        onTratar={tratar}
      />
    </>
  );
}
