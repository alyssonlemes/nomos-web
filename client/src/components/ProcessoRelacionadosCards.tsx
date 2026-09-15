import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssuntosForm, AssuntoItem } from '@/components/AssuntosForm';
import { PartesForm } from '@/components/PartesForm';
import { MovementsForm } from '@/components/MovementsForm';
import { ProcessoMovimentoCreate, ProcessoParteCreate } from '@/services/legal-action.service';

interface ProcessoRelacionadosCardsProps {
  assuntos: AssuntoItem[];
  onAssuntosChange: (assuntos: AssuntoItem[]) => void;
  partes: ProcessoParteCreate[];
  onPartesChange: (partes: ProcessoParteCreate[]) => void;
  movimentos: ProcessoMovimentoCreate[];
  onMovimentosChange: (movimentos: ProcessoMovimentoCreate[]) => void;
  disabled?: boolean;
}

export function ProcessoRelacionadosCards({
  assuntos,
  onAssuntosChange,
  partes,
  onPartesChange,
  movimentos,
  onMovimentosChange,
  disabled,
}: ProcessoRelacionadosCardsProps) {
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Assuntos do Processo (TPU)
            {assuntos.length > 0 && (
              <Badge variant="secondary" className="ml-2 font-mono">
                {assuntos.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Matérias do direito classificadas pelo CNJ</CardDescription>
        </CardHeader>
        <CardContent>
          <AssuntosForm
            assuntos={assuntos}
            onChange={onAssuntosChange}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Partes do Processo
            {partes.length > 0 && (
              <Badge variant="secondary" className="ml-2 font-mono">
                {partes.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Polos ativos, passivos e representantes</CardDescription>
        </CardHeader>
        <CardContent>
          <PartesForm
            partes={partes}
            onChange={onPartesChange}
            disabled={disabled}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">
            Movimentos
            {movimentos.length > 0 && (
              <Badge variant="secondary" className="ml-2 font-mono">
                {movimentos.length}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Movimentos históricos sincronizados via DataJud ou adicionados manualmente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MovementsForm
            movements={movimentos}
            onChange={onMovimentosChange}
            disabled={disabled}
          />
        </CardContent>
      </Card>
    </>
  );
}
