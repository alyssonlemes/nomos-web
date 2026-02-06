interface RegisterUserRequest {
  email: string;
  username: string;
  password: string;
  full_name: string;
  organization_id: number | null;
}

interface RegisterUserWithOrganizationRequest {
  email: string;
  username: string;
  password: string;
  full_name: string;
  organization_name: string;
  organization_document: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  full_name: string;
  organization_id: number | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string | null;
}

interface ErrorResponse {
  detail: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export class UserService {
  static async register(payload: RegisterUserRequest): Promise<UserResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao criar usuário');
      }

      return response.json() as Promise<UserResponse>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  static async registerWithOrganization(
    payload: RegisterUserWithOrganizationRequest
  ): Promise<UserResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/users/register-with-organization`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(error.detail || 'Erro ao criar usuário');
      }

      return response.json() as Promise<UserResponse>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }
}
