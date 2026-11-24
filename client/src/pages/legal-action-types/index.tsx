import { ListaCatalogo } from '@/components/catalogo/lista';
import { tiposDeAcao } from '@/components/catalogo/textos';

export default function LegalActionTypesPage() {
  return <ListaCatalogo config={tiposDeAcao} />;
}
