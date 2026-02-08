import { AuthService } from './auth.service';

export interface Organization {
  id: number;
  name: string;
  document: string;
  created_at: string;
  updated_at: string | null;
}

export interface OrganizationInvite {
  id: number;
  organization_id: number;
  organization: Organization;
  email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string | null;
}

interface CreateOrganizationRequest {
  name: string;
  document: string;
}

interface ErrorResponse {
  detail: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class OrganizationService {
  /**
   * Buscar convites pendentes do usuário logado
   */
  static async getInvites(): Promise<OrganizationInvite[]> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/organizations/invites`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao buscar convites');
      }

      return response.json() as Promise<OrganizationInvite[]>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  /**
   * Aceitar um convite de organização
   */
  static async acceptInvite(inviteId: number): Promise<Organization> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/organizations/invites/${inviteId}/accept`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao aceitar convite');
      }

      const data = await response.json();
      
      // Atualizar dados do usuário no localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.organization_id = data.id;
      localStorage.setItem('user', JSON.stringify(user));

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  /**
   * Rejeitar um convite de organização
   */
  static async rejectInvite(inviteId: number): Promise<void> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/organizations/invites/${inviteId}/reject`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao rejeitar convite');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  /**
   * Criar nova organização
   */
  static async createOrganization(
    payload: CreateOrganizationRequest
  ): Promise<Organization> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/organizations`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao criar organização');
      }

      const data = await response.json();
      
      // Atualizar dados do usuário no localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      user.organization_id = data.id;
      localStorage.setItem('user', JSON.stringify(user));

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  /**
   * Buscar organização do usuário logado
   */
  static async getUserOrganization(): Promise<Organization> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/organizations`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao buscar organização');
      }

      return response.json() as Promise<Organization>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  /**
   * Buscar organização atual do usuário (legacy)
   */
  static async getCurrentOrganization(): Promise<Organization | null> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/organizations/current`,
        { method: 'GET' }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao buscar organização');
      }

      return response.json() as Promise<Organization>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }
}
