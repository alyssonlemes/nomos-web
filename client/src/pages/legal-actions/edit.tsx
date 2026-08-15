import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Loader2, ArrowLeft, ChevronsUpDown, Check, RefreshCw, Database } from 'lucide-react';
import { LegalActionService, LegalAction, LegalStatus, LegalActionTypeEntity, ProcessoMovimentoCreate } from '@/services/legal-action.service';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';
import { ClientService, Client } from '@/services/client.service';
import { UserService, UserResponse } from '@/services/user.service';
import { SelectField } from '@/components/ui/select-field';
import { cn } from '@/lib/utils';
import { MovementsForm } from '@/components/MovementsForm';

const CLIENT_PAGE_SIZE = 100;
const USER_PAGE_SIZE = 200;

type SelectableUser = Pick<UserResponse, 'id' | 'full_name' | 'email'>;

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
    assunto: '',
    orgao_julgador: '',
    valor_causa: '',
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [users, setUsers] = useState<SelectableUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<SelectableUser[]>([]);
  
  const [movimentos, setMovimentos] = useState<ProcessoMovimentoCreate[]>([]);

  const [isConsultingDatajud, setIsConsultingDatajud] = useState(false);
  const [datajudSyncMsg, setDatajudSyncMsg] = useState('');

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

      const rawLegalStatus: any = (data as any).legal_status;
      const legalStatusCode: LegalStatus =
        (typeof rawLegalStatus === 'string'
          ? rawLegalStatus
          : rawLegalStatus?.code) || LegalStatus.PRE_TRIAL;

      let assuntosStr = '';
      if (data.assuntos_json) {
        try {
          const parsed = JSON.parse(data.assuntos_json);
          if (Array.isArray(parsed)) {
            assuntosStr = parsed.map((a: any) => (a.codigo ? `[${a.codigo}] ` : '') + (a.nome || '')).join('; ');
          }
        } catch {
          // ignore
        }
      }

      setForm({
        title: data.title || '',
        description: data.description || '',
        client_id: String(data.client_id ?? ''),
        action_type_id: String(data.action_type_id ?? ''),
        legal_status: legalStatusCode,
        court_name: data.court_name || '',
        filing_date: data.filing_date ? data.filing_date.split('T')[0] : '',
        closing_date: data.closing_date ? data.closing_date.split('T')[0] : '',
        assunto: assuntosStr,
        orgao_julgador: data.orgao_julgador || '',
        valor_causa: data.valor_causa != null ? String(data.valor_causa) : '',
      });

      if (data.movimentos) {
        setMovimentos(data.movimentos.map(m => ({
          codigo: m.codigo,
          nome: m.nome,
          data_hora: m.data_hora,
          complemento_json: m.complemento_json
        })));
      }

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

      if (Array.isArray((data as any).assigned_users) && (data as any).assigned_users.length > 0) {
        setSelectedUsers(
          (data as any).assigned_users.map((user: SelectableUser) => ({
            id: user.id,
            full_name: user.full_name,
            email: user.email,
          }))
        );
      } else if (data.user_id) {
        try {
          const user = await UserService.getUserById(data.user_id);
          setSelectedUsers([{ id: user.id, full_name: user.full_name, email: user.email }]);
        } catch {
          setSelectedUsers([]);
        }
      } else {
        setSelectedUsers([]);
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

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await UserService.getUsers(0, USER_PAGE_SIZE);
      setUsers(
        (res.users ?? []).map((user) => ({
          id: user.id,
          full_name: user.full_name,
          email: user.email,
        }))
      );
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
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

  const handleUsersOpenChange = (open: boolean) => {
    setUserOpen(open);
    if (open && users.length === 0) {
      fetchUsers();
    }
    if (!open) {
      setUserSearch('');
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setForm(prev => ({ ...prev, client_id: String(client.id) }));
    setClientOpen(false);
  };

  const toggleUserSelection = (user: SelectableUser) => {
    setSelectedUsers((prev) => {
      const exists = prev.some((item) => item.id === user.id);
      if (exists) {
        return prev.filter((item) => item.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const getUserLabel = (user: SelectableUser) => user.full_name || user.email;

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
      if (!form.title || form.title.length < 3) {
        throw new Error('Título deve ter no mínimo 3 caracteres');
      }
      
      const clientId = form.client_id ? parseInt(form.client_id, 10) : undefined;
      const actionTypeId = form.action_type_id ? parseInt(form.action_type_id, 10) : undefined;

      const payload: Parameters<typeof LegalActionService.updateLegalAction>[1] = {
        number: form.number,
        title: form.title,
        client_id: clientId,
        action_type_id: actionTypeId,
        user_ids: selectedUsers.map((u) => u.id),
        description: form.description || undefined,
        legal_status: form.legal_status as LegalStatus,
        court_name: form.court_name || undefined,
        filing_date: form.filing_date || undefined,
        orgao_julgador: form.orgao_julgador || undefined,
        valor_causa: form.valor_causa ? Number(form.valor_causa) : undefined,
        assuntos_json: form.assunto
          ? JSON.stringify([{ codigo: '', nome: form.assunto }])
          : undefined,
        movimentos: movimentos.length > 0 ? movimentos : undefined,
      };

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

          {/* ── DataJud Sync Info ──────────────────────────────────────── */}
          {action && (action as any).datajud_synced_at && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Sincronizado via DataJud</span>
                    <span className="text-xs text-muted-foreground">
                      em {new Date((action as any).datajud_synced_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    id="btn-re-sincronizar-datajud"
                    disabled={isConsultingDatajud || isLoading}
                    onClick={async () => {
                      setIsConsultingDatajud(true);
                      setDatajudSyncMsg('');
                      try {
                        await LegalActionService.autoCompleteByCNJ(action.number);
                        setDatajudSyncMsg('Dados consultados. Recarregue para ver as atualizações.');
                        loadAction(actionId!);
                      } catch (err) {
                        setDatajudSyncMsg(err instanceof Error ? err.message : 'Erro ao consultar DataJud');
                      } finally {
                        setIsConsultingDatajud(false);
                      }
                    }}
                    className="text-xs"
                  >
                    {isConsultingDatajud ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    Re-sincronizar DataJud
                  </Button>
                </div>
                {datajudSyncMsg && (
                  <p className="text-xs mt-1 text-muted-foreground">{datajudSyncMsg}</p>
                )}
              </CardHeader>
            </Card>
          )}

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
                  <span className="ml-2 text-xs text-muted-foreground font-normal">(pode ser alterado)</span>
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Usuarios vinculados
                </label>
                <Popover open={userOpen} onOpenChange={handleUsersOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={userOpen}
                      disabled={isLoading}
                      className={cn(
                        'w-full justify-between font-normal hover:bg-muted hover:text-foreground',
                        selectedUsers.length === 0 && 'text-muted-foreground'
                      )}
                    >
                      {selectedUsers.length === 0
                        ? 'Selecione usuarios'
                        : selectedUsers.length === 1
                          ? getUserLabel(selectedUsers[0])
                          : `${selectedUsers.length} usuarios selecionados`}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar por nome ou e-mail"
                        value={userSearch}
                        onValueChange={setUserSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {loadingUsers
                            ? 'Carregando...'
                            : 'Nenhum usuario encontrado.'}
                        </CommandEmpty>
                        <CommandGroup>
                          {users
                            .filter((user) => {
                              const term = userSearch.trim().toLowerCase();
                              if (!term) return true;
                              return [user.full_name, user.email]
                                .filter(Boolean)
                                .some((value) => value!.toLowerCase().includes(term));
                            })
                            .map((user) => {
                              const isSelected = selectedUsers.some((item) => item.id === user.id);
                              return (
                                <CommandItem
                                  key={user.id}
                                  value={String(user.id)}
                                  onSelect={() => toggleUserSelection(user)}
                                >
                                  <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                                  <span>{getUserLabel(user)}</span>
                                  {user.full_name ? (
                                    <span className="ml-2 text-muted-foreground text-xs">{user.email}</span>
                                  ) : null}
                                </CommandItem>
                              );
                            })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <Badge key={user.id} variant="secondary">
                        {getUserLabel(user)}
                      </Badge>
                    ))}
                  </div>
                )}
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

              <div className="space-y-2">
                <label htmlFor="assunto" className="block text-sm font-medium text-foreground">Assunto(s) do Processo</label>
                <Input
                  id="assunto"
                  placeholder="Ex: IRPJ/Imposto de Renda"
                  value={form.assunto}
                  onChange={(e) => handleChange('assunto', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="orgao_julgador" className="block text-sm font-medium text-foreground">Órgão Julgador</label>
                  <Input
                    id="orgao_julgador"
                    placeholder="Ex: Gab. 09 / 1ª Vara Cível"
                    value={form.orgao_julgador}
                    onChange={(e) => handleChange('orgao_julgador', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="valor_causa" className="block text-sm font-medium text-foreground">Valor da Causa (R$)</label>
                  <Input
                    id="valor_causa"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 50000.00"
                    value={form.valor_causa}
                    onChange={(e) => handleChange('valor_causa', e.target.value)}
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

          {/* ── Movements (Always visible) ──────────────────── */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">
                Movements
                {movimentos.length > 0 && (
                  <Badge variant="secondary" className="ml-2 font-mono">
                    {movimentos.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Historical movements synchronized via DataJud or added manually</CardDescription>
            </CardHeader>
            <CardContent>
              <MovementsForm 
                movements={movimentos}
                onChange={setMovimentos}
                disabled={isLoading}
              />
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
