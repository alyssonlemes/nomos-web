import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  ChevronsUpDown,
  Check,
  Search,
  Info,
  UserPlus,
  Shield,
  History as HistoryIcon,
} from 'lucide-react';
import {
  LegalActionService,
  LegalStatus,
  LegalActionTypeEntity,
  DataJudAutoCompleteResponse,
  DataJudParteSugestao,
} from '@/services/legal-action.service';
import { LegalActionStatusService, LegalActionStatus } from '@/services/legal-action-status.service';
import { ClientService, Client, CreateClientData } from '@/services/client.service';
import { UserService, UserResponse } from '@/services/user.service';
import { SelectField } from '../../components/ui/select-field';
import { cn } from '@/lib/utils';
import { MovementsForm } from '@/components/MovementsForm';
import { AssuntosForm, AssuntoItem } from '@/components/AssuntosForm';
import { PartesForm } from '@/components/PartesForm';
import { ProcessoMovimentoCreate, ProcessoParteCreate } from '@/services/legal-action.service';
import { toast } from 'sonner';

const CLIENT_PAGE_SIZE = 100;
const USER_PAGE_SIZE = 200;

type SelectableUser = Pick<UserResponse, 'id' | 'full_name' | 'email'>;

interface PendingClientCreation {
  parte: DataJudParteSugestao;
  creating: boolean;
  created: boolean;
  createdClientId?: number;
  error?: string;
}

