/**
 * Funções de formatação de datas
 */

/**
 * Formata uma data para exibição (DD/MM/YYYY)
 */
export function formatDate(date: string | Date): string {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(dateObj.getTime())) return '';
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Formata uma data e hora para exibição (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(dateTime: string | Date): string {
  if (!dateTime) return '';
  const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
  if (isNaN(dateObj.getTime())) return '';
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
