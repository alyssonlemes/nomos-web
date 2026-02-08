import { AuthService } from './auth.service';

export interface Invitation {
  id: number;
  organization_id: number;
  organization_name: string;
  email: string;
  invited_by_email: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string | null;
}

interface InvitationsResponse {
  total: number;
  invitations: Invitation[];
}

interface InviteUserRequest {
  email: string;
}

interface ErrorResponse {
  detail: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class InvitationService {
  /**
   * Enviar convite para um usuário
   */
  static async inviteUser(payload: InviteUserRequest): Promise<void> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/invitations`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao enviar convite');
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  /**
   * Buscar convites do usuário logado
   */
  static async getMyInvitations(): Promise<Invitation[]> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/invitations/my-invitations`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao buscar convites');
      }

      const data: InvitationsResponse = await response.json();
      
      // Retornar apenas o array de convites
      return data.invitations || [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  /**
   * Aceitar um convite
   */
  static async acceptInvite(inviteId: number): Promise<void> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/invitations/${inviteId}/accept`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao aceitar convite');
      }

      const data = await response.json();
      
      // Atualizar dados do usuário no localStorage
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (data.organization_id) {
        user.organization_id = data.organization_id;
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  /**
   * Rejeitar um convite
   */
  static async rejectInvite(inviteId: number): Promise<void> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/invitations/${inviteId}/reject`,
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
}
