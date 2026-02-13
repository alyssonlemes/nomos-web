import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Tipos conforme documentação
export enum LegalActionType {
  LABOR = 'labor',
  CIVIL = 'civil',
  CRIMINAL = 'criminal',
  ADMINISTRATIVE = 'admin',
  TAX = 'tax',
  COMMERCIAL = 'commercial',
  FAMILY = 'family',
  REAL_ESTATE = 'real_estate',
  OTHER = 'other',
}

export enum LegalStatus {
  PRE_TRIAL = 'pre_trial',
  FILING = 'filing',
  LITIGATION = 'litigation',
  EXECUTION = 'execution',
  APPEAL = 'appeal',
  FINALIZED = 'finalized',
  ARCHIVED = 'archived',
}

export interface LegalAction {
  id: number;
  number: string;
  title: string;
  description: string | null;
  action_type: LegalActionType;
  legal_status: LegalStatus;
  court_name: string | null;
  filing_date: string | null;
  closing_date: string | null;
  client_id: number;
  organization_id: number;
  user_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  // Campo adicional retornado pela API para exibição na lista
  client_name?: string;
}

export interface LegalActionCreate {
  number: string;
  title: string;
  description?: string | null;
  action_type: LegalActionType;
  legal_status?: LegalStatus;
  court_name?: string | null;
  filing_date?: string | null;
  client_id: number;
}

export interface LegalActionUpdate {
  title?: string;
  description?: string | null;
  action_type?: LegalActionType;
  legal_status?: LegalStatus;
  court_name?: string | null;
  filing_date?: string | null;
  closing_date?: string | null;
  client_id?: number;
}

// Resposta crua da API (conforme doc)
export interface ApiLegalActionListResponse {
  total: number;
  legal_actions: LegalAction[];
}

// Resposta adaptada para o front atual
export interface LegalActionListResponse {
  actions: LegalAction[];
  total: number;
  skip: number;
  limit: number;
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
      throw new Error(error.detail || error.message || 'Erro ao buscar processos');
    }

    const data: ApiLegalActionListResponse = await response.json();

    return {
      actions: data.legal_actions,
      total: data.total,
      skip,
      limit,
    };
  }

  static async getLegalActionById(id: number): Promise<LegalAction> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions/${id}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar processo');
    }

    return response.json();
  }

  static async createLegalAction(data: LegalActionCreate): Promise<LegalAction> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao criar processo');
    }

    return response.json();
  }

  static async updateLegalAction(id: number, data: LegalActionUpdate): Promise<LegalAction> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao atualizar processo');
    }

    return response.json();
  }

  static async deleteLegalAction(id: number): Promise<void> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions/${id}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao excluir processo');
    }
  }
}
