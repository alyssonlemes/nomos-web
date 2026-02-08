import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, TrendingUp, Calendar } from 'lucide-react';

/**
 * Página Dashboard/Home - Nomos
 * Design: Minimalismo Corporativo Refinado
 * Página inicial do sistema
 */

export default function Dashboard() {
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
              <div className="text-2xl font-bold">0</div>
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
              <div className="text-2xl font-bold">0</div>
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
              <div className="text-2xl font-bold">+0%</div>
              <p className="text-xs text-muted-foreground mt-1">
                vs. mês anterior
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
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">
                Nos próximos 7 dias
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
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">Gráfico em desenvolvimento</p>
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
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
                <p className="text-muted-foreground">Gráfico em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
