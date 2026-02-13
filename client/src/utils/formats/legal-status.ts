/**
 * Formatação de status processual (legal status)
 */

const LABELS: Record<string, string> = {
  pre_trial: 'Pré-processual',
  filing: 'Ajuizamento',
  litigation: 'Contencioso',
  execution: 'Execução',
  appeal: 'Recurso',
  finalized: 'Finalizado',
  archived: 'Arquivado',
};

/**
 * Retorna o label em português para um status processual.
 * Se o status não for conhecido, retorna o valor original.
 */
export function formatLegalStatus(value: string | null | undefined): string {
  if (value == null || value === '') return '-';
  return LABELS[value] ?? value;
}
