import { statusProcesso, tiposProcesso, type ClienteCatalogo } from '@/services/catalogo-processo';

export type TextosCatalogo = {
  cliente: ClienteCatalogo;
  base: string;
  storageKey: string;
  titulo: string;
  descricao: string;
  busca: string;
  exportFilename: string;
  unidade: (total: number) => string;
  vazio: string;
  vazioBusca: string;
  novo: string;
  primeiro: string;
  excluirTitulo: string;
  excluirDescricao: (nome: string) => string;
  sucessoExcluir: string;
  erroLista: string;
  erroExcluir: string;
  voltar: string;
  tituloNovo: string;
  textoNovo: string;
  tituloEditar: string;
  textoEditar: (nome: string) => string;
  card: string;
  placeholderNome: string;
  placeholderCodigo: string;
  ajudaCodigo: string;
  placeholderDescricao: string;
  criar: string;
  erroCriar: string;
  erroAtualizar: string;
  erroId: string;
  naoEncontrado: string;
  nomeVazio: string;
  detalheSemCodigo: string;
  detalhePadrao: string;
  cardDetalhe: string;
  editar: string;
};

export const tiposDeAcao: TextosCatalogo = {
  cliente: tiposProcesso,
  base: '/legal-action-types',
  storageKey: 'tipos-acao',
  titulo: 'Tipos de Ações',
  descricao: 'Gerencie os tipos de ações jurídicas (ex.: Trabalhista, Cível)',
  busca: 'Buscar por nome ou código...',
  exportFilename: 'tipos-de-acao',
  unidade: (total) => `${total} tipo${total !== 1 ? 's' : ''}`,
  vazio: 'Nenhum tipo de ação cadastrado.',
  vazioBusca: 'Nenhum tipo encontrado para a busca.',
  novo: 'Novo tipo',
  primeiro: 'Adicionar Primeiro Tipo',
  excluirTitulo: 'Excluir tipo de ação',
  excluirDescricao: (nome) =>
    `Tem certeza que deseja excluir o tipo "${nome}"? Se houver processos usando este tipo, a exclusão não será permitida.`,
  sucessoExcluir: 'Tipo de ação excluído com sucesso!',
  erroLista: 'Erro ao carregar tipos de ação',
  erroExcluir: 'Erro ao excluir tipo de ação',
  voltar: 'Voltar para Tipos de Ações',
  tituloNovo: 'Novo Tipo de Ação',
  textoNovo: 'Preencha os dados para cadastrar um novo tipo de ação jurídica (ex.: Trabalhista, Cível)',
  tituloEditar: 'Editar Tipo de Ação',
  textoEditar: (nome) => `Atualize as informações do tipo ${nome}`,
  card: 'Dados do tipo',
  placeholderNome: 'Ex: Trabalhista',
  placeholderCodigo: 'Ex: labor',
  ajudaCodigo: 'Identificador único (ex.: labor, civil)',
  placeholderDescricao: 'Ex: Ações trabalhistas',
  criar: 'Criar tipo',
  erroCriar: 'Erro ao criar tipo de ação',
  erroAtualizar: 'Erro ao atualizar tipo de ação',
  erroId: 'ID do tipo inválido',
  naoEncontrado: 'Tipo de ação não encontrado',
  nomeVazio: 'Tipo de ação',
  detalheSemCodigo: 'Detalhes do tipo',
  detalhePadrao: 'Detalhes do tipo de ação',
  cardDetalhe: 'Informações do tipo',
  editar: 'Editar tipo',
};

export const statusDeAcao: TextosCatalogo = {
  cliente: statusProcesso,
  base: '/legal-action-statuses',
  storageKey: 'status-acao',
  titulo: 'Status de Ações',
  descricao: 'Gerencie os status das ações jurídicas (ex.: Pré-processual, Em andamento)',
  busca: 'Buscar por nome ou código...',
  exportFilename: 'status-de-acao',
  unidade: (total) => `${total} status`,
  vazio: 'Nenhum status de ação cadastrado.',
  vazioBusca: 'Nenhum status encontrado para a busca.',
  novo: 'Novo status',
  primeiro: 'Adicionar Primeiro Status',
  excluirTitulo: 'Excluir status de ação',
  excluirDescricao: (nome) =>
    `Tem certeza que deseja excluir o status "${nome}"? Se houver processos usando este status, a exclusão não será permitida.`,
  sucessoExcluir: 'Status de ação excluído com sucesso!',
  erroLista: 'Erro ao carregar status de ações',
  erroExcluir: 'Erro ao excluir status de ação',
  voltar: 'Voltar para Status de Ações',
  tituloNovo: 'Novo Status de Ação',
  textoNovo: 'Preencha os dados para cadastrar um novo status de ação jurídica (ex.: Pré-processual, Suspenso)',
  tituloEditar: 'Editar Status de Ação',
  textoEditar: (nome) => `Atualize as informações do status ${nome}`,
  card: 'Dados do status',
  placeholderNome: 'Ex: Pré-processual',
  placeholderCodigo: 'Ex: pre_trial',
  ajudaCodigo: 'Identificador único (ex.: pre_trial, suspended)',
  placeholderDescricao: 'Ex: Processo em fase pré-processual',
  criar: 'Criar status',
  erroCriar: 'Erro ao criar status de ação',
  erroAtualizar: 'Erro ao atualizar status de ação',
  erroId: 'ID do status inválido',
  naoEncontrado: 'Status de ação não encontrado',
  nomeVazio: 'Status de ação',
  detalheSemCodigo: 'Detalhes do status',
  detalhePadrao: 'Detalhes do status de ação',
  cardDetalhe: 'Informações do status',
  editar: 'Editar status',
};
