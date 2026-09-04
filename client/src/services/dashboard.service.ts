/**
 * Dashboard Service - Nomos
 * Serviço para buscar estatísticas do dashboard
 */

import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface DashboardStats {
  total_clients: number;
  total_legal_actions: number;
  total_users: number;
  actions_by_status: Record<string, number>;
  actions_by_type: Record<string, number>;
  clients_by_status: Record<string, number>;
  recent_clients_30d: number;
  recent_actions_30d: number;
}

export class DashboardService {
  static async getStats(): Promise<DashboardStats> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/dashboard/stats`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar estatísticas do dashboard');
    }

    return response.json();
  }

  static async exportExcel(): Promise<Blob> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/dashboard/export-excel`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao exportar planilha da dashboard');
    }

    return response.blob();
  }
}
