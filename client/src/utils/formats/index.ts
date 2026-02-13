/**
 * Funções de formatação para campos do sistema
 * 
 * Este arquivo centraliza todas as exportações de formatação
 */

// Formatação de datas
export { formatDate, formatDateTime } from './date';

// Formatação de documentos
export { formatCPF, formatCNPJ, formatDocument } from './document';

// Formatação de telefone
export { formatPhone } from './phone';

// Formatação de valores monetários
export { formatCurrency } from './currency';

// Formatação de números de processo
export { formatProcessNumber } from './process';

// Formatação de CEP
export { formatCEP } from './cep';

// Formatação de status processual
export { formatLegalStatus } from './legal-status';

// Formatação de status de cliente
export { formatClientStatus, CLIENT_STATUS_KEYS } from './client-status';

// Formatação de tipo de ação
export { formatActionType } from './action-type';
