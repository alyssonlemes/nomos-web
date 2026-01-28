import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ClientesPage from './Clientes';
import ProcessosPage from './Processos';

/**
 * Página Dashboard - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Layout principal com sidebar e topbar
 */

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState('clientes');

  const renderContent = () => {
    switch (activeSection) {
      case 'clientes':
        return <ClientesPage />;
      case 'processos':
        return <ProcessosPage />;
      default:
        return <ClientesPage />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar activeItem={activeSection} onNavigate={setActiveSection} />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TopBar */}
        <TopBar userName="João Silva" userEmail="joao@escritorio.com" />

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
