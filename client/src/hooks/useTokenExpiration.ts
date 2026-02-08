import { useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { useLocation } from 'wouter';

interface TokenExpirationState {
  isExpiringSoon: boolean;
  minutesUntilExpiration: number | null;
}

/**
 * Hook para monitorar a expiração do token
 * Retorna informações sobre o estado de expiração e mostra avisos quando necessário
 */
export function useTokenExpiration(checkInterval: number = 60000) {
  const [, setLocation] = useLocation();
  const [state, setState] = useState<TokenExpirationState>({
    isExpiringSoon: false,
    minutesUntilExpiration: null,
  });

  useEffect(() => {
    // Verificar imediatamente
    const checkTokenExpiration = () => {
      if (!AuthService.isAuthenticated()) {
        return;
      }

      const minutes = AuthService.getMinutesUntilExpiration();
      const isExpiringSoon = AuthService.isTokenExpiringSoon();

      setState({
        isExpiringSoon,
        minutesUntilExpiration: minutes,
      });

      // Se estiver próximo de expirar, mostrar aviso
      if (isExpiringSoon && minutes !== null) {
        console.warn(`⚠️ Sua sessão expirará em ${minutes} minuto(s).`);
      }
    };

    checkTokenExpiration();

    // Configurar intervalo para verificar periodicamente
    const interval = setInterval(checkTokenExpiration, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval, setLocation]);

  return state;
}
