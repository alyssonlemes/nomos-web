import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertCircle, Loader2, ArrowLeft, ChevronsUpDown } from 'lucide-react';
import { LegalActionService, LegalStatus, LegalActionTypeEntity } from '@/services/legal-action.service';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';
import { ClientService, Client } from '@/services/client.service';
import { SelectField } from '../../components/ui/select-field';
import { cn } from '@/lib/utils';

const CLIENT_PAGE_SIZE = 100;

export default function ProcessoNovoPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionTypes, setActionTypes] = useState<LegalActionTypeEntity[]>([]);
  const [statuses, setStatuses] = useState<LegalActionStatus[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [form, setForm] = useState({
    number: '',
    title: '',
    client_id: '',
    action_type_id: '',
    description: '',
    legal_status: LegalStatus.PRE_TRIAL,
    court_name: '',
    filing_date: '',
  });

  useEffect(() => {
    LegalActionService.getLegalActionTypes()
      .then(setActionTypes)
      .catch(() => setActionTypes([]));
  }, []);

  useEffect(() => {
    LegalActionStatusService.getLegalActionStatuses(0, 500)
      .then(({ statuses }) => setStatuses(statuses))
      .catch(() => setStatuses([]));
  }, []);

  const fetchClients = useCallback(async (search: string) => {
    if (!search.trim()) {
      setClients([]);
      setHasSearched(false);
      return;
    }
    setLoadingClients(true);
    setHasSearched(true);
    try {
      const res = await ClientService.getClients(0, CLIENT_PAGE_SIZE, search.trim());
      setClients(res.clients ?? []);
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  const handleClientSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (clientSearch.trim()) {
        fetchClients(clientSearch);
      }
    }
  };

  const handlePopoverOpenChange = (open: boolean) => {
    setClientOpen(open);
    if (!open) {
      // Limpar busca e lista quando fechar
      setClientSearch('');
      setClients([]);
      setHasSearched(false);
    }
  };

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setForm(prev => ({ ...prev, client_id: String(client.id) }));
    setClientOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!form.number || form.number.length < 3) throw new Error('Número deve ter no mínimo 3 caracteres');
      if (!form.title || form.title.length < 3) throw new Error('Título deve ter no mínimo 3 caracteres');
      const clientId = Number(form.client_id);
      if (!clientId || Number.isNaN(clientId)) throw new Error('Selecione um cliente');
      const actionTypeId = Number(form.action_type_id);
      if (!actionTypeId || Number.isNaN(actionTypeId)) throw new Error('Selecione o tipo de ação');

      const payload: Parameters<typeof LegalActionService.createLegalAction>[0] = {
        number: form.number,
        title: form.title,
        client_id: clientId,
        action_type_id: actionTypeId,
        ...(form.description && { description: form.description }),
        ...(form.legal_status && { legal_status: form.legal_status as LegalStatus }),
        ...(form.court_name && { court_name: form.court_name }),
        ...(form.filing_date && { filing_date: form.filing_date }),
      };

      await LegalActionService.createLegalAction(payload);
      setLocation('/legal-actions');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar processo';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/legal-actions')}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Processos
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Novo Processo</h1>
          <p className="text-muted-foreground">Preencha as informações para cadastrar uma nova ação jurídica</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados da Ação</CardTitle>
              <CardDescription>Campos obrigatórios e opcionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="number" className="block text-sm font-medium text-foreground">
                  Número <span className="text-destructive">*</span>
                </label>
                <Input
                  id="number"
                  placeholder="Ex: 0001234-56.2025.8.26.0100"
                  value={form.number}
                  onChange={(e) => handleChange('number', e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={3}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-medium text-foreground">
                  Título <span className="text-destructive">*</span>
                </label>
                <Input
                  id="title"
                  placeholder="Ex: Ação de Cobrança"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Cliente <span className="text-destructive">*</span>
                </label>
                <Popover open={clientOpen} onOpenChange={handlePopoverOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientOpen}
                      disabled={isLoading}
                      className={cn(
                        'w-full justify-between font-normal hover:bg-muted hover:text-foreground',
                        !selectedClient && 'text-muted-foreground'
                      )}
                    >
                      {selectedClient ? selectedClient.name : 'Selecione um cliente'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nome, e-mail ou documento (Enter)"
                        value={clientSearch}
                        onValueChange={(value) => {
                          setClientSearch(value);
                          setHasSearched(false);
                        }}
                        onKeyDown={handleClientSearchKeyDown}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {loadingClients ? 'Carregando...' : hasSearched && clientSearch.trim() ? 'Nenhum cliente encontrado.' : 'Busque por nome, e-mail ou documento e pressione Enter.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {clients.map((client) => (
                            <CommandItem
                              key={client.id}
                              value={String(client.id)}
                              onSelect={() => handleSelectClient(client)}
                            >
                              {client.name}
                              {client.document ? (
                                <span className="ml-2 text-muted-foreground text-xs">{client.document}</span>
                              ) : null}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <SelectField
                id="action_type_id"
                label="Tipo de Ação"
                value={form.action_type_id}
                onChange={(e: { target: { value: string } }) => handleChange('action_type_id', e.target.value)}
                disabled={isLoading}
                required
                options={actionTypes.map((t) => ({
                  value: String(t.id),
                  label: t.name || t.code,
                }))}
              />

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-foreground">Descrição</label>
                <Textarea
                  id="description"
                  placeholder="Descrição opcional"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField
                  id="legal_status"
                  label="Status Jurídico"
                  value={form.legal_status}
                  onChange={(e: { target: { value: string } }) => handleChange('legal_status', e.target.value)}
                  disabled={isLoading}
                  options={[
                    // Evita duplicar o código "pre_trial": só adiciona o padrão
                    // se ainda não existir um status com esse código vindo da API.
                    ...(!statuses.some((status) => status.code === LegalStatus.PRE_TRIAL)
                      ? [{ value: LegalStatus.PRE_TRIAL, label: 'Pendente (pré-configurado)' }]
                      : []),
                    ...statuses.map((status) => ({
                      value: status.code,
                      label: status.name || status.code,
                    })),
                  ]}
                />

                <div className="space-y-2">
                  <label htmlFor="court_name" className="block text-sm font-medium text-foreground">Nome do Fórum</label>
                  <Input
                    id="court_name"
                    placeholder="Ex: Fórum X"
                    value={form.court_name}
                    onChange={(e) => handleChange('court_name', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="filing_date" className="block text-sm font-medium text-foreground">Data de Distribuição</label>
                <Input
                  id="filing_date"
                  type="date"
                  value={form.filing_date}
                  onChange={(e) => handleChange('filing_date', e.target.value)}
                  disabled={isLoading}
                />
              </div>

            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/legal-actions')}
              disabled={isLoading}
              className="hover:bg-accent hover:text-accent-foreground"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Criar Processo'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
