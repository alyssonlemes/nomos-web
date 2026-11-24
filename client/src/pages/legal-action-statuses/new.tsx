import { FormularioCatalogo } from '@/components/catalogo/formulario';
import { statusDeAcao } from '@/components/catalogo/textos';

export default function LegalActionStatusNewPage() {
  return <FormularioCatalogo config={statusDeAcao} modo="novo" />;
}
