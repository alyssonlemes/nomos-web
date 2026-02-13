/**
 * Formatação de tipo de ação (action type)
 */

const LABELS: Record<string, string> = {
  labor: 'Trabalhista',
  civil: 'Cível',
  criminal: 'Criminal',
  admin: 'Administrativa',
  tax: 'Tributária',
  commercial: 'Comercial',
  family: 'Família',
  real_estate: 'Imóvel',
  other: 'Outra',
};

/**
 * Retorna o label em português para um tipo de ação.
 * Se o tipo não for conhecido, retorna o valor original.
 */
export function formatActionType(value: string | null | undefined): string {
  if (value == null || value === '') return '-';
  return LABELS[value] ?? value;
}
