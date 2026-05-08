import { AuthService } from "./auth.service";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface ActivityUser {
  id: number;
  full_name?: string | null;
  email?: string | null;
}

export interface ActivityComment {
  id: number;
  activity_id: number;
  author?: ActivityUser;
  content: string;
  created_at: string;
}

export interface ActivityAttachment {
  id: number;
  activity_id: number;
  file_url: string;
  file_name?: string | null;
  uploaded_by?: ActivityUser;
  created_at: string;
}

export interface ActivityHistory {
  id: number;
  activity_id: number;
  field_changed: string;
  old_value?: string | null;
  new_value?: string | null;
  changed_by?: ActivityUser;
  changed_at: string;
}

export interface Activity {
  id: number;
  organization_id: number;
  title: string;
  description?: string | null;
  type: string;
  responsible_id?: number | null;
  priority: string;
  status: string;
  start_date: string;
  end_date: string;
  event_time?: string | null;
  location_or_link?: string | null;
  estimated_hours?: number | null;
  observations?: string | null;
  created_by_id?: number | null;
  created_at: string;
  updated_at?: string | null;

  responsible?: ActivityUser;
  created_by?: ActivityUser;
  participants: ActivityUser[];
  comments: ActivityComment[];
  attachments: ActivityAttachment[];
  history: ActivityHistory[];
}

export interface ActivityListResponse {
  total: number;
  activities: Activity[];
}

export interface ActivityKanbanResponse {
  status: string;
  activities: Activity[];
}

export class ActivityService {
  static async createActivity(payload: any) {
    const url = `${API_BASE_URL}/api/v1/activities`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body?.detail?.message || body?.message || "Erro ao criar atividade"
      );
    }
    return res.json();
  }

  static async listActivities(
    organizationId: number,
    filters?: {
      status?: string;
      type?: string;
      responsible_id?: number;
      skip?: number;
      limit?: number;
    }
  ) {
    const params = new URLSearchParams({
      organization_id: String(organizationId),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.responsible_id && {
        responsible_id: String(filters.responsible_id),
      }),
      skip: String(filters?.skip || 0),
      limit: String(filters?.limit || 50),
    });

    const url = `${API_BASE_URL}/api/v1/activities?${params}`;
    const res = await AuthService.authenticatedFetch(url);
    if (!res.ok) throw new Error("Erro ao buscar atividades");
    return res.json();
  }

  static async getActivityKanban(organizationId: number) {
    const url = `${API_BASE_URL}/api/v1/activities/kanban?organization_id=${organizationId}`;
    const res = await AuthService.authenticatedFetch(url);
    if (!res.ok) throw new Error("Erro ao buscar Kanban");
    return res.json();
  }

  static async getActivity(activityId: number) {
    const url = `${API_BASE_URL}/api/v1/activities/${activityId}`;
    const res = await AuthService.authenticatedFetch(url);
    if (!res.ok) throw new Error("Erro ao buscar atividade");
    return res.json();
  }

  static async updateActivity(activityId: number, payload: any) {
    const url = `${API_BASE_URL}/api/v1/activities/${activityId}`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body?.detail?.message || body?.message || "Erro ao atualizar atividade"
      );
    }
    return res.json();
  }

  static async moveActivity(activityId: number, newStatus: string) {
    const url = `${API_BASE_URL}/api/v1/activities/${activityId}/move`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify({ new_status: newStatus }),
    });
    if (!res.ok) throw new Error("Erro ao mover atividade");
    return res.json();
  }

  static async deleteActivity(activityId: number) {
    const url = `${API_BASE_URL}/api/v1/activities/${activityId}`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Erro ao deletar atividade");
    return res.ok;
  }

  static async addComment(activityId: number, content: string) {
    const url = `${API_BASE_URL}/api/v1/activities/${activityId}/comments`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("Erro ao adicionar comentário");
    return res.json();
  }

  static async getComments(activityId: number) {
    const url = `${API_BASE_URL}/api/v1/activities/${activityId}/comments`;
    const res = await AuthService.authenticatedFetch(url);
    if (!res.ok) throw new Error("Erro ao buscar comentários");
    return res.json();
  }

  // ===== Kanban Columns =====
  static async createColumn(
    organizationId: number,
    name: string,
    order_index: number,
    color?: string,
    is_default: boolean = false,
    status?: string
  ) {
    const url = `${API_BASE_URL}/api/v1/activities/columns/create`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify({
        organization_id: organizationId,
        name,
        ...(status ? { status } : {}),
        order_index,
        color: color || "#f3f4f6",
        is_default,
      }),
    });
    if (!res.ok) throw new Error("Erro ao criar coluna");
    return res.json();
  }

  static async listColumns(organizationId: number) {
    const url = `${API_BASE_URL}/api/v1/activities/columns/list?organization_id=${organizationId}`;
    const res = await AuthService.authenticatedFetch(url);
    if (!res.ok) throw new Error("Erro ao buscar colunas");
    return res.json();
  }

  static async updateColumn(
    columnId: number,
    organizationId: number,
    name: string,
    order_index: number,
    color?: string,
    status?: string,
    is_default: boolean = false
  ) {
    const url = `${API_BASE_URL}/api/v1/activities/columns/${columnId}`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "PATCH",
      body: JSON.stringify({
        organization_id: organizationId,
        name,
        status,
        order_index,
        color: color || "#f3f4f6",
        is_default,
      }),
    });
    if (!res.ok) throw new Error("Erro ao atualizar coluna");
    return res.json();
  }

  static async deleteColumn(columnId: number) {
    const url = `${API_BASE_URL}/api/v1/activities/columns/${columnId}`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Erro ao deletar coluna");
    return res.ok;
  }
}
