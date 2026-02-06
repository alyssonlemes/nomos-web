import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
import { UserService } from '@/services/user.service';

/**
 * Página de Cadastro de Usuário - Nomos
 * Design: Minimalismo Corporativo Refinado
 */

export default function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [withOrganization, setWithOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationDocument, setOrganizationDocument] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }

    setIsLoading(true);

    try {
      if (withOrganization) {
        await UserService.registerWithOrganization({
          email,
          username,
          password,
          full_name: fullName,
          organization_name: organizationName,
          organization_document: organizationDocument,
        });
      } else {
        await UserService.register({
          email,
          username,
          password,
          full_name: fullName,
          organization_id: null,
        });
      }

      setSuccess('Usuário criado com sucesso. Você já pode entrar.');
      setIsLoading(false);
      setPassword('');
      setConfirmPassword('');
      setLocation('/login');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Seção Esquerda - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col items-center p-12 pt-24">
        <div className="text-center flex flex-col items-center justify-center gap-2">
          <img src="/white_logo.png" alt="Nomos Logo" className="w-80 h-auto mx-auto" />
          <h1 className="text-8xl font-bold tracking-wide">Nomos</h1>
        </div>

        <div className="text-sm opacity-40 absolute bottom-6">
          <p>&copy; 2024 Nomos. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Seção Direita - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Logo Mobile */}
          <div className="lg:hidden mb-8">
            <h1 className="text-4xl font-bold text-foreground">Nomos</h1>
            <p className="text-muted-foreground mt-2">Gestão Jurídica Profissional</p>
          </div>

          {/* Título */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Criar conta</h2>
            <p className="text-muted-foreground">Preencha seus dados para acessar o sistema</p>
          </div>

          {/* Mensagens */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Nome completo */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
                Nome completo
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-refined"
                required
              />
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                Usuário
              </label>
              <Input
                id="username"
                type="text"
                placeholder="usuario123"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-refined"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-refined"
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Senha
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-refined pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirmar senha
              </label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-refined"
                required
              />
            </div>

            {/* Organização */}
            <div className="flex items-center gap-3">
              <Checkbox
                checked={withOrganization}
                onCheckedChange={(checked) => setWithOrganization(checked === true)}
              />
              <span className="text-sm text-foreground">Criar com organização</span>
            </div>

            {withOrganization && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="organizationName" className="block text-sm font-medium text-foreground">
                    Nome da organização
                  </label>
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="Silva & Associados Advocacia"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    className="input-refined"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="organizationDocument" className="block text-sm font-medium text-foreground">
                    Documento da organização
                  </label>
                  <Input
                    id="organizationDocument"
                    type="text"
                    placeholder="12.345.678/0001-99"
                    value={organizationDocument}
                    onChange={(e) => setOrganizationDocument(e.target.value)}
                    className="input-refined"
                    required
                  />
                </div>
              </div>
            )}

            {/* Botão Criar */}
            <Button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? 'Criando...' : 'Criar conta'}
            </Button>
          </form>

          {/* Divisor */}
          <div className="divider-horizontal" />

          {/* Login */}
          <p className="text-center text-sm text-muted-foreground">
            Já possui uma conta?{' '}
            <a href="/login" className="text-foreground font-medium hover:underline">
              Entrar
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
