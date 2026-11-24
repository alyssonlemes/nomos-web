import { FormularioCatalogo } from '@/components/catalogo/formulario';
import { tiposDeAcao } from '@/components/catalogo/textos';

export default function LegalActionTypeEditPage() {
  return <FormularioCatalogo config={tiposDeAcao} modo="editar" />;
}
