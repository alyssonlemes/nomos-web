/**
 * Funções de formatação de CEP
 */

/**
 * Formata um CEP (00000-000)
 */
export function formatCEP(cep: string): string {
  if (!cep) return '';
  const cleaned = cep.replace(/\D/g, '');
  if (cleaned.length !== 8) return cep;
  return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}
