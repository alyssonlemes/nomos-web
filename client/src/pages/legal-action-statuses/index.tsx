import { ListaCatalogo } from '@/components/catalogo/lista';
import { statusDeAcao } from '@/components/catalogo/textos';

export default function LegalActionStatusesPage() {
  return <ListaCatalogo config={statusDeAcao} />;
}
