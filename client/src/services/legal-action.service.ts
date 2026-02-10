import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export type LegalStatus = 'open' | 'closed' | 'archived' | string;

export interface LegalActionClient {
  id: number;
  number?: string;
  title?: string;
  status?: LegalStatus;
  client_id?: number;
  client_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface LegalActionListResponse {
  actions: LegalActionClient[];
  total: number;
  skip: number;
  limit: number;
}

export interface LegalActionResponse {
  action: LegalActionClient;
}

export class LegalActionService {
  static async getLegalActions(
    skip = 0,
    limit = 10,
    legal_status?: string,
    client_id?: number,
    search?: string
  ): Promise<LegalActionListResponse> {
    const params = new URLSearchParams();
    params.set('skip', String(skip));
    params.set('limit', String(limit));
    if (legal_status) params.set('legal_status', legal_status);
    if (typeof client_id !== 'undefined') params.set('client_id', String(client_id));
    if (search) params.set('search', search);

    const url = `${API_BASE_URL}/api/v1/legal-actions?${params.toString()}`;

    const response = await AuthService.authenticatedFetch(url, { method: 'GET' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Erro ao buscar processos');
    }

    return response.json();
  }

  static async getLegalActionById(id: number): Promise<LegalActionResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions/${id}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Erro ao buscar processo');
    }

    return response.json();
  }

  static async createLegalAction(data: Partial<{
    number: string;
    title: string;
    client_id: number;
    action_type: string;
    description?: string;
    legal_status?: string;
    court_name?: string;
    filing_date?: string;
  }>): Promise<LegalActionResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Erro ao criar processo');
    }

    return response.json();
  }
}
