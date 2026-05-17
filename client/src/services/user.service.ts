import { AuthService } from './auth.service';
import { UserRole } from '@/lib/rbac';

interface RegisterUserRequest {
  email: string;
  password: string;
  full_name: string;
  organization_id: number | null;
}

interface UpdateUserRequest {
  full_name?: string;
  email?: string;
}

interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: UserRole | null;
  organization_id: number | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string | null;
}

interface UsersListResponse {
  total: number;
  users: UserResponse[];
}

interface ErrorResponse {
  detail: string | Array<{
    type?: string;
    loc?: Array<string | number>;
    msg?: string;
    input?: unknown;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function translateFieldName(field: string): string {
  const translations: Record<string, string> = {
    email: 'email',
    password: 'senha',
    full_name: 'nome completo',
    organization_id: 'organização',
    role: 'perfil',
  };

  return translations[field] || field.replace(/_/g, ' ');
}

function translateValidationMessage(item: {
  type?: string;
  loc?: Array<string | number>;
  msg?: string;
}): string {
  const field = item.loc?.find((part) => typeof part === 'string' && part !== 'body');
  const fieldName = typeof field === 'string' ? translateFieldName(field) : 'campo';

  if (item.type === 'string_too_short') {
    const minLength = typeof item.loc?.includes('password') === 'boolean' ? 6 : undefined;
    if (field === 'password') {
      return `A senha deve ter pelo menos ${minLength || 6} caracteres.`;
    }
    return `O campo ${fieldName} deve ter pelo menos ${minLength || 6} caracteres.`;
  }

  if (item.type === 'missing') {
    return `O campo ${fieldName} é obrigatório.`;
  }

  if (item.msg) {
    if (field === 'password') {
      return `A senha é inválida.`;
    }
    return `O campo ${fieldName} está inválido.`;
  }

  return 'Dados inválidos.';
}

function formatApiError(error: ErrorResponse, fallbackMessage: string): string {
  if (typeof error.detail === 'string') {
    return error.detail;
  }

  if (Array.isArray(error.detail) && error.detail.length > 0) {
    return error.detail
      .map((item) => translateValidationMessage(item))
      .join('; ');
  }

  return fallbackMessage;
}

export class UserService {
  static async getMe(): Promise<UserResponse> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/users/me`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(formatApiError(error, 'Erro ao obter dados do usuário'));
      }

      const data = await response.json() as UserResponse & { role: string | null };
      // Permitir role nula quando usuário ainda não pertence a uma organização
      const roleUpper = data.role ? data.role.toUpperCase() : null;
      if (roleUpper && !['ADMIN', 'OWNER', 'MEMBER', 'VIEWER', 'ASSISTANT'].includes(roleUpper)) {
        throw new Error('Role inválida retornada pelo servidor');
      }
      // Normalizar role para o formato esperado pela UI (pode ser null)
      data.role = roleUpper ? (roleUpper as UserRole) : null;

      // Armazenar dados do usuário no localStorage
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('userRole', data.role || '');

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  static getStoredUser(): UserResponse | null {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  static clearStoredUser(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
  }

  static async getUsers(skip: number = 0, limit: number = 100): Promise<UsersListResponse> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/users?skip=${skip}&limit=${limit}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(formatApiError(error, 'Erro ao buscar usuários'));
      }

      const data = await response.json();
      
      // API retorna array direto, não objeto com paginação
      if (Array.isArray(data)) {
        return {
          total: data.length,
          users: data,
        };
      }
      
      // Caso a API retorne objeto com paginação
      return data as UsersListResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  static async getUserById(userId: number): Promise<UserResponse> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/users/${userId}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(formatApiError(error, 'Erro ao buscar usuário'));
      }

      return response.json() as Promise<UserResponse>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

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
        throw new Error(formatApiError(error, 'Erro ao criar usuário'));
      }

      return response.json() as Promise<UserResponse>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  static async updateUser(payload: UpdateUserRequest): Promise<UserResponse> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/users/me`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(formatApiError(error, 'Erro ao atualizar dados do usuário'));
      }

      const data = await response.json() as UserResponse & { role: string | null };
      const roleUpper = data.role ? data.role.toUpperCase() : null;
      if (roleUpper && !['ADMIN', 'OWNER', 'MEMBER', 'VIEWER', 'ASSISTANT'].includes(roleUpper)) {
        throw new Error('Role inválida retornada pelo servidor');
      }
      data.role = roleUpper ? (roleUpper as UserRole) : null;

      // Atualizar dados do usuário no localStorage
      localStorage.setItem('user', JSON.stringify(data));
      localStorage.setItem('userRole', data.role || '');

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  static async unlinkOrganization(userId: number): Promise<void> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/users/${userId}/unlink-organization`,
        { method: 'POST' }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(formatApiError(error, 'Erro ao desvincular usuário da organização'));
      }

      return;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }

  static async updateUserRole(userId: number, payload: UpdateUserRoleRequest): Promise<UserResponse> {
    try {
      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/users/${userId}/role`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(formatApiError(error, 'Erro ao atualizar role do usuário'));
      }

      const data = await response.json() as UserResponse & { role: string | null };
      const roleUpper = data.role ? data.role.toUpperCase() : null;
      if (roleUpper && !['ADMIN', 'OWNER', 'MEMBER', 'VIEWER', 'ASSISTANT'].includes(roleUpper)) {
        throw new Error('Role inválida retornada pelo servidor');
      }
      data.role = roleUpper ? (roleUpper as UserRole) : null;

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }
}
