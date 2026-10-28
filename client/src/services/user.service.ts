import { AuthService } from './auth.service';
import type { Permissao } from '@/lib/rbac';

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
  role?: string;
  profile_id?: number;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  role: string | null;
  profile_id: number | null;
  profile_name: string | null;
  isolate_data: boolean;
  permissions: Permissao[];
  organization_id: number | null;
  is_active: boolean;
  is_superuser: boolean;
  created_at: string;
  updated_at: string | null;
}

interface UsersListResponse {
  total: number;
  users: UserResponse[];
  skip?: number;
  limit?: number;
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

function guardarUsuario(data: UserResponse, atualizarSessao: boolean): UserResponse {
  if (data.role) {
    data.role = data.role.toUpperCase();
  }
  if (atualizarSessao) {
    localStorage.setItem('user', JSON.stringify(data));
    localStorage.setItem('userRole', data.role || '');
  }
  return data;
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

      const data = guardarUsuario(await response.json() as UserResponse, true);
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

  static async getUsers(
    skip: number = 0,
    limit: number = 10,
    options?: {
      search?: string;
      isActive?: boolean;
      role?: string;
      profileId?: number;
      sortBy?: string;
      sortDir?: string;
    },
  ): Promise<UsersListResponse> {
    try {
      const params = new URLSearchParams();
      params.set('skip', String(skip));
      params.set('limit', String(limit));
      if (options?.search?.trim()) params.set('search', options.search.trim());
      if (typeof options?.isActive === 'boolean') params.set('is_active', String(options.isActive));
      if (options?.role) params.set('role', options.role);
      if (options?.profileId) params.set('profile_id', String(options.profileId));
      if (options?.sortBy) params.set('sort_by', options.sortBy);
      if (options?.sortDir) params.set('sort_dir', options.sortDir);

      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/users?${params.toString()}`,
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

  static async updateUser(userId: number | 'me', payload: UpdateUserRequest): Promise<UserResponse> {
    try {
      const storedUserId = UserService.getStoredUser()?.id;
      const resolvedUserId = userId === 'me' ? storedUserId : userId;
      if (!resolvedUserId) {
        throw new Error('ID de usuario invalido');
      }

      const response = await AuthService.authenticatedFetch(
        `${API_BASE_URL}/api/v1/users/${resolvedUserId}`,
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const error: ErrorResponse = await response.json();
        throw new Error(formatApiError(error, 'Erro ao atualizar dados do usuário'));
      }

      const data = guardarUsuario(await response.json() as UserResponse, Boolean(storedUserId && resolvedUserId === storedUserId));
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

      return guardarUsuario(await response.json() as UserResponse, false);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro de conexão com o servidor');
    }
  }
}
