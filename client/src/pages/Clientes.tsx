import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Página Clientes - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Listagem e gerenciamento de clientes
 */

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  empresa?: string;
  dataRegistro: string;
}

const clientesDemo: Cliente[] = [
  {
    id: '1',
    nome: 'Ana Silva',
    email: 'ana.silva@empresa.com',
    telefone: '(11) 98765-4321',
    empresa: 'Silva & Associados',
    dataRegistro: '2024-01-15',
  },
  {
    id: '2',
    nome: 'Carlos Santos',
    email: 'carlos@empresa.com',
    telefone: '(11) 99876-5432',
    empresa: 'Santos Consultoria',
    dataRegistro: '2024-01-20',
  },
  {
    id: '3',
    nome: 'Marina Costa',
    email: 'marina@empresa.com',
    telefone: '(11) 97654-3210',
    empresa: 'Costa Advogados',
    dataRegistro: '2024-02-01',
  },
];

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>(clientesDemo);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);

  const filteredClientes = clientes.filter(
    (cliente) =>
      cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Clientes</h1>
        <p className="text-muted-foreground">Gerencie todos os seus clientes em um único lugar</p>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-refined pl-10"
          />
        </div>

        {/* Botão Novo Cliente */}
        <Button
          onClick={() => setShowNewClientForm(!showNewClientForm)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Formulário Novo Cliente */}
      {showNewClientForm && (
        <div className="card-refined mb-8 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Adicionar Novo Cliente</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nome completo"
              className="input-refined"
            />
            <input
              type="email"
              placeholder="Email"
              className="input-refined"
            />
            <input
              type="tel"
              placeholder="Telefone"
              className="input-refined"
            />
            <input
              type="text"
              placeholder="Empresa"
              className="input-refined"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setShowNewClientForm(false)}
              className="btn-outline"
            >
              Cancelar
            </Button>
            <Button className="btn-primary">Salvar Cliente</Button>
          </div>
        </div>
      )}

      {/* Tabela de Clientes */}
      <div className="card-refined overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Nome</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden sm:table-cell">Email</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden md:table-cell">Telefone</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden lg:table-cell">Empresa</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.length > 0 ? (
                filteredClientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{cliente.nome}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{cliente.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground hidden sm:table-cell">
                      <a href={`mailto:${cliente.email}`} className="flex items-center gap-2 hover:text-accent">
                        <Mail className="w-4 h-4" />
                        {cliente.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground hidden md:table-cell">
                      <a href={`tel:${cliente.telefone}`} className="flex items-center gap-2 hover:text-accent">
                        <Phone className="w-4 h-4" />
                        {cliente.telefone}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">
                      {cliente.empresa}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-muted rounded-none transition-colors" title="Editar">
                          <Edit2 className="w-4 h-4 text-foreground" />
                        </button>
                        <button className="p-2 hover:bg-destructive hover:text-destructive-foreground rounded-none transition-colors" title="Deletar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rodapé com Informações */}
      <div className="mt-6 text-sm text-muted-foreground">
        <p>Total de clientes: <span className="font-semibold text-foreground">{filteredClientes.length}</span></p>
      </div>
    </div>
  );
}
