import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff } from 'lucide-react';
import { AuthService } from '@/services/auth.service';
import { UserService } from '@/services/user.service';
import { toast } from 'sonner';

/**
 * Página de Login - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Características: Tipografia Playfair Display, layout assimétrico, cores preto/branco
 */

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      await AuthService.login(email, password);
      // Obter dados do usuário autenticado
      const user = await UserService.getMe();

      // Verificar se usuário tem organização
      if (!user.organization_id) {
        // Redirecionar para onboarding se não houver organização
        window.location.href = '/onboarding-organization';
      } else {
        // Redirecionar para home após login bem-sucedido
        window.location.href = '/home';
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-background flex">
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
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked === true)}
                />
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
        </div>
      </div>
    </div>
  );
}
