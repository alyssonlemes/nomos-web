import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface LegalActionType {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface LegalActionTypeListResponse {
  total: number;
  legal_action_types: LegalActionType[];
}

export interface LegalActionTypeCreate {
  name: string;
  code: string;
  description?: string | null;
}

export interface LegalActionTypeUpdate {
  name?: string;
  code?: string;
  description?: string | null;
}

export class LegalActionTypeService {
  static async getLegalActionTypes(
    skip = 0,
    limit = 10,
    search?: string
  ): Promise<{ types: LegalActionType[]; total: number; skip: number; limit: number }> {
    const params = new URLSearchParams();
    params.set('skip', String(skip));
    params.set('limit', String(limit));
    if (search?.trim()) params.set('search', search.trim());

    const url = `${API_BASE_URL}/api/v1/legal-action-types?${params.toString()}`;
    const response = await AuthService.authenticatedFetch(url, { method: 'GET' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar tipos de ação');
    }

    const data: LegalActionTypeListResponse = await response.json();
    const types = data.legal_action_types ?? [];
    const total = data.total ?? 0;

    return { types, total, skip, limit };
  }

  static async getLegalActionTypeById(id: number): Promise<LegalActionType> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-action-types/${id}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar tipo de ação');
    }

    return response.json();
  }

  static async createLegalActionType(data: LegalActionTypeCreate): Promise<LegalActionType> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-action-types`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao criar tipo de ação');
    }

    return response.json();
  }

  static async updateLegalActionType(
    id: number,
    data: LegalActionTypeUpdate
  ): Promise<LegalActionType> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-action-types/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao atualizar tipo de ação');
    }

    return response.json();
  }

  static async deleteLegalActionType(id: number): Promise<void> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-action-types/${id}`,
      { method: 'DELETE' }
    );

    if (response.status === 400) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.detail || error.message || 'Não é possível excluir: existem processos usando este tipo.'
      );
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao excluir tipo de ação');
    }
  }
}
