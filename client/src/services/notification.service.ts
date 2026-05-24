import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface NotificationResponse {
  id: number;
  title: string;
  message: string;
  legal_action_id: number | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  total: number;
  notifications: NotificationResponse[];
}

export class NotificationService {
  static async getNotifications(skip = 0, limit = 10): Promise<NotificationListResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/notifications?skip=${skip}&limit=${limit}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar notificacoes');
    }

    return response.json() as Promise<NotificationListResponse>;
  }

  static async markAsRead(notificationId: number): Promise<NotificationResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/notifications/${notificationId}/read`,
      { method: 'PATCH' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao marcar notificacao');
    }

    return response.json() as Promise<NotificationResponse>;
  }
}
