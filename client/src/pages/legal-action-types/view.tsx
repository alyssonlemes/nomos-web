import { DetalheCatalogo } from '@/components/catalogo/detalhe';
import { tiposDeAcao } from '@/components/catalogo/textos';

export default function LegalActionTypeViewPage() {
  return <DetalheCatalogo config={tiposDeAcao} />;
}
