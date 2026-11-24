import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { TextosCatalogo } from './textos';

const VAZIO = { name: '', code: '', description: '' };

export function FormularioCatalogo({ config, modo }: { config: TextosCatalogo; modo: 'novo' | 'editar' }) {
  const params = useParams();
  const [, setLocation] = useLocation();
  const itemId = modo === 'editar' && params?.id ? parseInt(params.id, 10) : null;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingItem, setIsLoadingItem] = useState(modo === 'editar');
  const [encontrado, setEncontrado] = useState(modo === 'novo');
  const [nomeAtual, setNomeAtual] = useState('');
  const [form, setForm] = useState(VAZIO);

  useEffect(() => {
    if (modo !== 'editar') return;
    if (!itemId) {
      setIsLoadingItem(false);
      return;
    }
    let ativo = true;
    config.cliente
      .obter(itemId)
      .then((data) => {
        if (!ativo) return;
        setEncontrado(true);
        setNomeAtual(data.name ?? '');
        setForm({ name: data.name ?? '', code: data.code ?? '', description: data.description ?? '' });
      })
      .catch((err) => {
        if (ativo) toast.error(err instanceof Error ? err.message : config.erroLista);
      })
      .finally(() => {
        if (ativo) setIsLoadingItem(false);
      });
    return () => {
      ativo = false;
    };
  }, [config, itemId, modo]);

  const salvar = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    if (modo === 'editar' && (!itemId || !encontrado)) {
      toast.error(config.erroId);
      setIsLoading(false);
      return;
    }
    try {
      if (!form.name.trim()) throw new Error('Nome é obrigatório');
      if (!form.code.trim()) throw new Error('Código é obrigatório');
      const dados = {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description.trim() || null,
      };
      if (modo === 'novo') await config.cliente.criar(dados);
      else await config.cliente.atualizar(itemId as number, dados);
      setLocation(config.base);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : modo === 'novo' ? config.erroCriar : config.erroAtualizar);
      setIsLoading(false);
    }
  };

  if (modo === 'editar' && isLoadingItem) {
    return (
      <div className="p-8 min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (modo === 'editar' && !encontrado) {
    return (
      <div className="p-8 min-h-full">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{config.naoEncontrado}</AlertDescription>
          </Alert>
          <Button onClick={() => setLocation(config.base)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {config.voltar}
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
            onClick={() => setLocation(config.base)}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {config.voltar}
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {modo === 'novo' ? config.tituloNovo : config.tituloEditar}
          </h1>
          <p className="text-muted-foreground">
            {modo === 'novo' ? config.textoNovo : config.textoEditar(nomeAtual)}
          </p>
        </div>
        <form onSubmit={salvar}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{config.card}</CardTitle>
              <CardDescription>Nome, código e descrição</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Nome <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder={config.placeholderNome}
                  value={form.name}
                  onChange={(e) => setForm((atual) => ({ ...atual, name: e.target.value }))}
                  disabled={isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="code" className="block text-sm font-medium text-foreground">
                  Código <span className="text-destructive">*</span>
                </label>
                <Input
                  id="code"
                  placeholder={config.placeholderCodigo}
                  value={form.code}
                  onChange={(e) => setForm((atual) => ({ ...atual, code: e.target.value }))}
                  disabled={isLoading}
                  required
                  className="font-mono"
                />
                {modo === 'novo' && <p className="text-xs text-muted-foreground">{config.ajudaCodigo}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  placeholder={config.placeholderDescricao}
                  value={form.description}
                  onChange={(e) => setForm((atual) => ({ ...atual, description: e.target.value }))}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation(config.base)}
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
              ) : modo === 'novo' ? (
                config.criar
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
