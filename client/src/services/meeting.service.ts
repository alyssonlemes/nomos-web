import { AuthService } from "./auth.service";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export interface MeetingConflictParticipant {
  id: number;
  full_name?: string | null;
  email?: string | null;
}

export interface MeetingConflict {
  id: number;
  title: string;
  start_at: string;
  end_at: string;
  participants: MeetingConflictParticipant[];
}

export interface MeetingConflictError {
  message: string;
  conflicts: MeetingConflict[];
}

export class MeetingService {
  static async previewConflicts(
    start_at: string,
    end_at: string,
    participant_ids: number[]
  ) {
    const url = `${API_BASE_URL}/api/v1/meetings/preview`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify({ start_at, end_at, participant_ids }),
    });
    if (!res.ok) throw new Error("Erro ao verificar conflitos");
    return res.json();
  }

  static async createMeeting(payload: any) {
    const url = `${API_BASE_URL}/api/v1/meetings`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const detail = body?.detail;
      if (detail && typeof detail === "object") {
        throw detail as MeetingConflictError;
      }
      throw new Error(
        detail?.message || body?.message || "Erro ao criar reunião"
      );
    }
    return res.json();
  }

  static async listForUser(user_id: number) {
    const url = `${API_BASE_URL}/api/v1/meetings?user_id=${user_id}`;
    const res = await AuthService.authenticatedFetch(url);
    if (!res.ok) throw new Error("Erro ao buscar reuniões");
    return res.json();
  }

  static async acceptMeeting(meetingId: number) {
    const url = `${API_BASE_URL}/api/v1/meetings/${meetingId}/accept`;
    const res = await AuthService.authenticatedFetch(url, { method: "POST" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body?.detail || body?.message || "Erro ao confirmar presença"
      );
    }
    return res.json();
  }

  static async declineMeeting(meetingId: number, reason: string) {
    const url = `${API_BASE_URL}/api/v1/meetings/${meetingId}/decline`;
    const res = await AuthService.authenticatedFetch(url, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(
        body?.detail || body?.message || "Erro ao recusar presença"
      );
    }
    return res.json();
  }
}
