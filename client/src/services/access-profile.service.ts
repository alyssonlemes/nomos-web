import { AuthService } from './auth.service';
import type { Permissao } from '@/lib/rbac';

export interface AccessProfile {
  id: number;
  name: string;
  description: string | null;
  is_system: boolean;
  isolate_data: boolean;
  permissions: Permissao[];
}

interface AccessProfileListResponse {
  profiles: AccessProfile[];
}

interface ErrorResponse {
  detail?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function mensagem(response: Response, fallback: string): Promise<string> {
  try {
    const error = (await response.json()) as ErrorResponse;
    return error.detail || fallback;
  } catch {
    return fallback;
  }
}

export class AccessProfileService {
  static async list(): Promise<AccessProfile[]> {
    const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/api/v1/access-profiles`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(await mensagem(response, 'Erro ao carregar perfis'));
    }
    const data = (await response.json()) as AccessProfileListResponse;
    return data.profiles || [];
  }

  static async update(
    profileId: number,
    payload: { isolate_data: boolean; permissions: Permissao[] },
  ): Promise<AccessProfile> {
    const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/api/v1/access-profiles/${profileId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(await mensagem(response, 'Erro ao salvar permissões'));
    }
    return response.json() as Promise<AccessProfile>;
  }
}
