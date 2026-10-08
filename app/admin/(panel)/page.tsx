import Link from 'next/link';
import {
  ArrowRight,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FileSignature,
  Percent,
  Plus,
  Truck,
  UserPlus,
} from 'lucide-react';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/db/server';
import { PageHeader } from '@/components/admin/page-header';
import { PageActionBar } from '@/components/admin/page-action-bar';
import { StatCard } from '@/components/admin/stat-card';
import { ContentCard } from '@/components/admin/content-card';
import { EmptyState } from '@/components/admin/empty-state';
import { QuoteStatusBadge } from '@/components/admin/status-badge';
import { EquipmentBars, QuotePerformanceChart, QuoteStatusDonut } from '@/components/admin/dashboard-charts';
import { Button } from '@/components/ui/button';
import { formatBRL } from '@/lib/money';
import { formatDateBr } from '@/lib/format';
import { formatPercentChange, percentChange } from '@/lib/admin-ui';
import { type QuoteStatus } from '@/types/database';

export const dynamic = 'force-dynamic';

function versionOf(row: {
  quote_versions: { total_cents?: number; status?: string } | { total_cents?: number; status?: string }[] | null;
}) {
  return Array.isArray(row.quote_versions) ? row.quote_versions[0] : row.quote_versions;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function isApproved(status: string, versionStatus?: string) {
  return ['approved', 'converted'].includes(status) || versionStatus === 'approved';
}

export default async function DashboardPage() {
  await requirePermission('dashboard.read');
  const now = new Date();
  const currentKey = monthKey(now);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = monthKey(previous);

  let quotes: {
    data:
      | {
          id: string;
          status: string;
          created_at: string;
          quote_versions: { total_cents?: number; status?: string } | { total_cents?: number; status?: string }[] | null;
        }[]
      | null;
    error: unknown;
  } = { data: [], error: null };
  let contracts: { data: { id: string; status: string; total_cents: number; created_at: string }[] | null } = { data: [] };
  let recentQuotes: {
    data:
      | {
          id: string;
          number: string;
          title: string;
          status: string;
          created_at: string;
          customers: { legal_name?: string } | { legal_name?: string }[] | null;
        }[]
      | null;
    error: unknown;
  } = { data: [], error: null };
  let datedQuotes: {
    data:
      | {
          created_at: string;
          status: string;
          quote_versions: { total_cents?: number; status?: string } | { total_cents?: number; status?: string }[] | null;
        }[]
      | null;
  } = { data: [] };
  let topItems: {
    data: { description: string; equipment_id: string | null; equipment: { name?: string } | { name?: string }[] | null }[] | null;
  } = { data: [] };
  let newLeads = 0;
  let customersCount = 0;

  try {
    const db = await createClient();
    const results = await Promise.all([
      db.from('quotes').select('id, status, created_at, quote_versions:current_version_id(total_cents, status)').is('deleted_at', null),
      db.from('contracts').select('id, status, total_cents, created_at').is('deleted_at', null),
      db
        .from('quotes')
        .select('id, number, title, status, created_at, customers(legal_name)')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(8),
      db.from('quote_items').select('description, equipment_id, equipment(name)').limit(200),
      db.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new').is('deleted_at', null),
      db.from('customers').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    ]);
    quotes = results[0];
    contracts = results[1];
    recentQuotes = results[2];
    datedQuotes = { data: results[0].data };
    topItems = results[3];
    newLeads = results[4].count ?? 0;
    customersCount = results[5].count ?? 0;
  } catch {
    quotes = { data: [], error: null };
    contracts = { data: [] };
    recentQuotes = { data: [], error: null };
    datedQuotes = { data: [] };
    topItems = { data: [] };
  }

  const quoteRows = quotes.data ?? [];
  const contractRows = contracts.data ?? [];
  const issued = quoteRows.length;
  const approved = quoteRows.filter((row) => isApproved(row.status, versionOf(row)?.status)).length;
  const quotedTotal = quoteRows.reduce((acc, row) => acc + (versionOf(row)?.total_cents ?? 0), 0);
  const approvedTotal = quoteRows.reduce((acc, row) => {
    if (isApproved(row.status, versionOf(row)?.status)) return acc + (versionOf(row)?.total_cents ?? 0);
    return acc;
  }, 0);
  const activeContracts = contractRows.filter((row) => row.status === 'active').length;
  const conversion = issued === 0 ? 0 : (approved / issued) * 100;

  const monthQuoted = (key: string) =>
    (datedQuotes.data ?? []).reduce((acc, row) => {
      if (monthKey(new Date(row.created_at)) !== key) return acc;
      return acc + (versionOf(row)?.total_cents ?? 0);
    }, 0);
  const monthApproved = (key: string) =>
    (datedQuotes.data ?? []).reduce((acc, row) => {
      if (monthKey(new Date(row.created_at)) !== key) return acc;
      if (!isApproved(row.status, versionOf(row)?.status)) return acc;
      return acc + (versionOf(row)?.total_cents ?? 0);
    }, 0);
  const monthContracts = (key: string) =>
    contractRows.filter((row) => row.status === 'active' && monthKey(new Date(row.created_at)) === key).length;
  const monthIssued = (key: string) => (datedQuotes.data ?? []).filter((row) => monthKey(new Date(row.created_at)) === key).length;
  const monthApprovedCount = (key: string) =>
    (datedQuotes.data ?? []).filter(
      (row) => monthKey(new Date(row.created_at)) === key && isApproved(row.status, versionOf(row)?.status),
    ).length;

  const prevQuoted = monthQuoted(previousKey);
  const prevApproved = monthApproved(previousKey);
  const prevContracts = monthContracts(previousKey);
  const prevIssued = monthIssued(previousKey);
  const prevApprovedCount = monthApprovedCount(previousKey);
  const prevConversion = prevIssued === 0 ? null : (prevApprovedCount / prevIssued) * 100;

  const quotedChange = percentChange(monthQuoted(currentKey), prevQuoted);
  const approvedChange = percentChange(monthApproved(currentKey), prevApproved);
  const contractsChange = percentChange(monthContracts(currentKey), prevContracts);
  const conversionChange = prevConversion === null ? null : conversion - prevConversion;

  const monthly = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(date);
    return {
      key,
      month: date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      quoted: 0,
      approved: 0,
    };
  });
  for (const row of datedQuotes.data ?? []) {
    const bucket = monthly.find((item) => item.key === monthKey(new Date(row.created_at)));
    const cents = versionOf(row)?.total_cents ?? 0;
    if (!bucket) continue;
    bucket.quoted += cents / 100;
    if (isApproved(row.status, versionOf(row)?.status)) bucket.approved += cents / 100;
  }

  const statusCounts = new Map<string, number>();
  for (const row of quoteRows) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
  }
  const donut = [
    { name: 'Aprovados', value: (statusCounts.get('approved') ?? 0) + (statusCounts.get('converted') ?? 0), color: '#071B35' },
    {
      name: 'Em análise',
      value: (statusCounts.get('in_review') ?? 0) + (statusCounts.get('sent') ?? 0) + (statusCounts.get('viewed') ?? 0),
      color: '#174A7E',
    },
    { name: 'Recusados', value: statusCounts.get('rejected') ?? 0, color: '#66758A' },
    { name: 'Rascunho', value: statusCounts.get('draft') ?? 0, color: '#C5D0DC' },
  ].filter((item) => item.value > 0);

  const counts = new Map<string, number>();
  for (const item of topItems.data ?? []) {
    const equipment = Array.isArray(item.equipment) ? item.equipment[0] : item.equipment;
    const name = equipment?.name || item.description;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const topEquipment = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const recent = recentQuotes.error ? [] : (recentQuotes.data ?? []);
  const hasQuotes = issued > 0;
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visão geral"
        description="Painel operacional da Sermontiny — orçamentos, conversão e contratos em tempo real."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Visão geral' }]}
        actions={
          <PageActionBar>
            <Button asChild variant="outline">
              <Link href="/admin/clientes/novo">
                <UserPlus />
                Novo cliente
              </Link>
            </Button>
            <Button asChild className="bg-navy text-white hover:bg-navy/90">
              <Link href="/admin/orcamentos/novo">
                <Plus />
                Novo orçamento
              </Link>
            </Button>
          </PageActionBar>
        }
      />

      <div className="grid gap-3 rounded-[14px] border border-border bg-white p-4 shadow-panel sm:grid-cols-3">
        <QuickStat href="/admin/leads" icon={ClipboardList} label="Contatos novos" value={String(newLeads)} />
        <QuickStat href="/admin/clientes" icon={UserPlus} label="Clientes cadastrados" value={String(customersCount)} />
        <QuickStat href="/admin/orcamentos" icon={FileCheck2} label="Orçamentos no mês" value={String(monthIssued(currentKey))} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          featured
          label="Total orçado"
          hint="Carteira completa"
          value={formatBRL(quotedTotal)}
          icon={CircleDollarSign}
          tooltip="Soma do valor da versão atual de todos os orçamentos não excluídos."
          change={quotedChange === null ? null : { value: formatPercentChange(quotedChange), positive: quotedChange >= 0 }}
        />
        <StatCard
          label="Total aprovado"
          hint="Aprovado ou convertido"
          value={formatBRL(approvedTotal)}
          icon={FileCheck2}
          tooltip="Soma dos orçamentos com status aprovado ou convertido em contrato."
          change={approvedChange === null ? null : { value: formatPercentChange(approvedChange), positive: approvedChange >= 0 }}
        />
        <StatCard
          label="Contratos ativos"
          hint="Em vigência"
          value={String(activeContracts)}
          icon={FileSignature}
          tooltip="Contratos com status ativo no momento."
          change={contractsChange === null ? null : { value: formatPercentChange(contractsChange), positive: contractsChange >= 0 }}
        />
        <StatCard
          label="Taxa de conversão"
          hint="Aprovados ÷ total"
          value={`${conversion.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
          icon={Percent}
          tooltip="Orçamentos aprovados ou convertidos dividido pelo total de orçamentos."
          change={conversionChange === null ? null : { value: formatPercentChange(conversionChange), positive: conversionChange >= 0 }}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <ContentCard
          className="xl:col-span-3"
          title="Desempenho de orçamentos"
          description={`Evolução dos últimos 6 meses · referência ${monthLabel}.`}
        >
          {hasQuotes ? (
            <QuotePerformanceChart data={monthly.map(({ month, quoted, approved }) => ({ month, quoted, approved }))} />
          ) : (
            <EmptyState
              title="Ainda não há orçamentos"
              text="Os gráficos aparecem quando existir pelo menos um orçamento cadastrado."
              action={
                <Button asChild className="bg-navy text-white hover:bg-navy/90">
                  <Link href="/admin/orcamentos/novo">Criar primeiro orçamento</Link>
                </Button>
              }
            />
          )}
        </ContentCard>
        <ContentCard className="xl:col-span-2" title="Status dos orçamentos" description="Distribuição atual da carteira.">
          {donut.length > 0 ? (
            <QuoteStatusDonut data={donut} />
          ) : (
            <EmptyState title="Sem status para exibir" text="Cadastre orçamentos para ver a distribuição." />
          )}
        </ContentCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <ContentCard
          className="xl:col-span-3"
          title="Orçamentos recentes"
          description="Últimas propostas comerciais cadastradas."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orcamentos">
                Ver todos
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="Nenhum orçamento recente"
              text="Crie a primeira proposta comercial para começar o acompanhamento."
              action={
                <Button asChild className="bg-navy text-white hover:bg-navy/90">
                  <Link href="/admin/orcamentos/novo">Criar primeiro orçamento</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-[12px] border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-navy text-left text-[11px] tracking-wide text-white uppercase">
                    <th className="px-3.5 py-2.5 font-semibold">Nº</th>
                    <th className="px-3.5 py-2.5 font-semibold">Cliente</th>
                    <th className="px-3.5 py-2.5 font-semibold">Status</th>
                    <th className="px-3.5 py-2.5 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((quote) => {
                    const customer = Array.isArray(quote.customers) ? quote.customers[0] : quote.customers;
                    return (
                      <tr key={quote.id} className="border-t border-border bg-white hover:bg-paper/70">
                        <td className="px-3.5 py-3 align-middle">
                          <Link href={`/admin/orcamentos/${quote.id}`} className="font-semibold text-navy hover:underline">
                            {quote.number}
                          </Link>
                          <span className="mt-0.5 block truncate text-[12px] text-muted">{quote.title}</span>
                        </td>
                        <td className="px-3.5 py-3 align-middle text-navy">{customer?.legal_name ?? '—'}</td>
                        <td className="px-3.5 py-3 align-middle">
                          <QuoteStatusBadge status={quote.status as QuoteStatus} />
                        </td>
                        <td className="px-3.5 py-3 align-middle whitespace-nowrap text-muted">
                          {formatDateBr(quote.created_at.slice(0, 10))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>

        <ContentCard
          className="xl:col-span-2"
          title="Equipamentos mais solicitados"
          description="Ranking pelos itens usados em orçamentos."
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/equipamentos">
                <Truck className="h-3.5 w-3.5" />
                Frota
              </Link>
            </Button>
          }
        >
          {topEquipment.length === 0 ? (
            <EmptyState title="Sem itens suficientes" text="Os equipamentos aparecem após o uso em orçamentos." />
          ) : (
            <EquipmentBars data={topEquipment} />
          )}
        </ContentCard>
      </div>
    </div>
  );
}

function QuickStat({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof ClipboardList;
  label: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-border hover:bg-paper"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-soft text-info">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[12px] text-muted">{label}</p>
        <p className="text-lg font-bold tabular-nums text-navy">{value}</p>
      </div>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted" />
    </Link>
  );
}
