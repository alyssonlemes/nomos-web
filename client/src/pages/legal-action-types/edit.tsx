import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { LegalActionTypeService, LegalActionType } from '@/services/legal-action-type.service';

export default function LegalActionTypeEditPage() {
  const [, params] = useRoute('/legal-action-types/:id/editar');
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingType, setIsLoadingType] = useState(true);
  const [error, setError] = useState('');
  const [type, setType] = useState<LegalActionType | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const typeId = params?.id ? parseInt(params.id) : null;

  useEffect(() => {
    if (typeId) loadType(typeId);
  }, [typeId]);

  const loadType = async (id: number) => {
    try {
      setIsLoadingType(true);
      setError('');
      const data = await LegalActionTypeService.getLegalActionTypeById(id);
      setType(data);
      setForm({
        name: data.name ?? '',
        code: data.code ?? '',
        description: data.description ?? '',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tipo de ação';
      setError(errorMessage);
    } finally {
      setIsLoadingType(false);
    }
  };

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!typeId || !type) {
      setError('ID do tipo inválido');
      setIsLoading(false);
      return;
    }

    try {
      if (!form.name?.trim()) throw new Error('Nome é obrigatório');
      if (!form.code?.trim()) throw new Error('Código é obrigatório');

      await LegalActionTypeService.updateLegalActionType(typeId, {
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description?.trim() || null,
      });
      setLocation('/legal-action-types');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tipo de ação';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  if (isLoadingType) {
    return (
      <div className="p-8 min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!type) {
    return (
      <div className="p-8 min-h-full">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Tipo de ação não encontrado</AlertDescription>
          </Alert>
          <Button onClick={() => setLocation('/legal-action-types')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Tipos de Ações
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
            onClick={() => setLocation('/legal-action-types')}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Tipos de Ações
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Editar Tipo de Ação</h1>
          <p className="text-muted-foreground">Atualize as informações do tipo {type.name}</p>
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
              <CardTitle>Dados do tipo</CardTitle>
              <CardDescription>Nome, código e descrição</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Nome <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="Ex: Trabalhista"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
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
                  placeholder="Ex: labor"
                  value={form.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  disabled={isLoading}
                  required
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  placeholder="Ex: Ações trabalhistas"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/legal-action-types')}
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
                'Salvar alterações'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
