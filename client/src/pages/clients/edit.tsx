import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { ClientService, UpdateClientData, Client } from '@/services/client.service';

/**
 * Página de Edição de Cliente - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Formulário para editar cliente existente
 */

export default function ClienteEditPage() {
  const [, params] = useRoute('/clientes/:id/editar');
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  const [error, setError] = useState('');
  const [client, setClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState<UpdateClientData>({
    name: '',
    document: '',
    email: '',
    phone: '',
    client_type: 'individual',
    status: 'active',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    company_name: '',
  });

  const clientId = params?.id ? parseInt(params.id) : null;

  useEffect(() => {
    if (clientId) {
      loadClient(clientId);
    }
  }, [clientId]);

  const loadClient = async (id: number) => {
    try {
      setIsLoadingClient(true);
      setError('');
      const data = await ClientService.getClientById(id);
      setClient(data);
      
      // Preencher formulário com dados atuais
      setFormData({
        name: data.name,
        document: data.document || '',
        email: data.email || '',
        phone: data.phone || '',
        client_type: data.client_type || 'individual',
        status: data.status || 'active',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip_code: data.zip_code || '',
        company_name: data.company_name || '',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar cliente';
      setError(errorMessage);
    } finally {
      setIsLoadingClient(false);
    }
  };

  const handleChange = (field: keyof UpdateClientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      setError('ID do cliente inválido');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // Validações
      if (formData.name && formData.name.length < 3) {
        throw new Error('Nome deve ter no mínimo 3 caracteres');
      }

      // Preparar dados (enviar apenas campos preenchidos)
      const dataToSend: UpdateClientData = {};

      if (formData.name && formData.name !== client?.name) {
        dataToSend.name = formData.name;
      }
      if (formData.document && formData.document !== client?.document) {
        dataToSend.document = formData.document;
      }
      if (formData.email !== client?.email) {
        dataToSend.email = formData.email || undefined;
      }
      if (formData.phone !== client?.phone) {
        dataToSend.phone = formData.phone || undefined;
      }
      if (formData.client_type !== client?.client_type) {
        dataToSend.client_type = formData.client_type;
      }
      if (formData.status !== client?.status) {
        dataToSend.status = formData.status;
      }
      if (formData.address !== client?.address) {
        dataToSend.address = formData.address || undefined;
      }
      if (formData.city !== client?.city) {
        dataToSend.city = formData.city || undefined;
      }
      if (formData.state !== client?.state) {
        dataToSend.state = formData.state || undefined;
      }
      if (formData.zip_code !== client?.zip_code) {
        dataToSend.zip_code = formData.zip_code || undefined;
      }
      if (formData.company_name !== client?.company_name) {
        dataToSend.company_name = formData.company_name || undefined;
      }

      // Se nenhum campo foi alterado
      if (Object.keys(dataToSend).length === 0) {
        setLocation('/clientes');
        return;
      }

      await ClientService.updateClient(clientId, dataToSend);
      
      // Redirecionar para listagem
      setLocation('/clientes');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar cliente';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  if (isLoadingClient) {
    return (
      <div className="p-8 min-h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 min-h-full">
        <div className="max-w-3xl mx-auto">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Cliente não encontrado</AlertDescription>
          </Alert>
          <Button onClick={() => setLocation('/clientes')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Clientes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-full">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/clientes')}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Clientes
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Editar Cliente</h1>
          <p className="text-muted-foreground">
            Atualize as informações do cliente {client.name}
          </p>
        </div>

        {/* Mensagens */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nome */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Nome Completo <span className="text-destructive">*</span>
                </label>
                <Input
                  id="name"
                  placeholder="Ex: José Pereira da Silva"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={isLoading}
                  required
                  minLength={3}
                />
              </div>

              {/* Documento */}
              <div className="space-y-2">
                <label htmlFor="document" className="block text-sm font-medium text-foreground">
                  CPF/CNPJ
                </label>
                <Input
                  id="document"
                  placeholder="Ex: 123.456.789-00 ou 12.345.678/0001-90"
                  value={formData.document}
                  onChange={(e) => handleChange('document', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Tipo de Cliente */}
              <SelectField
                id="client_type"
                label="Tipo de Cliente"
                value={formData.client_type}
                onChange={(e) => handleChange('client_type', e.target.value)}
                disabled={isLoading}
                options={[
                  { value: 'individual', label: 'Pessoa Física' },
                  { value: 'business', label: 'Pessoa Jurídica' },
                ]}
              />

              {/* Nome da Empresa (se for PJ) */}
              {formData.client_type === 'business' && (
                <div className="space-y-2">
                  <label htmlFor="company_name" className="block text-sm font-medium text-foreground">
                    Nome da Empresa
                  </label>
                  <Input
                    id="company_name"
                    placeholder="Ex: Empresa XYZ Ltda"
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}

              {/* Status */}
              <SelectField
                id="status"
                label="Status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                disabled={isLoading}
                options={[
                  { value: 'prospect', label: 'Prospecção' },
                  { value: 'active', label: 'Ativo' },
                  { value: 'inactive', label: 'Inativo' },
                  { value: 'archived', label: 'Arquivado' },
                ]}
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
              <CardDescription>Dados de contato do cliente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ex: jose@email.com"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                  Telefone
                </label>
                <Input
                  id="phone"
                  placeholder="Ex: (11) 98765-4321"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Informações de localização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Endereço */}
              <div className="space-y-2">
                <label htmlFor="address" className="block text-sm font-medium text-foreground">
                  Endereço
                </label>
                <Input
                  id="address"
                  placeholder="Ex: Rua das Flores, 123"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Cidade e Estado */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm font-medium text-foreground">
                    Cidade
                  </label>
                  <Input
                    id="city"
                    placeholder="Ex: São Paulo"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="state" className="block text-sm font-medium text-foreground">
                    Estado (UF)
                  </label>
                  <Input
                    id="state"
                    placeholder="Ex: SP"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value.toUpperCase())}
                    disabled={isLoading}
                    maxLength={2}
                  />
                </div>
              </div>

              {/* CEP */}
              <div className="space-y-2">
                <label htmlFor="zip_code" className="block text-sm font-medium text-foreground">
                  CEP
                </label>
                <Input
                  id="zip_code"
                  placeholder="Ex: 01234-567"
                  value={formData.zip_code}
                  onChange={(e) => handleChange('zip_code', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation('/clientes')}
              disabled={isLoading}
              className="hover:bg-muted"
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
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
