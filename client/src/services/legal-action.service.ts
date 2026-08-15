import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─────────────────── Interfaces DataJud Auto-Complete ────────────────────

export interface DataJudAssunto {
  codigo?: string | null;
  nome?: string | null;
}

export interface DataJudMovimento {
  codigo?: string | null;
  nome: string;
  data_hora?: string | null;
  complemento?: Record<string, unknown> | null;
}

export interface DataJudProcessoDados {
  numero_cnj: string;
  tribunal?: string | null;
  classe_processual_codigo?: string | null;
  classe_processual_nome?: string | null;
  assuntos?: DataJudAssunto[] | null;
  orgao_julgador?: string | null;
  comarca?: string | null;
  vara?: string | null;
  competencia?: string | null;
  magistrado?: string | null;
  court_name?: string | null;
  data_ajuizamento?: string | null;
  data_distribuicao?: string | null;
  valor_causa?: string | null;
  segredo_justica: boolean;
  datajud_last_update?: string | null;
  movimentos?: DataJudMovimento[] | null;
  area_juridica?: string | null;
}

export interface DataJudParteEncontrada {
  nome: string;
  documento?: string | null;
  polo?: string | null;
  tipo_participacao?: string | null;
  oab?: string | null;
  client_id: number;
  client_name: string;
  match_tipo: 'documento' | 'nome_fuzzy';
  match_score?: number | null;
}

export interface DataJudParteSugestao {
  nome: string;
  documento?: string | null;
  polo?: string | null;
  tipo_participacao?: string | null;
  oab?: string | null;
  client_type?: 'individual' | 'business' | null;
}

export interface DataJudAutoCompleteResponse {
  processo_encontrado: boolean;
  processo_existente_id?: number | null;
  dados?: DataJudProcessoDados | null;
  partes_encontradas: DataJudParteEncontrada[];
  partes_nao_encontradas: DataJudParteSugestao[];
  aviso?: string | null;
}


// Tipo de ação retornado pela API (GET /legal-action-types e aninhado em LegalAction)
export interface LegalActionTypeEntity {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface LegalActionAssignedUser {
  id: number;
  full_name: string | null;
  email: string;
}

export enum LegalStatus {
  PRE_TRIAL = 'pre_trial',
  FILING = 'filing',
  LITIGATION = 'litigation',
  EXECUTION = 'execution',
  APPEAL = 'appeal',
  FINALIZED = 'finalized',
  ARCHIVED = 'archived',
}

export interface ProcessoParteEntity {
  id: number;
  polo: string | null;
  tipo_participacao: string | null;
  nome: string;
  documento: string | null;
  oab: string | null;
  client_id: number | null;
}

export interface ProcessoMovimentoEntity {
  id: number;
  codigo: string | null;
  nome: string;
  data_hora: string | null;
  complemento_json: string | null;
}

export interface LegalAction {
  id: number;
  number: string;
  title: string;
  description: string | null;
  action_type_id: number;
  action_type: LegalActionTypeEntity | null;
  legal_status: LegalStatus;
  court_name: string | null;
  filing_date: string | null;
  closing_date: string | null;
  client_id: number;
  organization_id: number;
  user_id: number | null;
  assigned_users?: LegalActionAssignedUser[];
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  client_name?: string;

  // Campos DataJud (CNJ)
  tribunal?: string | null;
  comarca?: string | null;
  vara?: string | null;
  orgao_julgador?: string | null;
  competencia?: string | null;
  magistrado?: string | null;
  classe_processual_codigo?: string | null;
  classe_processual_nome?: string | null;
  assuntos_json?: string | null;
  data_distribuicao?: string | null;
  valor_causa?: number | null;
  segredo_justica?: boolean;
  datajud_synced_at?: string | null;

  partes?: ProcessoParteEntity[];
  movimentos?: ProcessoMovimentoEntity[];
}

export interface ProcessoParteCreate {
  polo?: string | null;
  tipo_participacao?: string | null;
  nome: string;
  documento?: string | null;
  oab?: string | null;
  client_id?: number | null;
}

export interface ProcessoMovimentoCreate {
  codigo?: string | null;
  nome: string;
  data_hora?: string | null;
  complemento_json?: string | null;
}

export interface LegalActionCreate {
  number: string;
  title: string;
  description?: string | null;
  action_type_id: number;
  legal_status?: LegalStatus;
  court_name?: string | null;
  filing_date?: string | null;
  client_id: number;
  user_ids?: number[];

