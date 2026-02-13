/**
 * Formatação de status de cliente (client status)
 */

const LABELS: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  prospect: 'Prospecção',
  archived: 'Arquivado',
};

/** Chaves de status de cliente (para listar opções, legendas, etc.) */
export const CLIENT_STATUS_KEYS = Object.keys(LABELS) as (keyof typeof LABELS)[];

/**
 * Retorna o label em português para um status de cliente.
 * Se o status não for conhecido, retorna o valor original.
 */
export function formatClientStatus(value: string | null | undefined): string {
  if (value == null || value === '') return '-';
  return LABELS[value] ?? value;
}
