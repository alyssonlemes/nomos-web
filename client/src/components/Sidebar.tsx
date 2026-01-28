import { useState } from 'react';
import { Menu, X, ChevronDown, Users, FileText, Settings, LogOut, Home, Grid3x3 } from 'lucide-react';

/**
 * Componente Sidebar - Nomos
 * Design: Minimalismo Corporativo Refinado com Pills/Badges
 * Menu lateral com navegação em formato de pills e submenus expansíveis
 */

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  submenu?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  href: string;
}

interface SidebarProps {
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

export default function Sidebar({ activeItem = 'clientes', onNavigate }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['clientes']);

  const menuItems: MenuItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Grid3x3 className="w-5 h-5" />,
      href: '/dashboard',
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <Users className="w-5 h-5" />,
      href: '/dashboard/clientes',
      submenu: [
        { id: 'clientes-lista', label: 'Lista de Clientes', href: '/dashboard/clientes' },
        { id: 'clientes-novo', label: 'Novo Cliente', href: '/dashboard/clientes/novo' },
      ],
    },
    {
      id: 'processos',
      label: 'Processos',
      icon: <FileText className="w-5 h-5" />,
      href: '/dashboard/processos',
      submenu: [
        { id: 'processos-lista', label: 'Lista de Processos', href: '/dashboard/processos' },
        { id: 'processos-novo', label: 'Novo Processo', href: '/dashboard/processos/novo' },
      ],
    },
  ];

  const secondaryMenuItems: MenuItem[] = [
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: <Settings className="w-5 h-5" />,
      href: '/dashboard/configuracoes',
    },
    {
      id: 'sair',
      label: 'Sair',
      icon: <LogOut className="w-5 h-5" />,
      href: '/login',
    },
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleNavigate = (itemId: string) => {
    onNavigate?.(itemId);
    setIsMobileOpen(false);
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  return (
    <>
      {/* Botão Menu Mobile */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 hover:bg-muted rounded-none transition-colors"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay Mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative top-0 left-0 h-screen z-40
          bg-sidebar border-r border-sidebar-border
          transition-all duration-300 ease-in-out
          ${isOpen ? 'w-72' : 'w-24'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-sidebar-border flex-shrink-0">
          {isOpen && (
            <h1 className="text-2xl font-bold text-sidebar-foreground">Nomos</h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:block p-1 hover:bg-sidebar-accent rounded-none transition-colors"
            title={isOpen ? 'Recolher' : 'Expandir'}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Principal */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          {menuItems.map((item) => {
            const isActive = activeItem === item.id;
            const isExpanded = isMenuExpanded(item.id);
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasSubmenu) {
                      toggleMenu(item.id);
                    } else {
                      handleNavigate(item.id);
                    }
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 font-medium text-sm
                    ${
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border-l-4 border-sidebar-primary'
                        : 'text-sidebar-foreground hover:bg-muted'
                    }
                    ${!isOpen && 'justify-center px-0'}
                  `}
                  title={!isOpen ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {isOpen && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {hasSubmenu && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu */}
                {isOpen && hasSubmenu && isExpanded && item.submenu && (
                  <div className="mt-2 ml-4 space-y-2 border-l-2 border-sidebar-border pl-3">
                    {item.submenu!.map((subitem) => (
                      <a
                        key={subitem.id}
                        href={subitem.href}
                        onClick={(e) => {
                          e.preventDefault();
                          handleNavigate(subitem.id);
                        }}
                        className="
                          block px-3 py-2 text-xs font-medium
                          text-sidebar-foreground hover:text-sidebar-accent-foreground
                          hover:bg-muted rounded-md transition-colors
                        "
                      >
                        {subitem.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Menu Secundário */}
        <div className="border-t border-sidebar-border px-4 py-4 space-y-3 flex-shrink-0">
          {secondaryMenuItems.map((item) => {
            const isDanger = item.id === 'sair';

            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 font-medium text-sm
                  ${
                    isDanger
                      ? 'text-destructive hover:bg-destructive hover:text-destructive-foreground'
                      : 'text-sidebar-foreground hover:bg-muted'
                  }
                  ${!isOpen && 'justify-center px-0'}
                `}
                title={!isOpen ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isOpen && <span className="flex-1 text-left">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Espaçador para layout com sidebar fixa */}
      <div className={`hidden lg:block ${isOpen ? 'w-72' : 'w-24'} transition-all duration-300`} />
    </>
  );
}
