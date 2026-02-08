import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { useTokenExpiration } from '../hooks/useTokenExpiration';
import { AuthService } from '../services/auth.service';

/**
 * Componente que monitora a expiração do token e exibe alertas
 */
export function TokenExpirationAlert() {
  const { isExpiringSoon, minutesUntilExpiration } = useTokenExpiration();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when the warning changes
  useEffect(() => {
    if (isExpiringSoon) {
      setIsDismissed(false);
    }
  }, [isExpiringSoon]);

  // Se não estiver expirando ou foi dispensado, não mostrar
  if (!isExpiringSoon || isDismissed || minutesUntilExpiration === null) {
    return null;
  }

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = '/login';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-semibold">⚠️ Sessão expirando</p>
            <p className="text-sm">
              Sua sessão expirará em {minutesUntilExpiration} minuto(s). 
              Salve seu trabalho ou faça login novamente.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDismissed(true)}
            >
              Dispensar
            </Button>
            <Button
              size="sm"
              onClick={handleLogout}
            >
              Fazer Login
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
