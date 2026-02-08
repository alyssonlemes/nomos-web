/**
 * Client Service - Nomos
 * Serviço para gerenciar clientes da organização
 */

import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  client_type?: 'individual' | 'business';
  status?: 'active' | 'inactive' | 'prospect' | 'archived';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  company_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
  skip: number;
  limit: number;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  document: string;
  client_type?: 'individual' | 'business';
  status?: 'active' | 'inactive' | 'prospect' | 'archived';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  company_name?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  client_type?: 'individual' | 'business';
  status?: 'active' | 'inactive' | 'prospect' | 'archived';
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  company_name?: string;
}

export class ClientService {
  /**
   * Buscar clientes com paginação
   */
  static async getClients(skip = 0, limit = 10): Promise<ClientsResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/clients?skip=${skip}&limit=${limit}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar clientes');
    }

    return response.json();
  }

  /**
   * Buscar um cliente por ID
   */
  static async getClientById(id: number): Promise<Client> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/clients/${id}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao buscar cliente');
    }

    return response.json();
  }

  /**
   * Criar novo cliente
   */
  static async createClient(data: CreateClientData): Promise<Client> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/clients`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao criar cliente');
    }

    return response.json();
  }

  /**
   * Atualizar cliente
   */
  static async updateClient(id: number, data: UpdateClientData): Promise<Client> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/clients/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao atualizar cliente');
    }

    return response.json();
  }

  /**
   * Deletar cliente
   */
  static async deleteClient(id: number): Promise<void> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/clients/${id}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao deletar cliente');
    }
  }
}
