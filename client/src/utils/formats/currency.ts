/**
 * Funções de formatação de valores monetários
 */

/**
 * Formata um valor monetário (R$ 0,00)
 */
export function formatCurrency(value: number | string): string {
  if (value === null || value === undefined) return 'R$ 0,00';
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numValue);
}
