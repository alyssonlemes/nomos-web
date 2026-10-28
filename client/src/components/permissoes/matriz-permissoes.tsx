import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MODULOS, type AcaoPermissao, type ModuloSistema, type Permissao } from '@/lib/rbac';
import { AccessProfileService, type AccessProfile } from '@/services/access-profile.service';
import { UserService } from '@/services/user.service';

const ACOES: Array<{ chave: AcaoPermissao; label: string }> = [
  { chave: 'visualizar', label: 'Visualizar' },
  { chave: 'criar', label: 'Criar' },
  { chave: 'editar', label: 'Editar' },
  { chave: 'excluir', label: 'Excluir' },
];

function normalizar(permissoes: Permissao[]): Permissao[] {
  const porModulo = new Map(permissoes.map((item) => [item.modulo, item]));
  return MODULOS.map(
    (modulo) =>
      porModulo.get(modulo.id) ?? {
        modulo: modulo.id,
        visualizar: false,
        criar: false,
        editar: false,
        excluir: false,
      },
  );
}

export function MatrizPermissoes() {
  const [perfis, setPerfis] = useState<AccessProfile[]>([]);
  const [perfilId, setPerfilId] = useState('');
  const [matriz, setMatriz] = useState<Record<number, Permissao[]>>({});
  const [isolamento, setIsolamento] = useState<Record<number, boolean>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const carregar = async () => {
      try {
        const lista = await AccessProfileService.list();
        setPerfis(lista);
        setMatriz(Object.fromEntries(lista.map((perfil) => [perfil.id, normalizar(perfil.permissions)])));
        setIsolamento(Object.fromEntries(lista.map((perfil) => [perfil.id, perfil.isolate_data])));
        setPerfilId(String(lista[0]?.id ?? ''));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Não foi possível carregar os perfis.');
      } finally {
        setCarregando(false);
      }
    };
    void carregar();
  }, []);

  const id = Number(perfilId);
  const perfil = perfis.find((item) => item.id === id);
  const permissoes = matriz[id] ?? [];
  const bloqueado = perfil?.name === 'Administrador';

  function alterar(modulo: ModuloSistema, campo: AcaoPermissao, valor: boolean) {
    if (bloqueado) return;
    setMatriz((atual) => ({
      ...atual,
      [id]: (atual[id] ?? []).map((item) => (item.modulo === modulo ? { ...item, [campo]: valor } : item)),
    }));
  }

  async function salvar() {
    if (!perfil) return;
    setSalvando(true);
    try {
      const atualizado = await AccessProfileService.update(perfil.id, {
        isolate_data: Boolean(isolamento[perfil.id]),
        permissions: matriz[perfil.id] ?? [],
      });
      setPerfis((atual) => atual.map((item) => (item.id === atualizado.id ? atualizado : item)));
      setMatriz((atual) => ({ ...atual, [atualizado.id]: normalizar(atualizado.permissions) }));
      setIsolamento((atual) => ({ ...atual, [atualizado.id]: atualizado.isolate_data }));
      const eu = UserService.getStoredUser();
      if (eu?.profile_id === atualizado.id) {
        await UserService.getMe();
      }
      toast.success(`Permissões de ${atualizado.name} salvas.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível salvar as permissões.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Matriz de permissões</CardTitle>
          <CardDescription>
            {carregando
              ? 'Carregando perfis da organização…'
              : (perfil?.description ?? 'Selecione um perfil para editar o acesso por módulo.')}
            {bloqueado ? ' A matriz do administrador permanece total.' : ' Excluir controla remover e desvincular.'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={perfilId} onValueChange={setPerfilId} disabled={carregando || perfis.length === 0}>
            <SelectTrigger className="w-56" aria-label="Perfil">
              <SelectValue placeholder="Selecione o perfil" />
            </SelectTrigger>
            <SelectContent>
              {perfis.map((item) => (
                <SelectItem key={item.id} value={String(item.id)}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={() => void salvar()} disabled={carregando || salvando || !perfil}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <Checkbox
            id="isolar-dados"
            checked={Boolean(isolamento[id])}
            disabled={carregando || !perfil}
            onCheckedChange={(checked) => setIsolamento((atual) => ({ ...atual, [id]: checked === true }))}
            aria-label="Ver somente os próprios dados"
          />
          <div className="space-y-1">
            <Label htmlFor="isolar-dados">Ver somente os próprios dados</Label>
            <p className="text-sm text-muted-foreground">
              Clientes e processos vinculados a este usuário. Continua valendo mesmo que o perfil tenha acesso aos módulos.
            </p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Módulo</TableHead>
              {ACOES.map((acao) => (
                <TableHead key={acao.chave} className="text-center">
                  {acao.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissoes.map((permissao) => {
              const meta = MODULOS.find((item) => item.id === permissao.modulo);
              return (
                <TableRow key={permissao.modulo}>
                  <TableCell className="font-medium">{meta?.label ?? permissao.modulo}</TableCell>
                  {ACOES.map((acao) => {
                    const desabilitada =
                      bloqueado ||
                      carregando ||
                      (acao.chave !== 'visualizar' && Boolean(meta?.somenteVisualizar)) ||
                      ((acao.chave === 'criar' || acao.chave === 'excluir') && Boolean(meta?.semCriarExcluir));
                    return (
                      <TableCell key={acao.chave} className="text-center">
                        <Checkbox
                          checked={permissao[acao.chave]}
                          disabled={desabilitada}
                          onCheckedChange={(checked) => alterar(permissao.modulo, acao.chave, checked === true)}
                          aria-label={`${acao.label} em ${meta?.label ?? permissao.modulo}`}
                        />
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
