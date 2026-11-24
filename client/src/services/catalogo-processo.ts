import { AuthService } from './auth.service';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface ItemCatalogo {
  id: number;
  name: string;
  code: string;
  description: string | null;
}

export interface DadosCatalogo {
  name: string;
  code: string;
  description?: string | null;
}

export interface PaginaCatalogo {
  items: ItemCatalogo[];
  total: number;
  skip: number;
  limit: number;
}

type OpcoesCatalogo = {
  caminho: string;
  chave: string;
  rotulo: string;
  erroExcluir: string;
};

async function pedir<T>(caminho: string, init: RequestInit | undefined, fallback: string): Promise<T> {
  const response = await AuthService.authenticatedFetch(`${API_BASE_URL}/api/v1${caminho}`, init);
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detalhe = body.detail || body.message || fallback;
    throw new Error(typeof detalhe === 'string' ? detalhe : fallback);
  }
  return body as T;
}

export function catalogoProcesso(opcoes: OpcoesCatalogo) {
  return {
    async listar(skip = 0, limit = 10, search?: string, sortBy?: string, sortDir?: string): Promise<PaginaCatalogo> {
      const params = new URLSearchParams();
      params.set('skip', String(skip));
      params.set('limit', String(limit));
      if (search?.trim()) params.set('search', search.trim());
      if (sortBy) params.set('sort_by', sortBy);
      if (sortDir) params.set('sort_dir', sortDir);
      const data = await pedir<Record<string, unknown>>(
        `/${opcoes.caminho}?${params.toString()}`,
        { method: 'GET' },
        `Erro ao buscar ${opcoes.rotulo}`,
      );
      return {
        items: (data[opcoes.chave] as ItemCatalogo[] | undefined) ?? [],
        total: (data.total as number | undefined) ?? 0,
        skip,
        limit,
      };
    },
    obter(id: number) {
      return pedir<ItemCatalogo>(`/${opcoes.caminho}/${id}`, { method: 'GET' }, `Erro ao buscar ${opcoes.rotulo}`);
    },
    criar(data: DadosCatalogo) {
      return pedir<ItemCatalogo>(
        `/${opcoes.caminho}`,
        { method: 'POST', body: JSON.stringify(data) },
        `Erro ao criar ${opcoes.rotulo}`,
      );
    },
    atualizar(id: number, data: DadosCatalogo) {
      return pedir<ItemCatalogo>(
        `/${opcoes.caminho}/${id}`,
        { method: 'PUT', body: JSON.stringify(data) },
        `Erro ao atualizar ${opcoes.rotulo}`,
      );
    },
    excluir(id: number) {
      return pedir<void>(`/${opcoes.caminho}/${id}`, { method: 'DELETE' }, opcoes.erroExcluir);
    },
  };
}

export type ClienteCatalogo = ReturnType<typeof catalogoProcesso>;

export const tiposProcesso = catalogoProcesso({
  caminho: 'legal-action-types',
  chave: 'legal_action_types',
  rotulo: 'tipo de ação',
  erroExcluir: 'Não é possível excluir: existem processos usando este tipo.',
});

export const statusProcesso = catalogoProcesso({
  caminho: 'legal-action-statuses',
  chave: 'legal_action_statuses',
  rotulo: 'status de ação',
  erroExcluir: 'Não é possível excluir: existem processos usando este status.',
});

export type LegalActionStatus = ItemCatalogo;

export const LegalActionStatusService = {
  async getLegalActionStatuses(skip = 0, limit = 10, search?: string, sortBy?: string, sortDir?: string) {
    const pagina = await statusProcesso.listar(skip, limit, search, sortBy, sortDir);
    return { statuses: pagina.items, total: pagina.total, skip, limit };
  },
  getLegalActionStatusById: (id: number) => statusProcesso.obter(id),
  createLegalActionStatus: (data: DadosCatalogo) => statusProcesso.criar(data),
  updateLegalActionStatus: (id: number, data: DadosCatalogo) => statusProcesso.atualizar(id, data),
  deleteLegalActionStatus: (id: number) => statusProcesso.excluir(id),
};