  // Campos DataJud opcionais
  tribunal?: string | null;
  comarca?: string | null;
  vara?: string | null;
  orgao_julgador?: string | null;
  competencia?: string | null;
  magistrado?: string | null;
  classe_processual_codigo?: string | null;
  classe_processual_nome?: string | null;
  assuntos_json?: string | null;
  data_distribuicao?: string | null;
  valor_causa?: number | null;
  segredo_justica?: boolean;
  partes?: ProcessoParteCreate[];
  movimentos?: ProcessoMovimentoCreate[];
}

export interface LegalActionUpdate {
  title?: string;
  description?: string | null;
  action_type_id?: number;
  legal_status?: LegalStatus;
  court_name?: string | null;
  filing_date?: string | null;
  closing_date?: string | null;
  client_id?: number;
  user_ids?: number[];

  // Campos DataJud opcionais
  tribunal?: string | null;
  comarca?: string | null;
  vara?: string | null;
  orgao_julgador?: string | null;
  competencia?: string | null;
  magistrado?: string | null;
  classe_processual_codigo?: string | null;
  classe_processual_nome?: string | null;
  assuntos_json?: string | null;
  data_distribuicao?: string | null;
  valor_causa?: number | null;
  segredo_justica?: boolean;
  partes?: ProcessoParteCreate[];
  movimentos?: ProcessoMovimentoCreate[];
}

// Resposta crua da API (conforme doc)
export interface ApiLegalActionListResponse {
  total: number;
  legal_actions: LegalAction[];
}

// Resposta adaptada para o front atual
export interface LegalActionListResponse {
  actions: LegalAction[];
  total: number;
  skip: number;
  limit: number;
}

export class LegalActionService {
  static async getLegalActionTypes(): Promise<LegalActionTypeEntity[]> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-action-types`,
      { method: 'GET' }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar tipos de ação');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : data.legal_action_types ?? data.items ?? [];
  }

  static async getLegalActions(
    skip = 0,
    limit = 10,
    legal_status?: string,
    client_id?: number,
    search?: string
  ): Promise<LegalActionListResponse> {
    const params = new URLSearchParams();
    params.set('skip', String(skip));
    params.set('limit', String(limit));
    if (legal_status) params.set('legal_status', legal_status);
    if (typeof client_id !== 'undefined') params.set('client_id', String(client_id));
    if (search) params.set('search', search);

    const url = `${API_BASE_URL}/api/v1/legal-actions?${params.toString()}`;

    const response = await AuthService.authenticatedFetch(url, { method: 'GET' });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar processos');
    }

    const data: ApiLegalActionListResponse = await response.json();

    return {
      actions: data.legal_actions,
      total: data.total,
      skip,
      limit,
    };
  }

  static async getLegalActionById(id: number): Promise<LegalAction> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions/${id}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao buscar processo');
    }

    return response.json();
  }

  static async createLegalAction(data: LegalActionCreate): Promise<LegalAction> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao criar processo');
    }

    return response.json();
  }

  static async updateLegalAction(id: number, data: LegalActionUpdate): Promise<LegalAction> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao atualizar processo');
    }

    return response.json();
  }

  static async deleteLegalAction(id: number): Promise<void> {
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/legal-actions/${id}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || error.message || 'Erro ao excluir processo');
    }
  }

  /**
   * Consulta o DataJud pelo número CNJ e retorna os dados para pre-fill do formulário.
   * Endpoint: GET /api/integracao/datajud/autocomplete?numero_cnj=...
   */
  static async autoCompleteByCNJ(numeroCNJ: string): Promise<DataJudAutoCompleteResponse> {
    const params = new URLSearchParams({ numero_cnj: numeroCNJ.trim() });
    const response = await AuthService.authenticatedFetch(
      `${API_BASE_URL}/api/v1/integracao/datajud/autocomplete?${params.toString()}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const detail = error.detail || error.message;
      // Repassar código HTTP para o chamador tratar diferente
      const err = new Error(
        typeof detail === 'string' ? detail : 'Erro ao consultar DataJud'
      ) as Error & { status?: number };
      err.status = response.status;
      throw err;
    }

    return response.json();
  }
}
