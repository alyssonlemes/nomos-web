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

type LegalStatusLike =
  | string
  | null
  | undefined
  | {
      code: string;
      name?: string | null;
      description?: string | null;
      id?: number;
    };

/**
 * Retorna o label em português para um status processual.
 * Aceita tanto o código simples (string) quanto o objeto retornado pela API.
 * Se o status não for conhecido, retorna o valor original/código.
 */
export function formatLegalStatus(value: LegalStatusLike): string {
  if (value == null || value === '') return '-';

  // Quando vier como objeto da API (name, code, description, id)
  if (typeof value === 'object') {
    if (value.name && String(value.name).trim() !== '') {
      return String(value.name);
    }
    const code = value.code;
    if (!code) return '-';
    return LABELS[code] ?? code;
  }

  // Quando vier como string (código/enumeration)
  return LABELS[value] ?? value;
}
