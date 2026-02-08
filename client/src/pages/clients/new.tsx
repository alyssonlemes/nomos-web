import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select } from '@/components/ui/select';
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { ClientService, CreateClientData } from '@/services/client.service';

/**
 * Página de Novo Cliente - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Formulário para criar novo cliente
 */

export default function ClienteNovoPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateClientData>({
    name: '',
    document: '',
    email: '',
    phone: '',
    client_type: 'individual',
    status: 'prospect',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    company_name: '',
  });

  const handleChange = (field: keyof CreateClientData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validações
      if (!formData.name || formData.name.length < 3) {
        throw new Error('Nome deve ter no mínimo 3 caracteres');
      }
      if (!formData.document) {
        throw new Error('Documento é obrigatório');
      }

      // Preparar dados (remover campos vazios opcionais)
      const dataToSend: CreateClientData = {
        name: formData.name,
        document: formData.document,
        client_type: formData.client_type,
        status: formData.status,
      };

      if (formData.email) dataToSend.email = formData.email;
      if (formData.phone) dataToSend.phone = formData.phone;
      if (formData.address) dataToSend.address = formData.address;
      if (formData.city) dataToSend.city = formData.city;
      if (formData.state) dataToSend.state = formData.state;
      if (formData.zip_code) dataToSend.zip_code = formData.zip_code;
      if (formData.company_name && formData.client_type === 'business') {
        dataToSend.company_name = formData.company_name;
      }

      await ClientService.createClient(dataToSend);
      
      // Redirecionar para listagem
      setLocation('/clientes');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar cliente';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Novo Cliente</h1>
          <p className="text-muted-foreground">
            Preencha as informações para cadastrar um novo cliente
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
                  CPF/CNPJ <span className="text-destructive">*</span>
                </label>
                <Input
                  id="document"
                  placeholder="Ex: 123.456.789-00 ou 12.345.678/0001-90"
                  value={formData.document}
                  onChange={(e) => handleChange('document', e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              {/* Tipo de Cliente */}
              <div className="space-y-2">
                <label htmlFor="client_type" className="block text-sm font-medium text-foreground">
                  Tipo de Cliente
                </label>
                <select
                  id="client_type"
                  value={formData.client_type}
                  onChange={(e) => handleChange('client_type', e.target.value)}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="individual">Pessoa Física</option>
                  <option value="business">Pessoa Jurídica</option>
                </select>
              </div>

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
              <div className="space-y-2">
                <label htmlFor="status" className="block text-sm font-medium text-foreground">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="prospect">Prospect</option>
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
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
                'Criar Cliente'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
