export type UserRole = 'ADMIN' | 'OWNER' | 'MEMBER' | 'VIEWER' | 'ASSISTANT';

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

const FEATURE_ROLES: Record<FeatureKey, UserRole[]> = {
  dashboard: ['ADMIN', 'OWNER', 'MEMBER', 'VIEWER', 'ASSISTANT'],
  'clients.read': ['ADMIN', 'OWNER', 'MEMBER', 'VIEWER', 'ASSISTANT'],
  'clients.write': ['ADMIN', 'OWNER', 'MEMBER', 'ASSISTANT'],
  'legalActions.read': ['ADMIN', 'OWNER', 'MEMBER', 'VIEWER'],
  'legalActions.write': ['ADMIN', 'OWNER', 'MEMBER', 'VIEWER'],
  'jurimetry.read': ['ADMIN', 'OWNER', 'MEMBER', 'VIEWER'],
  'users.menu': ['ADMIN', 'OWNER', 'MEMBER'],
  'users.write': ['ADMIN', 'OWNER'],
  'invitations.manage': ['ADMIN', 'OWNER'],
};

const ROLE_VALUES: UserRole[] = ['ADMIN', 'OWNER', 'MEMBER', 'VIEWER', 'ASSISTANT'];

export function isUserRole(value: string | null | undefined): value is UserRole {
  return ROLE_VALUES.includes((value || '') as UserRole);
}

export function getCurrentRole(): UserRole | null {
  const fromStorage = localStorage.getItem('userRole');
  if (isUserRole(fromStorage)) {
    return fromStorage;
  }

  try {
    const userRaw = localStorage.getItem('user');
    if (!userRaw) return null;

    const user = JSON.parse(userRaw) as { role?: string };
    if (isUserRole(user.role)) {
      localStorage.setItem('userRole', user.role);
      return user.role;
    }
  } catch {
    return null;
  }

  return null;
}

export function canAccess(role: UserRole | null, feature: FeatureKey): boolean {
  if (!role) return false;
  return FEATURE_ROLES[feature].includes(role);
}

export function seesOwnDataOnly(role: UserRole | null): boolean {
  return role === 'MEMBER' || role === 'VIEWER' || role === 'ASSISTANT';
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}