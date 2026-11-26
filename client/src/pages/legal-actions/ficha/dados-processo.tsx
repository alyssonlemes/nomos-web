import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, CheckCircle2, FileText, Scale, Tag, User, Users, XCircle } from 'lucide-react';
import { DataJudAssunto, LegalAction } from '@/services/legal-action.service';

function formatarData(valor: string | null | undefined): string {
  if (!valor) return '—';
  return new Date(valor).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function parseAssuntos(assuntosJson?: string | null): DataJudAssunto[] {
  if (!assuntosJson) return [];
  try {
    const parsed = JSON.parse(assuntosJson) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        if (typeof item === 'string') return { nome: item };
        if (item && typeof item === 'object') {
          const assunto = item as DataJudAssunto;
          return { codigo: assunto.codigo, nome: assunto.nome };
        }
        return { nome: 'Assunto' };
      });
    }
    if (typeof parsed === 'object' && parsed !== null) return [parsed as DataJudAssunto];
  } catch {
    return [{ nome: assuntosJson }];
  }
  return [];
}

function Campo({
  icone,
  rotulo,
  children,
}: {
  icone: ReactNode;
  rotulo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-muted-foreground">{icone}</span>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
        <div className="text-base text-foreground">{children}</div>
      </div>
    </div>
  );
}

interface DadosProcessoProps {
  action: LegalAction;
  clientName: string | null;
  statusLabel: string;
  tipoLabel: string;
}

export function DadosProcesso({ action, clientName, statusLabel, tipoLabel }: DadosProcessoProps) {
  const assuntos = parseAssuntos(action.assuntos_json);
  const partes = action.partes ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Informações básicas</h2>
          <Badge variant={action.is_active ? 'default' : 'secondary'}>
            {action.is_active ? (
              <><CheckCircle2 className="mr-1 h-3 w-3" /> Ativo</>
            ) : (
              <><XCircle className="mr-1 h-3 w-3" /> Inativo</>
            )}
          </Badge>
        </div>
        <Campo icone={<FileText className="h-5 w-5" />} rotulo="Número">
          <p className="font-mono">{action.number || '—'}</p>
        </Campo>
        <Campo icone={<FileText className="h-5 w-5" />} rotulo="Título">
          <p>{action.title || '—'}</p>
        </Campo>
        {action.description != null && action.description !== '' && (
          <Campo icone={<FileText className="h-5 w-5" />} rotulo="Descrição">
            <p className="whitespace-pre-wrap">{action.description}</p>
          </Campo>
        )}
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-lg font-semibold text-foreground">Dados processuais</h2>
        <Campo icone={<Scale className="h-5 w-5" />} rotulo="Tipo da ação">
          <p>{tipoLabel}</p>
        </Campo>
        <Campo icone={<Scale className="h-5 w-5" />} rotulo="Status">
          <Badge variant="outline" className="font-normal">{statusLabel}</Badge>
        </Campo>
        <Campo icone={<Building2 className="h-5 w-5" />} rotulo="Tribunal / Fórum">
          <p>{action.court_name || '—'}</p>
        </Campo>
        <Campo icone={<Building2 className="h-5 w-5" />} rotulo="Órgão Julgador">
          <p>{action.orgao_julgador || '—'}</p>
        </Campo>
        <Campo icone={<Building2 className="h-5 w-5" />} rotulo="Comarca / Vara">
          <p>{[action.comarca, action.vara].filter(Boolean).join(' — ') || '—'}</p>
        </Campo>
        <Campo icone={<Scale className="h-5 w-5" />} rotulo="Valor da causa">
          <p className="font-semibold">
            {action.valor_causa != null
              ? Number(action.valor_causa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : '—'}
          </p>
        </Campo>
        <Campo icone={<User className="h-5 w-5" />} rotulo="Magistrado">
          <p>{action.magistrado || '—'}</p>
        </Campo>
        {action.segredo_justica && <Badge variant="destructive">Segredo de Justiça</Badge>}
        <Campo icone={<Calendar className="h-5 w-5" />} rotulo="Data de abertura / ajuizamento">
          <p>{formatarData(action.filing_date)}</p>
        </Campo>
        {action.closing_date && (
          <Campo icone={<Calendar className="h-5 w-5" />} rotulo="Data de encerramento">
            <p>{formatarData(action.closing_date)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Inferida pelo movimento TPU de encerramento</p>
          </Campo>
        )}
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-lg font-semibold text-foreground">Cliente</h2>
        <Campo icone={<User className="h-5 w-5" />} rotulo="Cliente">
          <p>{clientName ?? '—'}</p>
        </Campo>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Tag className="h-5 w-5 text-muted-foreground" />
          Assuntos do processo
        </h2>
        {assuntos.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {assuntos.map((assunto, indice) => (
              <Badge key={`${assunto.codigo ?? ''}-${indice}`} variant="secondary" className="text-xs font-normal">
                {assunto.codigo ? `[${assunto.codigo}] ` : ''}{assunto.nome || 'Assunto'}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum assunto registrado.</p>
        )}
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Users className="h-5 w-5 text-muted-foreground" />
          Partes ({partes.length})
        </h2>
        {partes.length > 0 ? (
          <ul className="space-y-3">
            {partes.map((parte) => (
              <li key={parte.id} className="rounded-lg border p-3">
                <p className="text-sm font-medium text-foreground">{parte.nome}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {parte.polo && <Badge variant="outline" className="text-xs uppercase">{parte.polo}</Badge>}
                  {parte.tipo_participacao && <Badge variant="secondary" className="text-xs capitalize">{parte.tipo_participacao}</Badge>}
                  {parte.documento && <span className="font-mono text-xs text-muted-foreground">CPF/CNPJ: {parte.documento}</span>}
                  {parte.oab && <span className="text-xs text-muted-foreground">OAB: {parte.oab}</span>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhuma parte registrada.</p>
        )}
      </section>
    </div>
  );
}
