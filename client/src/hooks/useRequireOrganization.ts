import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { UserService } from '@/services/user.service';

/**
 * Hook para verificar se o usuário tem organização
 * Redireciona para onboarding se não tiver
 */
export function useRequireOrganization() {
  const [, setLocation] = useLocation();
  const user = UserService.getStoredUser();

  useEffect(() => {
    if (!user || !user.organization_id) {
      setLocation('/onboarding-organization');
    }
  }, [user, setLocation]);

  return {
    hasOrganization: !!user?.organization_id,
    user,
  };
}
