import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface JurimetriaChatContext {
  tribunal?: string;
  classe_processual?: string;
  area_juridica_principal?: string;
  data_ajuizamento?: string;
}

export interface JurimetriaChatRequest {
  message: string;
  context?: JurimetriaChatContext;
}

export interface JurimetriaChatPrediction {
  tribunal: string;
  classe_processual?: string;
  area_juridica_principal?: string;
  data_ajuizamento: string;
  tempo_total_estimado_dias: number;
  tempo_decorrido_dias?: number | null;
  tempo_estimado_restante_dias?: number | null;
  fonte_dados: string;
}

export interface JurimetriaChatResponse {
  message: string;
  prediction?: JurimetriaChatPrediction;
  missing_fields?: string[];
  extracted_fields?: JurimetriaChatContext;
}

export class JurimetriaService {
  static async chat(payload: JurimetriaChatRequest): Promise<JurimetriaChatResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/jurimetria/chat`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const message = error.detail ?? error.message ?? 'Erro ao consultar jurimetria';
      throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
    }

    return response.json();
  }
}
