import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LegalActionStatus {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface LegalActionStatusListResponse {
  total: number;
  legal_action_statuses: LegalActionStatus[];
}

export interface LegalActionStatusCreate {
  name: string;
  code: string;
  description?: string | null;
}

export interface LegalActionStatusUpdate {
  name?: string;
  code?: string;
  description?: string | null;
}

export class LegalActionStatusService {
  static async getLegalActionStatuses(
    skip = 0,
    limit = 10,
    search?: string
  ): Promise<{ statuses: LegalActionStatus[]; total: number; skip: number; limit: number }> {
    const params = new URLSearchParams();
    params.set('skip', String(skip));
    params.set('limit', String(limit));
    if (search?.trim()) params.set('search', search.trim());

    const url = `${API_BASE_URL}/api/v1/legal-action-statuses?${params.toString()}`;
    const response = await AuthService.authenticatedFetch(url, { method: 'GET' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar status de ações');
    }

    const data: LegalActionStatusListResponse = await response.json();
    const statuses = data.legal_action_statuses ?? [];
    const total = data.total ?? 0;

    return { statuses, total, skip, limit };
  }

  static async getLegalActionStatusById(id: number): Promise<LegalActionStatus> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-action-statuses/${id}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar status de ação');
    }

    return response.json();
  }

  static async createLegalActionStatus(data: LegalActionStatusCreate): Promise<LegalActionStatus> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-action-statuses`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao criar status de ação');
    }

    return response.json();
  }

  static async updateLegalActionStatus(
    id: number,
    data: LegalActionStatusUpdate
  ): Promise<LegalActionStatus> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-action-statuses/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao atualizar status de ação');
    }

    return response.json();
  }

  static async deleteLegalActionStatus(id: number): Promise<void> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-action-statuses/${id}`,
      { method: 'DELETE' }
    );

    if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || error.message || 'Não é possível excluir: existem processos usando este status.'
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao excluir status de ação');
    }
  }
}
