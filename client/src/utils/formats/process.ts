/**
 * Funções de formatação de números de processo jurídico
 */

/**
 * Formata um número de processo jurídico (0000000-00.0000.0.00.0000)
 */
export function formatProcessNumber(processNumber: string): string {
  if (!processNumber) return '';
  const cleaned = processNumber.replace(/\D/g, '');
  if (cleaned.length !== 20) return processNumber;
  return cleaned.replace(/(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6');
}
