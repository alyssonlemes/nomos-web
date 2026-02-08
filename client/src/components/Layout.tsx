import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Layout principal da aplicação - Nomos
 * Contém Sidebar e TopBar fixos, com conteúdo dinâmico
 */
export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background gap-0">
      {/* Sidebar fixa */}
      <Sidebar />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar fixo */}
        <TopBar />

        {/* Área de conteúdo que muda conforme navegação */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
