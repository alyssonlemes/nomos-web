import { useState } from "react";
import { useLocation } from "wouter";
import {
  Menu,
  X,
  ChevronDown,
  Users,
  FileText,
  Settings,
  LogOut,
  Grid3x3,
  UserCog,
  Bot,
  Calendar,
  CheckSquare,
} from "lucide-react";
import { AuthService } from "@/services/auth.service";
import { UserRole, getCurrentRole } from "@/lib/rbac";

/**
 * Componente Sidebar - Nomos
 * Design: Minimalismo Corporativo Refinado com Pills/Badges
 * Menu lateral com navegação em formato de pills e submenus expansíveis
 */

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  allowedRoles?: UserRole[];
  href?: string;
  submenu?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  href: string;
}

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["clientes"]);
  const currentRole = getCurrentRole();

  const menuItems: MenuItem[] = [
    {
      id: "home",
      label: "Home",
      icon: <Grid3x3 className="w-5 h-5" />,
      allowedRoles: ["ADMIN", "OWNER", "MEMBER", "VIEWER", "ASSISTANT"],
      href: "/home",
    },
    {
      id: "clientes",
      label: "Clientes",
      icon: <Users className="w-5 h-5" />,
      allowedRoles: ["ADMIN", "OWNER", "MEMBER", "VIEWER", "ASSISTANT"],
      href: "/clientes",
      submenu: [
        { id: "clientes-lista", label: "Lista de Clientes", href: "/clientes" },
      ],
    },
    {
      id: "jurimetria",
      label: "Jurimetria",
      icon: <Bot className="w-5 h-5" />,
      allowedRoles: ["ADMIN", "OWNER", "MEMBER", "VIEWER"],
      href: "/jurimetria",
    },
    {
      id: "processos",
      label: "Processos",
      icon: <FileText className="w-5 h-5" />,
      allowedRoles: ["ADMIN", "OWNER", "MEMBER", "VIEWER"],
      href: "/legal-actions",
      submenu: [
        {
          id: "processos-lista",
          label: "Lista de Processos",
          href: "/legal-actions",
        },
        {
          id: "tipos-acoes",
          label: "Tipos de Ações",
          href: "/legal-action-types",
        },
        {
          id: "status-acoes",
          label: "Status de Ações",
          href: "/legal-action-statuses",
        },
      ],
    },
    {
      id: "meetings",
      label: "Reuniões",
      icon: <Calendar className="w-5 h-5" />,
      allowedRoles: ["ADMIN", "OWNER", "MEMBER", "VIEWER", "ASSISTANT"],
      href: "/meetings",
      submenu: [
        { id: "meetings-list", label: "Minhas Reuniões", href: "/meetings" },
      ],
    },
    {
      id: "activities",
      label: "Atividades",
      icon: <CheckSquare className="w-5 h-5" />,
      allowedRoles: ["ADMIN", "OWNER", "MEMBER", "VIEWER", "ASSISTANT"],
      href: "/activities",
      submenu: [
        { id: "activities-list", label: "Meu Kanban", href: "/activities" },
      ],
    },
    {
      id: "usuarios",
      label: "Usuários",
      icon: <UserCog className="w-5 h-5" />,
      allowedRoles: ["ADMIN", "OWNER", "MEMBER"],
      href: "/usuarios",
      submenu: [
        {
          id: "usuarios-lista",
          label: "Lista de Funcionários",
          href: "/usuarios",
        },
      ],
    },
  ];

  const secondaryMenuItems: MenuItem[] = [
    {
      id: "configuracoes",
      label: "Configurações",
      icon: <Settings className="w-5 h-5" />,
      href: "/configuracoes",
    },
    {
      id: "sair",
      label: "Sair",
      icon: <LogOut className="w-5 h-5" />,
      href: "/login",
    },
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleNavigate = (href: string) => {
    if (href === "/login") {
      AuthService.logout();
    }
    setLocation(href);
    setIsMobileOpen(false);
  };

  const isMenuExpanded = (menuId: string) => expandedMenus.includes(menuId);

  // Determinar o item ativo baseado na localização atual
  const getActiveItem = () => {
    if (location === "/home") return "home";
    if (location.startsWith("/clientes")) return "clientes";
    if (location.startsWith("/meetings")) return "meetings";
    if (location.startsWith("/activities")) return "activities";
    if (location.startsWith("/jurimetria")) return "jurimetria";
    if (
      location.startsWith("/legal-actions") ||
      location.startsWith("/legal-action-types") ||
      location.startsWith("/legal-action-statuses")
    )
      return "processos";
    if (location.startsWith("/usuarios")) return "usuarios";
    if (location.startsWith("/profile")) return "perfil";
    return "";
  };

  const activeItem = getActiveItem();
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.allowedRoles) return true;
    if (!currentRole) return false;
    return item.allowedRoles.includes(currentRole);
  });

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
          ${isOpen ? "w-72" : "w-24"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          flex flex-col overflow-y-auto
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-sidebar-border flex-shrink-0">
          {isOpen && (
            <h1 className="text-2xl font-bold text-sidebar-foreground">
              Nomos
            </h1>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="hidden lg:block p-1 hover:bg-sidebar-accent rounded-none transition-colors"
            title={isOpen ? "Recolher" : "Expandir"}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Principal */}
        <nav className="flex-1 px-4 py-6 space-y-3">
          {visibleMenuItems.map(item => {
            const isActive = activeItem === item.id;
            const isExpanded = isMenuExpanded(item.id);
            const hasSubmenu = item.submenu && item.submenu.length > 0;

            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (hasSubmenu) {
                      toggleMenu(item.id);
                    } else if (item.href) {
                      handleNavigate(item.href);
                    }
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 font-medium text-sm
                    ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm border-l-4 border-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-muted"
                    }
                    ${!isOpen && "justify-center px-0"}
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
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </>
                  )}
                </button>

                {/* Submenu */}
                {isOpen && hasSubmenu && isExpanded && item.submenu && (
                  <div className="mt-2 ml-4 space-y-2 border-l-2 border-sidebar-border pl-3">
                    {item.submenu!.map(subitem => (
                      <button
                        key={subitem.id}
                        onClick={() => handleNavigate(subitem.href)}
                        className="
                          w-full text-left block px-3 py-2 text-xs font-medium
                          text-sidebar-foreground hover:text-sidebar-accent-foreground
                          hover:bg-muted rounded-md transition-colors
                        "
                      >
                        {subitem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Menu Secundário */}
        <div className="border-t border-sidebar-border px-4 py-4 space-y-3 flex-shrink-0">
          {secondaryMenuItems.map(item => {
            const isDanger = item.id === "sair";

            return (
              <button
                key={item.id}
                onClick={() => item.href && handleNavigate(item.href)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 font-medium text-sm
                  ${
                    isDanger
                      ? "text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      : "text-sidebar-foreground hover:bg-muted"
                  }
                  ${!isOpen && "justify-center px-0"}
                `}
                title={!isOpen ? item.label : undefined}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isOpen && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </aside>
    </>
  );
}
