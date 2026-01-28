import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Página de Login - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Características: Tipografia Playfair Display, layout assimétrico, cores preto/branco
 */

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simular autenticação
    setTimeout(() => {
      setIsLoading(false);
      // Redirecionar para dashboard
      window.location.href = '/dashboard';
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Seção Esquerda - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground text-background flex-col justify-between p-12">
        <div>
          <h1 className="text-5xl font-bold mb-2">Nomos</h1>
          <p className="text-lg opacity-90">Gestão Jurídica Profissional</p>
        </div>
        
        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-bold mb-3">Eficiência</h3>
            <p className="text-base opacity-80">Gerencie clientes e processos com precisão e elegância.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3">Segurança</h3>
            <p className="text-base opacity-80">Seus dados jurídicos protegidos com os mais altos padrões.</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-3">Simplicidade</h3>
            <p className="text-base opacity-80">Interface intuitiva para profissionais do direito.</p>
          </div>
        </div>

        <div className="text-sm opacity-70">
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
            <h2 className="text-3xl font-bold text-foreground mb-2">Bem-vindo</h2>
            <p className="text-muted-foreground">Entre com suas credenciais para acessar o sistema</p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-6">
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

            {/* Lembrar-se e Recuperar Senha */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 border border-border" />
                <span className="text-foreground">Lembrar-se de mim</span>
              </label>
              <a href="#" className="text-foreground hover:underline font-medium">
                Esqueceu a senha?
              </a>
            </div>

            {/* Botão Login */}
            <Button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Divisor */}
          <div className="divider-horizontal" />

          {/* Registro */}
          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{' '}
            <a href="#" className="text-foreground font-medium hover:underline">
              Solicite acesso
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