export default function ProcessoNovoPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [actionTypes, setActionTypes] = useState<LegalActionTypeEntity[]>([]);
  const [statuses, setStatuses] = useState<LegalActionStatus[]>([]);
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

  // ─── DataJud Auto-Complete ────────────────────────────────────────────────
  const [isConsulting, setIsConsulting] = useState(false);
  const [datajudResult, setDatajudResult] = useState<DataJudAutoCompleteResponse | null>(null);
  const [datajudWarning, setDatajudWarning] = useState('');
  const [datajudError, setDatajudError] = useState('');

  // Modal de confirmação para partes não cadastradas
  const [showPartesModal, setShowPartesModal] = useState(false);
  const [pendingPartes, setPendingPartes] = useState<PendingClientCreation[]>([]);
  const [movimentos, setMovimentos] = useState<ProcessoMovimentoCreate[]>([]);
  const [assuntos, setAssuntos] = useState<AssuntoItem[]>([]);
  const [partes, setPartes] = useState<ProcessoParteCreate[]>([]);

  const [form, setForm] = useState({
    number: '',
    title: '',
    client_id: '',
    action_type_id: '',
    description: '',
    legal_status: LegalStatus.PRE_TRIAL,
    court_name: '',
    filing_date: '',
    orgao_julgador: '',
    valor_causa: '',
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

  useEffect(() => {
    const me = UserService.getStoredUser();
    if (me) {
      setSelectedUsers([{ id: me.id, full_name: me.full_name, email: me.email }]);
    }
  }, []);

  // ─── Auto-Complete: consultar DataJud ────────────────────────────────────

  const handleConsultarDataJud = useCallback(async () => {
    const numeroCNJ = form.number.trim();
    if (!numeroCNJ || numeroCNJ.length < 20) {
      setDatajudError('Informe o número CNJ completo antes de consultar (mín. 20 dígitos).');
      return;
    }

    setIsConsulting(true);
    setDatajudError('');
    setDatajudWarning('');
    setDatajudResult(null);

    try {
      const result = await LegalActionService.autoCompleteByCNJ(numeroCNJ);
      setDatajudResult(result);

      if (!result.processo_encontrado) {
        setDatajudError(result.aviso || 'Processo não encontrado no DataJud para este número CNJ.');
        return;
      }

      if (result.aviso) {
        setDatajudWarning(result.aviso);
      }

      // Pre-fill do formulário com dados do DataJud
      const dados = result.dados;
      if (dados) {
        if (dados.assuntos) {
          setAssuntos(dados.assuntos.map((a: any) => ({ codigo: a.codigo, nome: a.nome || '' })));
        }
        setForm((prev) => ({
          ...prev,
          title: prev.title || dados.classe_processual_nome || dados.orgao_julgador || numeroCNJ,
          court_name: prev.court_name || dados.court_name || dados.orgao_julgador || '',
          filing_date: prev.filing_date || (dados.data_ajuizamento?.split('T')[0] ?? ''),
          orgao_julgador: prev.orgao_julgador || dados.orgao_julgador || '',
          valor_causa: prev.valor_causa || (dados.valor_causa ? String(dados.valor_causa) : ''),
        }));

        if (dados.movimentos) {
          setMovimentos(dados.movimentos.map(m => ({
            codigo: m.codigo,
            nome: m.nome,
            data_hora: m.data_hora,
            complemento_json: m.complemento ? JSON.stringify(m.complemento) : null
          })));
        }
      }

      // Partes já cadastradas → pre-selecionar o primeiro cliente encontrado (polo ativo)
      if (result.partes_encontradas.length > 0) {
        const partePrincipal = result.partes_encontradas.find(p => p.polo === 'ativo') ?? result.partes_encontradas[0];
        if (partePrincipal && !form.client_id) {
          setForm(prev => ({ ...prev, client_id: String(partePrincipal.client_id) }));
          // Buscar cliente para exibir nome
          try {
            const cli = await ClientService.getClientById(partePrincipal.client_id);
            setSelectedClient(cli);
          } catch {
            // ignore
          }
        }
      }

      // Partes não cadastradas → abrir modal de confirmação
      if (result.partes_nao_encontradas.length > 0) {
        setPendingPartes(
          result.partes_nao_encontradas.map(p => ({
            parte: p,
            creating: false,
            created: false,
          }))
        );
        setShowPartesModal(true);
      }
    } catch (err) {
      const e = err as Error & { status?: number };
      if (e.status === 429) {
        setDatajudError('Limite de requisições atingido. Aguarde alguns segundos e tente novamente.');
      } else if (e.status === 422) {
        setDatajudError(e.message || 'Número CNJ inválido ou tribunal não suportado.');
      } else {
        setDatajudError(e.message || 'Erro ao consultar DataJud. Verifique a conexão e tente novamente.');
      }
    } finally {
      setIsConsulting(false);
    }
  }, [form.number, form.client_id]);

  // ─── Criação de cliente a partir de parte não cadastrada ─────────────────

  const handleCriarCliente = async (index: number) => {
    const entry = pendingPartes[index];
    const { parte } = entry;

    setPendingPartes(prev =>
      prev.map((p, i) => (i === index ? { ...p, creating: true, error: undefined } : p))
    );

    try {
      const clientData: CreateClientData = {
        name: parte.nome,
        document: parte.documento || `SEM_DOC_${Date.now()}`,
        client_type: parte.client_type ?? 'individual',
        status: 'active',
      };

      const novoCliente = await ClientService.createClient(clientData);

      setPendingPartes(prev =>
        prev.map((p, i) =>
          i === index ? { ...p, creating: false, created: true, createdClientId: novoCliente.id } : p
        )
      );

      // Se ainda não há cliente selecionado e é polo ativo, pre-selecionar
      if (!form.client_id && parte.polo === 'ativo') {
        setSelectedClient(novoCliente);
        setForm(prev => ({ ...prev, client_id: String(novoCliente.id) }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar cliente';
      setPendingPartes(prev =>
        prev.map((p, i) => (i === index ? { ...p, creating: false, error: msg } : p))
      );
    }
  };

  // ─── Helpers de formulário ────────────────────────────────────────────────

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

  const handleChange = (field: keyof typeof form, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
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

      let partesPayload: any[] = [];
      if (datajudResult?.partes_encontradas) {
         partesPayload = [...partesPayload, ...datajudResult.partes_encontradas.map(p => ({
            nome: p.nome,
            documento: p.documento,
            polo: p.polo,
            tipo_participacao: p.tipo_participacao,
            oab: p.oab,
            client_id: p.client_id
         }))];
      }
      pendingPartes.forEach(p => {
         partesPayload.push({
            nome: p.parte.nome,
            documento: p.parte.documento,
            polo: p.parte.polo,
            tipo_participacao: p.parte.tipo_participacao,
            oab: p.parte.oab,
            ...(p.created && p.createdClientId ? { client_id: p.createdClientId } : {})
         });
      });

      if (partes.length > 0) {
        partesPayload = [...partesPayload, ...partes];
      }

      const payload: Parameters<typeof LegalActionService.createLegalAction>[0] = {
        number: form.number,
        title: form.title,
        client_id: clientId,
        action_type_id: actionTypeId,
        user_ids: selectedUsers.map((user) => user.id),
        ...(form.description && { description: form.description }),
        ...(form.legal_status && { legal_status: form.legal_status as LegalStatus }),
        ...(form.court_name && { court_name: form.court_name }),
        ...(form.filing_date && { filing_date: form.filing_date }),
        ...(form.orgao_julgador && { orgao_julgador: form.orgao_julgador }),
        ...(form.valor_causa && { valor_causa: Number(form.valor_causa) }),
        ...(assuntos.length > 0 && { assuntos_json: JSON.stringify(assuntos) }),
        ...(datajudResult?.dados && {
          tribunal: datajudResult.dados.tribunal ?? undefined,
          comarca: datajudResult.dados.comarca ?? undefined,
          vara: datajudResult.dados.vara ?? undefined,
          competencia: datajudResult.dados.competencia ?? undefined,
          magistrado: datajudResult.dados.magistrado ?? undefined,
          classe_processual_codigo: datajudResult.dados.classe_processual_codigo ?? undefined,
          classe_processual_nome: datajudResult.dados.classe_processual_nome ?? undefined,
          data_distribuicao: datajudResult.dados.data_distribuicao ?? undefined,
          segredo_justica: datajudResult.dados.segredo_justica,
        }),
        ...(partesPayload.length > 0 && { partes: partesPayload }),
        ...(movimentos.length > 0 && { movimentos }),
      };

      await LegalActionService.createLegalAction(payload);

      // Auto-sync no backend para salvar as partes e movimentações nas tabelas 1:N
      if (datajudResult?.processo_encontrado) {
        try {
          await LegalActionService.autoCompleteByCNJ(form.number);
        } catch {
          // ignore background sync errors
        }
      }

      setLocation('/legal-actions');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar processo';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

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


        <form onSubmit={handleSubmit}>
          {/* ── Card 1: Auto-Complete DataJud ──────────────────────────────── */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="w-4 h-4 text-primary" />
                Auto-Complete via DataJud (CNJ)
              </CardTitle>
              <CardDescription>
                Digite o número CNJ e clique em Consultar para preencher os dados automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <label htmlFor="number" className="block text-sm font-medium text-foreground">
                    Número do Processo (CNJ) <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="number"
                    placeholder="Ex: 0001234-56.2025.8.26.0100"
                    value={form.number}
                    onChange={(e) => {
                      handleChange('number', e.target.value);
                      setDatajudError('');
                      setDatajudWarning('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConsultarDataJud();
                      }
                    }}
                    disabled={isLoading || isConsulting}
                    required
                    minLength={3}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  id="btn-consultar-datajud"
                  onClick={handleConsultarDataJud}
                  disabled={isLoading || isConsulting || !form.number.trim()}
                  className="shrink-0 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  {isConsulting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Consultar DataJud
                    </>
                  )}
                </Button>
              </div>

              {/* Erro DataJud */}
              {datajudError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{datajudError}</AlertDescription>
                </Alert>
              )}

              {/* Aviso DataJud (ex: segredo de justiça) */}
              {datajudWarning && (
                <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-700">
                  <Shield className="h-4 w-4 text-amber-600" />
                  <AlertDescription>{datajudWarning}</AlertDescription>
                </Alert>
              )}

              {/* Processo já cadastrado */}
              {datajudResult?.processo_existente_id && (
                <Alert className="border-blue-500/50 bg-blue-500/10 text-blue-700">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription>
                    Este processo já está cadastrado na sua organização.{' '}
                    <button
                      type="button"
                      className="underline font-medium"
                      onClick={() => setLocation(`/legal-actions/${datajudResult.processo_existente_id}/editar`)}
                    >
                      Clique aqui para editá-lo.
                    </button>
                  </AlertDescription>
                </Alert>
              )}



              {/* Partes encontradas */}
              {datajudResult?.partes_encontradas && datajudResult.partes_encontradas.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Partes identificadas</p>
                  <div className="flex flex-wrap gap-2">
                    {datajudResult.partes_encontradas.map((parte, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Check className="w-3 h-3 mr-1 text-green-600" />
                        {parte.nome}
                        <span className="ml-1 text-muted-foreground">({parte.polo})</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Partes não cadastradas */}
              {datajudResult?.partes_nao_encontradas && datajudResult.partes_nao_encontradas.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {datajudResult.partes_nao_encontradas.length} parte(s) não cadastrada(s)
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    id="btn-ver-partes-nao-cadastradas"
                    onClick={() => setShowPartesModal(true)}
                  >
                    <UserPlus className="w-3 h-3 mr-1" />
                    Ver e cadastrar partes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Card 2: Dados da Ação ─────────────────────────────────────── */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Dados da Ação</CardTitle>
              <CardDescription>Campos obrigatórios e opcionais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Usuários vinculados
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
                        ? 'Selecione usuários'
                        : selectedUsers.length === 1
                          ? getUserLabel(selectedUsers[0])
                          : `${selectedUsers.length} usuários selecionados`}
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
                          {loadingUsers ? 'Carregando...' : 'Nenhum usuário encontrado.'}
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
                  <label htmlFor="court_name" className="block text-sm font-medium text-foreground">Tribunal / Fórum</label>
                  <Input
                    id="court_name"
                    placeholder="Ex: TJSP — Vara Cível"
                    value={form.court_name}
                    onChange={(e) => handleChange('court_name', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="assunto" className="block text-sm font-medium text-foreground">
                  Assunto(s) do Processo
                </label>
                <Input
                  id="assunto"
                  placeholder="Ex: IRPJ/Imposto de Renda, Indenização por Dano Moral"
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
                    placeholder="Ex: 1ª Vara Cível / Gab. 09"
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

              <div className="space-y-2">
                <label htmlFor="filing_date" className="block text-sm font-medium text-foreground">Data de Ajuizamento / Distribuição</label>
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

          {/* ── Card 3: Movements (Always visible) ──────────── */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HistoryIcon className="w-4 h-4 text-primary" />
                Movements
                {movimentos.length > 0 && (
                  <Badge variant="secondary" className="ml-1 font-mono">
                    {movimentos.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Historical movements (synchronized via DataJud or added manually)
              </CardDescription>
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

      {/* ── Modal: Partes não cadastradas ────────────────────────────────── */}
      <Dialog open={showPartesModal} onOpenChange={setShowPartesModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Partes não cadastradas
            </DialogTitle>
            <DialogDescription>
              As partes abaixo foram identificadas no DataJud mas não possuem cadastro na sua organização.
              Você pode cadastrá-las agora ou pular — poderá fazer isso depois na edição do processo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {pendingPartes.map((entry, idx) => (
              <div
                key={idx}
                className={cn(
                  'border rounded-lg p-4 space-y-2 transition-colors',
                  entry.created ? 'border-green-500/40 bg-green-500/5' : 'border-border bg-card'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{entry.parte.nome}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.parte.polo && (
                        <Badge variant="outline" className="text-xs capitalize">{entry.parte.polo}</Badge>
                      )}
                      {entry.parte.tipo_participacao && (
                        <Badge variant="outline" className="text-xs capitalize">{entry.parte.tipo_participacao}</Badge>
                      )}
                      {entry.parte.documento && (
                        <Badge variant="secondary" className="text-xs font-mono">{entry.parte.documento}</Badge>
                      )}
                      {entry.parte.oab && (
                        <Badge variant="secondary" className="text-xs">OAB: {entry.parte.oab}</Badge>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {entry.created ? (
                      <Badge className="bg-green-600 text-white">
                        <Check className="w-3 h-3 mr-1" />
                        Cadastrado
                      </Badge>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        id={`btn-criar-cliente-${idx}`}
                        onClick={() => handleCriarCliente(idx)}
                        disabled={entry.creating}
                        className="text-xs"
                      >
                        {entry.creating ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Cadastrar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
                {entry.error && (
                  <p className="text-xs text-destructive">{entry.error}</p>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              id="btn-fechar-modal-partes"
              onClick={() => setShowPartesModal(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
