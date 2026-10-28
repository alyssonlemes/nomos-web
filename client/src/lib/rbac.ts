export type UserRole = 'ADMIN' | 'OWNER' | 'MEMBER' | 'VIEWER' | 'ASSISTANT';

export type ModuloSistema =
  | 'dashboard'
  | 'clientes'
  | 'processos'
  | 'atividades'
  | 'jurimetria'
  | 'usuarios'
  | 'configuracoes';

export type AcaoPermissao = 'visualizar' | 'criar' | 'editar' | 'excluir';

export interface Permissao {
  modulo: ModuloSistema;
  visualizar: boolean;
  criar: boolean;
  editar: boolean;
  excluir: boolean;
}

export const MODULOS: Array<{
  id: ModuloSistema;
  label: string;
  somenteVisualizar?: boolean;
  semCriarExcluir?: boolean;
}> = [
  { id: 'dashboard', label: 'Home', somenteVisualizar: true },
  { id: 'clientes', label: 'Clientes' },
  { id: 'processos', label: 'Processos' },
  { id: 'atividades', label: 'Atividades' },
  { id: 'jurimetria', label: 'Jurimetria', somenteVisualizar: true },
  { id: 'usuarios', label: 'Usuários' },
  { id: 'configuracoes', label: 'Configurações', semCriarExcluir: true },
];

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  OWNER: 'Proprietário',
  MEMBER: 'Membro',
  VIEWER: 'Visualizador',
  ASSISTANT: 'Assistente',
};

export const ROLE_OPTIONS: Array<{ value: UserRole; label: string; description: string }> = [
  { value: 'ADMIN', label: 'Administrador', description: 'Acesso total' },
  { value: 'OWNER', label: 'Proprietário', description: 'Responsável pela organização' },
  { value: 'MEMBER', label: 'Membro', description: 'Acesso operacional padrão' },
  { value: 'VIEWER', label: 'Visualizador', description: 'Apenas leitura' },
  { value: 'ASSISTANT', label: 'Assistente', description: 'Apoio operacional' },
];

const ROLE_VALUES: UserRole[] = ['ADMIN', 'OWNER', 'MEMBER', 'VIEWER', 'ASSISTANT'];

const ROTAS: Array<{ modulo: ModuloSistema; href: string }> = [
  { modulo: 'dashboard', href: '/home' },
  { modulo: 'clientes', href: '/clientes' },
  { modulo: 'processos', href: '/legal-actions' },
  { modulo: 'atividades', href: '/activities' },
  { modulo: 'jurimetria', href: '/jurimetria' },
  { modulo: 'usuarios', href: '/usuarios' },
  { modulo: 'configuracoes', href: '/configuracoes' },
];

type FeatureKey =
  | 'dashboard'
  | 'clients.read'
  | 'clients.write'
  | 'legalActions.read'
  | 'legalActions.write'
  | 'jurimetry.read'
  | 'users.menu'
  | 'users.write'
  | 'invitations.manage';

function lerUsuario(): {
  role?: string | null;
  profile_name?: string | null;
  isolate_data?: boolean;
  permissions?: Permissao[] | null;
} | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isUserRole(value: string | null | undefined): value is UserRole {
  return ROLE_VALUES.includes((value || '') as UserRole);
}

export function getCurrentRole(): UserRole | null {
  const fromStorage = localStorage.getItem('userRole');
  if (isUserRole(fromStorage)) {
    return fromStorage;
  }

  const user = lerUsuario();
  if (isUserRole(user?.role)) {
    localStorage.setItem('userRole', user.role);
    return user.role;
  }

  return null;
}

function permissaoLegada(role: UserRole | null, modulo: ModuloSistema, acao: AcaoPermissao): boolean {
  const admin = role === 'ADMIN' || role === 'OWNER';
  const membro = role === 'MEMBER';
  const visualizador = role === 'VIEWER';
  const assistente = role === 'ASSISTANT';
  if (!role) return false;

  if (modulo === 'dashboard') return acao === 'visualizar';
  if (modulo === 'jurimetria') return acao === 'visualizar' && !assistente;
  if (modulo === 'usuarios') {
    if (acao === 'visualizar') return admin || membro;
    return admin;
  }
  if (modulo === 'configuracoes') {
    if (acao === 'visualizar') return true;
    return acao === 'editar' && admin;
  }
  if (modulo === 'processos') {
    if (assistente) return false;
    if (acao === 'visualizar') return true;
    return admin || membro;
  }
  if (acao === 'visualizar') return true;
  return admin || membro || assistente;
}

export function temPermissao(modulo: ModuloSistema, acao: AcaoPermissao = 'visualizar'): boolean {
  const user = lerUsuario();
  const lista = user?.permissions;
  if (Array.isArray(lista) && lista.length > 0) {
    return Boolean(lista.find((item) => item.modulo === modulo)?.[acao]);
  }
  return permissaoLegada(getCurrentRole(), modulo, acao);
}

export function canAccess(role: UserRole | null, feature: FeatureKey): boolean {
  if (feature === 'dashboard') return temPermissao('dashboard');
  if (feature === 'clients.read') return temPermissao('clientes');
  if (feature === 'clients.write') {
    return temPermissao('clientes', 'criar') || temPermissao('clientes', 'editar') || temPermissao('clientes', 'excluir');
  }
  if (feature === 'legalActions.read') return temPermissao('processos');
  if (feature === 'legalActions.write') {
    return temPermissao('processos', 'criar') || temPermissao('processos', 'editar') || temPermissao('processos', 'excluir');
  }
  if (feature === 'jurimetry.read') return temPermissao('jurimetria');
  if (feature === 'users.menu') return temPermissao('usuarios');
  if (feature === 'users.write') return temPermissao('usuarios', 'editar');
  if (feature === 'invitations.manage') return temPermissao('usuarios', 'criar');
  return Boolean(role);
}

export function seesOwnDataOnly(role: UserRole | null = getCurrentRole()): boolean {
  const user = lerUsuario();
  if (user && Array.isArray(user.permissions) && user.permissions.length > 0 && typeof user.isolate_data === 'boolean') {
    return user.isolate_data;
  }
  return role === 'MEMBER' || role === 'VIEWER' || role === 'ASSISTANT';
}

export function ehAdministrador(): boolean {
  const user = lerUsuario();
  if (user?.profile_name) return user.profile_name === 'Administrador';
  const role = getCurrentRole();
  return role === 'ADMIN' || role === 'OWNER';
}

export function primeiraRotaPermitida(): string {
  for (const rota of ROTAS) {
    if (temPermissao(rota.modulo)) return rota.href;
  }
  return '/profile';
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function rotuloPerfil(user: { profile_name?: string | null; role?: string | null }): string {
  if (user.profile_name) return user.profile_name;
  if (isUserRole(user.role)) return ROLE_LABELS[user.role];
  return user.role || '—';
}
