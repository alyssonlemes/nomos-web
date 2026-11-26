import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PublicacaoIntegracao } from '@/services/legal-action.service';

export function formatarDataPublicacao(valor: string | null): string {
  if (!valor) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor.trim());
  if (!match) return valor.slice(0, 10);
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function textoPrazoPublicacao(item: PublicacaoIntegracao): string | null {
  if (item.prazo_status === 'cumprido') return 'Prazo cumprido';
  if (item.prazo_status === 'aberto' && item.prazo_vencimento) {
    const vencimento = formatarDataPublicacao(item.prazo_vencimento);
    if (item.dias_prazo != null) {
      return `Prazo de ${item.dias_prazo} dias, vencimento em ${vencimento}`;
    }
    return `Vencimento em ${vencimento}`;
  }
  if (item.prazo_status === 'conferir') return 'Confira o prazo no texto';
  return null;
}

export function SeloSituacaoPublicacao({ tratada }: { tratada: boolean }) {
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-400">
      {tratada ? 'Tratada' : 'A tratar'}
    </span>
  );
}

interface LeituraPublicacaoProps {
  item: PublicacaoIntegracao | null;
  podeTratar: boolean;
  tratando: boolean;
  onFechar: () => void;
  onAbrirProcesso: (legalActionId: number) => void;
  onTratar: (id: number) => void;
}

export function LeituraPublicacao({
  item,
  podeTratar,
  tratando,
  onFechar,
  onAbrirProcesso,
  onTratar,
}: LeituraPublicacaoProps) {
  const prazo = item ? textoPrazoPublicacao(item) : null;

  return (
    <Dialog open={item !== null} onOpenChange={(aberto) => { if (!aberto) onFechar(); }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono">{item?.numero || 'Publicação'}</DialogTitle>
          <DialogDescription>{item?.titulo}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {item && <SeloSituacaoPublicacao tratada={Boolean(item.tratado_em)} />}
            <span className="text-sm text-muted-foreground">
              {formatarDataPublicacao(item?.data_movimentacao ?? null)}
            </span>
          </div>
          <p className="whitespace-pre-wrap text-sm text-foreground">{item?.conteudo}</p>
          {prazo && <p className="text-sm text-muted-foreground">{prazo}</p>}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (!item) return;
              onAbrirProcesso(item.legal_action_id);
            }}
          >
            Abrir processo
          </Button>
          {podeTratar && item && !item.tratado_em && (
            <Button type="button" disabled={tratando} onClick={() => onTratar(item.id)}>
              {tratando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Tratar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
