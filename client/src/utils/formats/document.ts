/**
 * Funções de formatação de documentos (CPF, CNPJ)
 */

/**
 * Formata um CPF (000.000.000-00)
 */
export function formatCPF(cpf: string): string {
  if (!cpf) return '';
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata um CNPJ (00.000.000/0000-00)
 */
export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return '';
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata um documento (CPF ou CNPJ) automaticamente
 */
export function formatDocument(document: string): string {
  if (!document) return '';
  const cleaned = document.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return formatCPF(document);
  } else if (cleaned.length === 14) {
    return formatCNPJ(document);
  }
  return document;
}
