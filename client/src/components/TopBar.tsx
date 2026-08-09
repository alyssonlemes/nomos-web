import { Bell, User, ChevronDown, LogOut } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { AuthService } from '@/services/auth.service';
import { UserService } from '@/services/user.service';
import type { UserResponse } from '@/services/user.service';
import { NotificationService, NotificationResponse } from '@/services/notification.service';

/**
 * Componente TopBar - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Barra superior com notificações e perfil do usuário
 */

interface TopBarProps {
  userName?: string;
  userEmail?: string;
}

export default function TopBar({ userName, userEmail }: TopBarProps) {
  const [, setLocation] = useLocation();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  useEffect(() => {
    // Se as props não foram fornecidas, ler do localStorage
    if (!userName || !userEmail) {
      const storedUser = UserService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      }
    }
  }, [userName, userEmail]);

  const loadNotifications = useCallback(async () => {
    setIsLoadingNotifications(true);
    try {
      const data = await NotificationService.getNotifications(0, 5);
      setNotifications(data.notifications ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const connect = () => {
      const token = AuthService.getToken();
      if (!token || isDisposed) return;

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const wsBaseUrl = apiBaseUrl.replace(/^http/, 'ws');
      ws = new WebSocket(`${wsBaseUrl}/api/v1/notifications/ws?token=${token}`);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { type?: string; notifications?: NotificationResponse[] };
          if (payload.type === 'snapshot' && Array.isArray(payload.notifications)) {
            setNotifications(payload.notifications);
            return;
          }
          if (payload.type === 'new' && Array.isArray(payload.notifications)) {
            setNotifications((prev) => {
              const existing = new Set(prev.map((item) => item.id));
              const incoming = payload.notifications!.filter((item) => !existing.has(item.id));
              return incoming.length > 0 ? [...incoming.reverse(), ...prev] : prev;
            });
          }
        } catch {
          // no-op
        }
      };

      ws.onerror = () => {
        loadNotifications();
      };

      ws.onclose = () => {
        if (!isDisposed) {
          reconnectTimer = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      isDisposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, [loadNotifications]);

  const displayName = userName || user?.full_name || 'Usuário';
  const displayEmail = userEmail || user?.email || 'email@example.com';

  const handleLogout = () => {
    AuthService.logout();
    window.location.href = '/login';
  };

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const formatRelativeTime = (value: string) => {
    const created = new Date(value).getTime();
    const now = Date.now();
    const diffMs = Math.max(now - created, 0);
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `Ha ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Ha ${hours} hora${hours > 1 ? 's' : ''}`;
    const days = Math.floor(hours / 24);
    return `Ha ${days} dia${days > 1 ? 's' : ''}`;
  };

  return (
    <header 
      className="h-20 bg-background border-b border-border flex items-center justify-between pr-6 sticky top-0 z-30"
    >
      {/* Espaço Esquerdo */}
      <div className="flex-1" />

      {/* Ações Direita */}
      <div className="flex items-center gap-6">
        {/* Notificações */}
        <button
          className="relative p-2 hover:bg-muted rounded-none transition-colors group"
          onMouseEnter={loadNotifications}
        >
          <Bell className="w-5 h-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          )}
          <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-none shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4">
            <p className="text-sm font-medium text-foreground mb-3">Notificações</p>
            <div className="space-y-2">
              {isLoadingNotifications && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded-none">
                  Carregando...
                </div>
              )}
              {!isLoadingNotifications && notifications.length === 0 && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded-none">
                  Nenhuma notificacao ainda.
                </div>
              )}
              {!isLoadingNotifications && notifications.map((item) => (
                <div
                  key={item.id}
                  className="text-xs text-muted-foreground p-2 bg-muted rounded-none"
                >
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p>{item.message}</p>
                  <p>{formatRelativeTime(item.created_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </button>

        {/* Perfil */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-2 hover:bg-muted rounded-none transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 bg-foreground text-background rounded-none font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">{displayEmail}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Perfil */}
          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-none shadow-lg">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
              </div>
              <nav className="py-2">
                <button
                  onClick={() => {
                    setLocation('/profile');
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User className="w-4 h-4" />
                  Meu Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors border-t border-border"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
