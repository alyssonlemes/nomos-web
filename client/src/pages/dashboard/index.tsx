import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Users, FileText, TrendingUp, Briefcase, FileSpreadsheet, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DashboardService, DashboardStats } from '@/services/dashboard.service';
import { DashboardExportService } from '@/services/dashboard-export.service';
import { formatLegalStatus, formatClientStatus, CLIENT_STATUS_KEYS } from '@/utils/formats';
import { toast } from 'sonner';
import { saveAs } from 'file-saver';

/** Cores minimalistas (sem branco): primary + tons do tema */
const PIE_COLORS = [
  'var(--color-primary)',
  'var(--color-chart-2)',
  'var(--color-chart-3)',
  'var(--color-chart-4)',
];

/**
 * Página Dashboard/Home - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Página inicial do sistema
 */

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportToExcel = async () => {
    if (!stats) return;
    try {
      setIsExporting(true);
      try {
        // Obter a planilha nativa com gráficos dinâmicos do backend (openpyxl DrawingML)
        const blob = await DashboardService.exportExcel();
        const now = new Date();
        const fileDate = now.toISOString().slice(0, 10);
        const fileTime = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        saveAs(blob, `relatorio-dashboard-nomos_${fileDate}_${fileTime}.xlsx`);
        toast.success('Relatório da Dashboard com gráficos dinâmicos exportado com sucesso!');
        return;
      } catch (backendErr) {
        console.warn('Falha no endpoint backend, gerando client-side:', backendErr);
      }

      // Fallback para geração client-side
      let orgName = '';
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const parsed = JSON.parse(userStr);
          orgName = parsed?.organization?.name || parsed?.organization_name || '';
        }
      } catch {
        // ignore
      }
      await DashboardExportService.exportToExcel(stats, { organizationName: orgName });
      toast.success('Relatório da Dashboard exportado para Excel com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao exportar dados para Excel');
    } finally {
      setIsExporting(false);
    }
  };

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

  if (error) {
    return (
      <div className="min-h-full p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral da sua organização</p>
          </div>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-full p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>

          {/* Grid de cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Área inferior skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px] p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="flex-1 h-3" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-56" />
              </CardHeader>
              <CardContent>
                <div className="h-[300px] p-4 space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="flex-1 h-3" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header com botão único de exportar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral da sua organização
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 border-border shadow-xs hover:bg-accent/80 transition-colors cursor-pointer"
              disabled={isExporting || !stats}
              id="export-dashboard-excel-btn"
              onClick={handleExportToExcel}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="font-medium">
                {isExporting ? 'Exportando planilha...' : 'Exportar para Excel'}
              </span>
            </Button>
          </div>
        </div>

        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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

          {/* Card 3 - Novos clientes (30 dias) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes novos</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats != null ? stats.recent_clients_30d : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Nos últimos 30 dias
              </p>
            </CardContent>
          </Card>

          {/* Card 4 - Total de funcionários */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats ? stats.total_users : '—'}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Usuários na organização
              </p>
            </CardContent>
          </Card>

          {/* Card 5 - Ações recentes (30 dias) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações novas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats != null ? stats.recent_actions_30d : '—'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Processos nos últimos 30 dias
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
                          <div className="w-32 text-xs text-muted-foreground">{formatLegalStatus(status)}</div>
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

          {/* Gráfico de pizza minimalista – Clientes por Status */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes por Status</CardTitle>
              <CardDescription>Distribuição dos clientes por status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full flex flex-col">
                {stats && Object.keys(stats.clients_by_status || {}).length > 0 ? (
                  (() => {
                    const total = Object.values(stats.clients_by_status).reduce((a, b) => a + b, 0);
                    const pieData = Object.entries(stats.clients_by_status).map(([status, count]) => ({
                      name: formatClientStatus(status),
                      value: count,
                      total,
                    }));
                    return (
                      <>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="85%"
                                stroke="none"
                                labelLine={false}
                                label={false}
                              >
                                {pieData.map((_, i) => (
                                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: 'var(--color-card)',
                                  border: '1px solid var(--color-border)',
                                  borderRadius: 'var(--radius)',
                                  fontSize: '12px',
                                }}
                                formatter={(value: number, name: string, item: { payload?: { total?: number } }) => {
                                  const t = item.payload?.total ?? 0;
                                  const pct = t > 0 ? Math.round((Number(value) / t) * 100) : 0;
                                  return [`${value} (${pct}%)`, name];
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div
                          className="flex flex-wrap justify-center gap-x-5 gap-y-1 pt-3 mt-1 border-t border-border/50"
                          role="legend"
                        >
                          {pieData.map((entry, i) => (
                            <div
                              key={entry.name}
                              className="flex items-center gap-2 text-xs text-muted-foreground"
                            >
                              <span
                                className="rounded-full w-2 h-2 shrink-0"
                                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                aria-hidden
                              />
                              <span>{entry.name}</span>
                              <span className="tabular-nums font-medium text-foreground">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed border-muted rounded-lg">
                    <p className="text-muted-foreground">Nenhum cliente por status</p>
                    <p className="text-xs text-muted-foreground/80">
                      {CLIENT_STATUS_KEYS.map(formatClientStatus).join(', ')}
                    </p>
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
