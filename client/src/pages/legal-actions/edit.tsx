import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { AlertCircle, Loader2, ArrowLeft, ChevronsUpDown } from 'lucide-react';
import { LegalActionService, LegalAction, LegalStatus, LegalActionTypeEntity } from '@/services/legal-action.service';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';
import { ClientService, Client } from '@/services/client.service';
import { SelectField } from '@/components/ui/select-field';
import { cn } from '@/lib/utils';

const CLIENT_PAGE_SIZE = 100;

export default function ProcessoEditPage() {
  const [, params] = useRoute('/legal-actions/:id/editar');
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<LegalAction | null>(null);
  const [actionTypes, setActionTypes] = useState<LegalActionTypeEntity[]>([]);
  const [statuses, setStatuses] = useState<LegalActionStatus[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    client_id: '',
    action_type_id: '',
    legal_status: 'pre_trial' as LegalStatus,
    court_name: '',
    filing_date: '',
    closing_date: '',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const actionId = params?.id ? parseInt(params.id) : null;

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

  useEffect(() => {
    if (actionId) {
      loadAction(actionId);
    }
  }, [actionId]);

  const loadAction = async (id: number) => {
    try {
      setIsLoadingAction(true);
      setError('');
      const data = await LegalActionService.getLegalActionById(id);
      setAction(data);

      // A API pode retornar legal_status como string (código) ou como objeto.
      const rawLegalStatus: any = (data as any).legal_status;
      const legalStatusCode: LegalStatus =
        (typeof rawLegalStatus === 'string'
          ? rawLegalStatus
          : rawLegalStatus?.code) || LegalStatus.PRE_TRIAL;

      // Preencher formulário com dados atuais
      setForm({
        title: data.title || '',
        description: data.description || '',
        client_id: String(data.client_id ?? ''),
        action_type_id: String(data.action_type_id ?? ''),
        legal_status: legalStatusCode,
        court_name: data.court_name || '',
        filing_date: data.filing_date ? data.filing_date.split('T')[0] : '',
        closing_date: data.closing_date ? data.closing_date.split('T')[0] : '',
      });

      // A API retorna só client_id; buscar cliente para exibir o nome
      if (data.client_id) {
        try {
          const client = await ClientService.getClientById(data.client_id);
          setSelectedClient(client);
        } catch {
          setSelectedClient({
            id: data.client_id,
            name: '',
            email: '',
            created_at: data.created_at ?? '',
          } as Client);
        }
      } else {
        setSelectedClient(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar processo';
      setError(errorMessage);
    } finally {
      setIsLoadingAction(false);
    }
  };

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
      setClientSearch('');
      setClients([]);
      setHasSearched(false);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setForm(prev => ({ ...prev, client_id: String(client.id) }));
    setClientOpen(false);
  };

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!actionId) {
      setError('ID do processo inválido');
      setIsLoading(false);
      return;
    }

    try {
      // Validações
      if (!form.title || form.title.length < 3) {
        throw new Error('Título deve ter no mínimo 3 caracteres');
      }

      // Preparar dados para atualização (apenas campos permitidos)
      const payload: any = {};

      if (form.title !== action?.title) {
        payload.title = form.title;
      }
      if (form.description !== (action?.description || '')) {
        payload.description = form.description || null;
      }
      const formActionTypeId = form.action_type_id ? parseInt(form.action_type_id, 10) : undefined;
      if (formActionTypeId !== undefined && formActionTypeId !== action?.action_type_id) {
        payload.action_type_id = formActionTypeId;
      }
      if (form.legal_status !== action?.legal_status) {
        payload.legal_status = form.legal_status;
      }
      if (form.court_name !== (action?.court_name || '')) {
        payload.court_name = form.court_name || null;
      }
      if (form.filing_date !== (action?.filing_date ? action.filing_date.split('T')[0] : '')) {
        payload.filing_date = form.filing_date || null;
      }
      if (form.closing_date !== (action?.closing_date ? action.closing_date.split('T')[0] : '')) {
        payload.closing_date = form.closing_date || null;
      }
      const newClientId = form.client_id ? parseInt(form.client_id, 10) : undefined;
      if (newClientId && newClientId !== action?.client_id) {
        payload.client_id = newClientId;
      }

      // Se nenhum campo foi alterado
      if (Object.keys(payload).length === 0) {
        setLocation('/legal-actions');
        return;
      }

      await LegalActionService.updateLegalAction(actionId, payload);
      setLocation('/legal-actions');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar processo';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (isLoadingAction) {
    return (
      <div className="p-8 min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!action) {
    return (
      <div className="p-8 min-h-full">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Processo não encontrado</AlertDescription>
          </Alert>
          <Button onClick={() => setLocation('/legal-actions')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Processos
          </Button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Editar Processo</h1>
          <p className="text-muted-foreground">
            Atualize as informações da ação jurídica {action.number}
          </p>
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
              <CardDescription>Campos editáveis da ação jurídica</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="number" className="block text-sm font-medium text-foreground">
                  Número
                </label>
                <Input
                  id="number"
                  value={action.number}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">O número não pode ser alterado</p>
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
                  Cliente
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
                        !selectedClient?.name && 'text-muted-foreground'
                      )}
                    >
                      {selectedClient?.name ?? 'Selecione um cliente'}
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
                  onChange={(e) => handleChange('legal_status', e.target.value as LegalStatus)}
                  disabled={isLoading}
                  options={[
                    // Garante que o status padrão continue disponível mesmo
                    // se não houver mais um registro com esse código na API.
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                <div className="space-y-2">
                  <label htmlFor="closing_date" className="block text-sm font-medium text-foreground">Data de Encerramento</label>
                  <Input
                    id="closing_date"
                    type="date"
                    value={form.closing_date}
                    onChange={(e) => handleChange('closing_date', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/legal-actions')}
              disabled={isLoading}
              className="hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
