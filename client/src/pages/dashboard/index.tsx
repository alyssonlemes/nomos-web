import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Calendar } from 'lucide-react';
import { DashboardService, DashboardStats } from '@/services/dashboard.service';

/**
 * Página Dashboard/Home - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Página inicial do sistema
 */

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await DashboardService.getStats();
        if (mounted) setStats(data);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Erro ao carregar estatísticas');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-full p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua organização
          </p>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card 1 - Total de Clientes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? stats.total_clients : '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clientes cadastrados
              </p>
            </CardContent>
          </Card>

          {/* Card 2 - Processos Ativos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processos Ativos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? stats.total_legal_actions : '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Em andamento
              </p>
            </CardContent>
          </Card>

          {/* Card 3 - Taxa de Crescimento */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats ? `${Math.round((stats.recent_clients_30d / Math.max(1, stats.total_clients)) * 100)}%` : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Novos clientes nos últimos 30 dias
              </p>
            </CardContent>
          </Card>

          {/* Card 4 - Prazos Próximos */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Prazos Próximos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? stats.total_users : '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Usuários na organização
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Área para gráficos maiores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Processos por Status */}
          <Card>
            <CardHeader>
              <CardTitle>Processos por Status</CardTitle>
              <CardDescription>Distribuição dos processos ativos</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] p-4">
                  {stats && Object.keys(stats.actions_by_status || {}).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(stats.actions_by_status).map(([status, count]) => {
                        const max = Math.max(...Object.values(stats.actions_by_status), 1);
                        const width = Math.round((count / max) * 100);
                        return (
                          <div key={status} className="flex items-center gap-3">
                            <div className="w-32 text-xs text-muted-foreground capitalize">{status.replace('_', ' ')}</div>
                            <div className="flex-1 bg-muted/30 rounded h-3 overflow-hidden">
                              <div className="h-3 bg-primary" style={{ width: `${width}%` }} />
                            </div>
                            <div className="w-8 text-right text-sm">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                      <p className="text-muted-foreground">Nenhum processo por status</p>
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>

          {/* Gráfico de Atividade Mensal */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Mensal</CardTitle>
              <CardDescription>Novos processos e clientes por mês</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] p-6 flex items-center justify-center">
                  {stats ? (
                    <div className="w-full max-w-md">
                      <div className="flex items-end gap-6">
                        <div className="flex-1 text-center">
                          <div className="h-40 flex items-end justify-center">
                            <div className="w-16 bg-accent rounded-t" style={{ height: `${Math.min(100, stats.recent_clients_30d * 5)}%` }} />
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">Clientes (30d): {stats.recent_clients_30d}</div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="h-40 flex items-end justify-center">
                            <div className="w-16 bg-secondary rounded-t" style={{ height: `${Math.min(100, stats.recent_actions_30d * 5)}%` }} />
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">Ações (30d): {stats.recent_actions_30d}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                      <p className="text-muted-foreground">Sem dados mensais</p>
                    </div>
                  )}
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
