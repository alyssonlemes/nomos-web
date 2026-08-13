import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ChatHistoricoItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface JurimetriaChatRequest {
  mensagem: string;
  historico: ChatHistoricoItem[];
}

export interface JurimetriaChatResponse {
  resposta: string;
  tipo: 'texto' | 'predicao' | 'estatistica' | 'ajuda';
  numero_processo?: string;
  tribunal?: string;
  tempo_total_estimado_dias?: number;
  tempo_decorrido_dias?: number;
  tempo_estimado_restante_dias?: number;
}

export class JurimetriaService {
  static async chat(
    mensagem: string,
    historico: ChatHistoricoItem[] = [],
  ): Promise<JurimetriaChatResponse> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/jurimetria/chat`,
      {
        method: 'POST',
        body: JSON.stringify({ mensagem, historico } satisfies JurimetriaChatRequest),
      }
    );

    if (!response.ok) {
      let detalhe = 'Erro ao processar sua mensagem.';
      try {
        const erro = await response.json();
        if (erro?.detail) detalhe = String(erro.detail);
      } catch {
        // fallback para mensagem genérica
      }
      throw new Error(detalhe);
    }

    return response.json() as Promise<JurimetriaChatResponse>;
  }
}

