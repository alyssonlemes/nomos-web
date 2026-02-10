import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Mail, Calendar, CheckCircle2, XCircle, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserService, UserResponse } from '@/services/user.service';
import { Badge } from '@/components/ui/badge';

/**
 * Pagina de Visualizacao de Usuario - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Exibe informacoes detalhadas do usuario
 */

export default function UsuariosEditPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const userId = params.id ? parseInt(params.id) : null;
  
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      loadUser();
    } else {
      setError('ID de usuário inválido');
      setIsLoading(false);
    }
  }, [userId]);

  const loadUser = async () => {
    if (!userId) return;
    
    try {
      setIsLoading(true);
      setError('');
      const data = await UserService.getUserById(userId);
      setUser(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar usuário';
      setError(errorMessage);
    } finally {
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
            onClick={() => setLocation('/usuarios')}
            className="mb-4 -ml-4 hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Usuarios
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLoading ? 'Carregando...' : user?.full_name || 'Usuário'}
          </h1>
          <p className="text-muted-foreground">
            Informações detalhadas do funcionário
          </p>
        </div>

        {/* Mensagens de Erro */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Conteudo */}
        {!isLoading && user && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>Informações Básicas</CardTitle>
                    <CardDescription>
                      Dados cadastrais do usuário
                    </CardDescription>
                  </div>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? (
                      <><CheckCircle2 className="h-3 w-3 mr-1" /> Ativo</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Inativo</>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                    <p className="text-base font-medium text-foreground">{user.full_name}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">E-mail</p>
                    <p className="text-base text-foreground">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Data de Cadastro</p>
                    <p className="text-base text-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {user.updated_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Última Atualização</p>
                      <p className="text-base text-foreground">
                        {new Date(user.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card de Permissões */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Permissões</CardTitle>
                <CardDescription>
                  Níveis de acesso e privilégios
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-foreground">Superusuário</span>
                  <Badge variant={user.is_superuser ? "default" : "outline"}>
                    {user.is_superuser ? 'Sim' : 'Não'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-foreground">ID da Organização</span>
                  <span className="text-sm text-muted-foreground">
                    {user.organization_id || 'Não vinculado'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Botoes de Acao */}
            <div className="flex items-center justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/usuarios')}
                className="hover:bg-muted"
              >
                Voltar
              </Button>
              <Button type="button" disabled>
                Editar Usuário
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
