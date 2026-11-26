import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const ABAS_PROCESSO = ['dados', 'andamentos', 'prazos', 'publicacoes'] as const;

export type AbaProcesso = (typeof ABAS_PROCESSO)[number];

const ROTULO: Record<AbaProcesso, string> = {
  dados: 'Dados',
  andamentos: 'Andamentos',
  prazos: 'Prazos',
  publicacoes: 'Publicações',
};

export const CLASSE_GATILHO_ABA =
  'rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none';

export function indiceAba(aba: AbaProcesso): number {
  return ABAS_PROCESSO.indexOf(aba);
}

export function abaSeguinte(aba: AbaProcesso): AbaProcesso | null {
  return ABAS_PROCESSO[indiceAba(aba) + 1] ?? null;
}

export function abaAnterior(aba: AbaProcesso): AbaProcesso | null {
  const indice = indiceAba(aba);
  if (indice <= 0) return null;
  return ABAS_PROCESSO[indice - 1];
}

interface ListaAbasProcessoProps {
  complementos?: Partial<Record<AbaProcesso, string>>;
}

export function ListaAbasProcesso({ complementos }: ListaAbasProcessoProps) {
  return (
    <TabsList className="mb-6 h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-0">
      {ABAS_PROCESSO.map((aba) => (
        <TabsTrigger key={aba} value={aba} className={CLASSE_GATILHO_ABA}>
          {ROTULO[aba]}
          {complementos?.[aba] ?? ''}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}

interface NavegacaoAbasProps {
  aba: AbaProcesso;
  onChange: (aba: AbaProcesso) => void;
  desabilitado?: boolean;
  podeAvancar?: () => boolean;
  cancelar?: ReactNode;
  acaoFinal: ReactNode;
}

export function NavegacaoAbas({
  aba,
  onChange,
  desabilitado,
  podeAvancar,
  cancelar,
  acaoFinal,
}: NavegacaoAbasProps) {
  const anterior = abaAnterior(aba);
  const seguinte = abaSeguinte(aba);

  const avancar = () => {
    if (!seguinte) return;
    if (podeAvancar && !podeAvancar()) return;
    onChange(seguinte);
  };

  return (
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>{cancelar}</div>
      <div className="flex items-center justify-end gap-3">
        {anterior && (
          <Button type="button" variant="outline" disabled={desabilitado} onClick={() => onChange(anterior)}>
            Anterior
          </Button>
        )}
        {seguinte ? (
          <Button type="button" disabled={desabilitado} onClick={avancar}>
            Avançar
          </Button>
        ) : (
          acaoFinal
        )}
      </div>
    </div>
  );
}

export function AbasProcesso({
  aba,
  onChange,
  children,
}: {
  aba: AbaProcesso;
  onChange: (aba: AbaProcesso) => void;
  children: ReactNode;
}) {
  return (
    <Tabs value={aba} onValueChange={(valor) => onChange(valor as AbaProcesso)}>
      {children}
    </Tabs>
  );
}
