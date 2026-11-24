import { DetalheCatalogo } from '@/components/catalogo/detalhe';
import { statusDeAcao } from '@/components/catalogo/textos';

export default function LegalActionStatusViewPage() {
  return <DetalheCatalogo config={statusDeAcao} />;
}
