import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Edit, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ItemCatalogo } from '@/services/catalogo-processo';
import type { TextosCatalogo } from './textos';

export function DetalheCatalogo({ config }: { config: TextosCatalogo }) {
  const [, setLocation] = useLocation();
  const params = useParams();
  const itemId = params?.id ? parseInt(params.id, 10) : null;
  const [item, setItem] = useState<ItemCatalogo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!itemId) {
      toast.error(config.erroId);
      setIsLoading(false);
      return;
    }
    let ativo = true;
    config.cliente
      .obter(itemId)
      .then((data) => {
        if (ativo) setItem(data);
      })
      .catch((err) => {
        if (ativo) toast.error(err instanceof Error ? err.message : config.erroLista);
      })
      .finally(() => {
        if (ativo) setIsLoading(false);
      });
    return () => {
      ativo = false;
    };
  }, [config, itemId]);

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
            {isLoading ? 'Carregando...' : item?.name ?? config.nomeVazio}
          </h1>
          <p className="text-muted-foreground">
            {item && !isLoading ? (item.code ? `Código: ${item.code}` : config.detalheSemCodigo) : config.detalhePadrao}
          </p>
        </div>
        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        {!isLoading && item && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{config.cardDetalhe}</CardTitle>
                <CardDescription>Nome, código e descrição</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Campo rotulo="Nome" valor={item.name || '—'} />
                <Campo rotulo="Código" valor={item.code || '—'} mono />
                {item.description != null && item.description !== '' && (
                  <Campo rotulo="Descrição" valor={item.description} preservar />
                )}
              </CardContent>
            </Card>
            <div className="flex items-center justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setLocation(config.base)}
                className="hover:bg-accent hover:text-accent-foreground"
              >
                Voltar
              </Button>
              <Button onClick={() => setLocation(`${config.base}/${item.id}/editar`)} className="gap-2">
                <Edit className="h-4 w-4" />
                {config.editar}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Campo({ rotulo, valor, mono = false, preservar = false }: { rotulo: string; valor: string; mono?: boolean; preservar?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <FileText className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
        <p className={`text-base text-foreground ${mono ? 'font-mono' : ''} ${preservar ? 'whitespace-pre-wrap' : ''}`}>{valor}</p>
      </div>
    </div>
  );
}
