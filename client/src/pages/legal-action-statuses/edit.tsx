import { FormularioCatalogo } from '@/components/catalogo/formulario';
import { statusDeAcao } from '@/components/catalogo/textos';

export default function LegalActionStatusEditPage() {
  return <FormularioCatalogo config={statusDeAcao} modo="editar" />;
}
