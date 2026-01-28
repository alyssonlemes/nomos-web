import { Bell, User, ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * Componente TopBar - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Barra superior com notificações e perfil do usuário
 */

interface TopBarProps {
  userName?: string;
  userEmail?: string;
}

export default function TopBar({ userName = 'João Silva', userEmail = 'joao@exemplo.com' }: TopBarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="h-20 bg-background border-b border-border flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Espaço Esquerdo - Pode ser usado para título da página */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
      </div>

      {/* Ações Direita */}
      <div className="flex items-center gap-6">
        {/* Notificações */}
        <button className="relative p-2 hover:bg-muted rounded-none transition-colors group">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          <div className="absolute top-full right-0 mt-2 w-64 bg-card border border-border rounded-none shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 p-4">
            <p className="text-sm font-medium text-foreground mb-3">Notificações</p>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded-none">
                <p className="font-medium">Novo processo criado</p>
                <p>Há 2 minutos</p>
              </div>
              <div className="text-xs text-muted-foreground p-2 bg-muted rounded-none">
                <p className="font-medium">Prazo próximo</p>
                <p>Há 1 hora</p>
              </div>
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
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Perfil */}
          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-none shadow-lg">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <nav className="py-2">
                <a
                  href="#"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User className="w-4 h-4" />
                  Meu Perfil
                </a>
                <a
                  href="#"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors border-t border-border"
                >
                  Sair
                </a>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
