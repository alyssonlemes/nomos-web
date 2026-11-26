import { History } from 'lucide-react';
import { LegalAction } from '@/services/legal-action.service';

function formatarDataHora(valor: string | null | undefined): string {
  if (!valor) return '—';
  return new Date(valor).toLocaleString('pt-BR');
}

export function AndamentosProcesso({ action }: { action: LegalAction }) {
  const movimentos = action.movimentos ?? [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Andamento do processo extraído do DataJud.</p>
      {movimentos.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhuma movimentação registrada.
        </p>
      ) : (
        <ul className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
          {movimentos.map((movimento) => (
            <li key={movimento.id} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
              <History className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{movimento.nome}</p>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {formatarDataHora(movimento.data_hora)}
                  </span>
                </div>
                {movimento.codigo && (
                  <span className="text-xs text-muted-foreground">Código TPU: {movimento.codigo}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
