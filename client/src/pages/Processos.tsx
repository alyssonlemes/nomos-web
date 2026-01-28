import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Página Processos - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Listagem e gerenciamento de processos jurídicos
 */

interface Processo {
  id: string;
  numero: string;
  cliente: string;
  assunto: string;
  status: 'ativo' | 'pausado' | 'concluído';
  dataInicio: string;
  dataVencimento: string;
}

const processosDemo: Processo[] = [
  {
    id: '1',
    numero: '0000001-23.2024.1.23.4567',
    cliente: 'Ana Silva',
    assunto: 'Ação Trabalhista',
    status: 'ativo',
    dataInicio: '2024-01-15',
    dataVencimento: '2024-06-15',
  },
  {
    id: '2',
    numero: '0000002-23.2024.1.23.4567',
    cliente: 'Carlos Santos',
    assunto: 'Contrato Comercial',
    status: 'ativo',
    dataInicio: '2024-01-20',
    dataVencimento: '2024-07-20',
  },
  {
    id: '3',
    numero: '0000003-23.2024.1.23.4567',
    cliente: 'Marina Costa',
    assunto: 'Divórcio',
    status: 'pausado',
    dataInicio: '2024-02-01',
    dataVencimento: '2024-08-01',
  },
];

const statusColors = {
  ativo: 'bg-green-100 text-green-800',
  pausado: 'bg-yellow-100 text-yellow-800',
  concluído: 'bg-gray-100 text-gray-800',
};

const statusLabels = {
  ativo: 'Ativo',
  pausado: 'Pausado',
  concluído: 'Concluído',
};

export default function ProcessosPage() {
  const [processos, setProcessos] = useState<Processo[]>(processosDemo);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewProcessoForm, setShowNewProcessoForm] = useState(false);

  const filteredProcessos = processos.filter(
    (processo) =>
      processo.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      processo.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      processo.assunto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Processos</h1>
        <p className="text-muted-foreground">Acompanhe todos os processos jurídicos em andamento</p>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por número, cliente ou assunto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-refined pl-10"
          />
        </div>

        {/* Botão Novo Processo */}
        <Button
          onClick={() => setShowNewProcessoForm(!showNewProcessoForm)}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Novo Processo
        </Button>
      </div>

      {/* Formulário Novo Processo */}
      {showNewProcessoForm && (
        <div className="card-refined mb-8 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Adicionar Novo Processo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Número do processo"
              className="input-refined"
            />
            <input
              type="text"
              placeholder="Cliente"
              className="input-refined"
            />
            <input
              type="text"
              placeholder="Assunto"
              className="input-refined"
            />
            <select className="input-refined">
              <option>Selecione o status</option>
              <option>Ativo</option>
              <option>Pausado</option>
              <option>Concluído</option>
            </select>
            <input
              type="date"
              placeholder="Data de início"
              className="input-refined"
            />
            <input
              type="date"
              placeholder="Data de vencimento"
              className="input-refined"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setShowNewProcessoForm(false)}
              className="btn-outline"
            >
              Cancelar
            </Button>
            <Button className="btn-primary">Salvar Processo</Button>
          </div>
        </div>
      )}

      {/* Tabela de Processos */}
      <div className="card-refined overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Número</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden sm:table-cell">Cliente</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden md:table-cell">Assunto</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground hidden lg:table-cell">Vencimento</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProcessos.length > 0 ? (
                filteredProcessos.map((processo) => (
                  <tr key={processo.id} className="border-b border-border hover:bg-muted transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-mono text-sm font-medium text-foreground">{processo.numero}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{processo.cliente}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground hidden sm:table-cell">
                      {processo.cliente}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground hidden md:table-cell">
                      {processo.assunto}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-none text-xs font-medium ${statusColors[processo.status]}`}>
                        <Tag className="w-3 h-3" />
                        {statusLabels[processo.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatarData(processo.dataVencimento)}
                      </div>
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
                  <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                    Nenhum processo encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rodapé com Informações */}
      <div className="mt-6 text-sm text-muted-foreground space-y-1">
        <p>Total de processos: <span className="font-semibold text-foreground">{filteredProcessos.length}</span></p>
        <p>Processos ativos: <span className="font-semibold text-foreground">{filteredProcessos.filter(p => p.status === 'ativo').length}</span></p>
      </div>
    </div>
  );
}
