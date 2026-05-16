import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { LegalActionStatusService } from '@/services/legal-action-status.service';

export default function LegalActionStatusNewPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!form.name?.trim()) throw new Error('Nome é obrigatório');
      if (!form.code?.trim()) throw new Error('Código é obrigatório');

      await LegalActionStatusService.createLegalActionStatus({
        name: form.name.trim(),
        code: form.code.trim(),
        description: form.description?.trim() || null,
      });
      setLocation('/legal-action-statuses');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar status de ação';
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
            onClick={() => setLocation('/legal-action-statuses')}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Status de Ações
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Novo Status de Ação</h1>
          <p className="text-muted-foreground">
            Preencha os dados para cadastrar um novo status de ação jurídica (ex.: Pré-processual, Suspenso)
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
              <CardTitle>Dados do status</CardTitle>
              <CardDescription>Nome, código e descrição</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Nome <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="Ex: Pré-processual"
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
                  placeholder="Ex: pre_trial"
                  value={form.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  disabled={isLoading}
                  required
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Identificador único (ex.: pre_trial, suspended)</p>
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-foreground">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  placeholder="Ex: Processo em fase pré-processual"
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
              onClick={() => setLocation('/legal-action-statuses')}
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
                'Criar status'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
