import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { LegalActionService } from '@/services/legal-action.service';

export default function ProcessoNovoPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    number: '',
    title: '',
    client_id: '',
    action_type: 'civil',
    description: '',
    legal_status: 'pre_trial',
    court_name: '',
    filing_date: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!form.number || form.number.length < 3) throw new Error('Número deve ter no mínimo 3 caracteres');
      if (!form.title || form.title.length < 3) throw new Error('Título deve ter no mínimo 3 caracteres');
      const clientId = Number(form.client_id);
      if (!clientId || Number.isNaN(clientId)) throw new Error('Cliente (client_id) é obrigatório e deve ser um número');

      const payload: any = {
        number: form.number,
        title: form.title,
        client_id: clientId,
        action_type: form.action_type,
      };

      if (form.description) payload.description = form.description;
      if (form.legal_status) payload.legal_status = form.legal_status;
      if (form.court_name) payload.court_name = form.court_name;
      if (form.filing_date) payload.filing_date = form.filing_date;

      await LegalActionService.createLegalAction(payload);
      setLocation('/processos');
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
            onClick={() => setLocation('/processos')}
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
                <label htmlFor="client_id" className="block text-sm font-medium text-foreground">
                  Cliente (client_id) <span className="text-destructive">*</span>
                </label>
                <Input
                  id="client_id"
                  placeholder="ID do cliente (ex: 42)"
                  value={form.client_id}
                  onChange={(e) => handleChange('client_id', e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="action_type" className="block text-sm font-medium text-foreground">
                  Tipo de Ação <span className="text-destructive">*</span>
                </label>
                <select
                  id="action_type"
                  value={form.action_type}
                  onChange={(e) => handleChange('action_type', e.target.value)}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="labor">Labor</option>
                  <option value="civil">Civil</option>
                  <option value="criminal">Criminal</option>
                  <option value="admin">Admin</option>
                  <option value="tax">Tax</option>
                  <option value="commercial">Commercial</option>
                  <option value="family">Family</option>
                  <option value="real_estate">Real Estate</option>
                  <option value="other">Other</option>
                </select>
              </div>

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
                <div className="space-y-2">
                  <label htmlFor="legal_status" className="block text-sm font-medium text-foreground">Status Jurídico</label>
                  <select
                    id="legal_status"
                    value={form.legal_status}
                    onChange={(e) => handleChange('legal_status', e.target.value)}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="pre_trial">Pre Trial</option>
                    <option value="filing">Filing</option>
                    <option value="litigation">Litigation</option>
                    <option value="execution">Execution</option>
                    <option value="appeal">Appeal</option>
                    <option value="finalized">Finalized</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

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
              onClick={() => setLocation('/processos')}
              disabled={isLoading}
              className="hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} onClick={(e) => { /* form submit handled by form */ }}>
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
