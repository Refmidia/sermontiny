import Link from 'next/link';
import { CircleDollarSign, FileCheck2, FileSignature, Percent } from 'lucide-react';
import { requirePermission } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/page-header';
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

function versionOf(row: { quote_versions: { total_cents?: number; status?: string } | { total_cents?: number; status?: string }[] | null }) {
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
  const supabase = await createClient();
  const now = new Date();
  const currentKey = monthKey(now);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousKey = monthKey(previous);

  const [quotes, contracts, recentQuotes, datedQuotes, topItems] = await Promise.all([
    supabase.from('quotes').select('id, status, created_at, quote_versions:current_version_id(total_cents, status)').is('deleted_at', null),
    supabase.from('contracts').select('id, status, total_cents, created_at').is('deleted_at', null),
    supabase
      .from('quotes')
      .select('id, number, title, status, created_at, customers(legal_name)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('quotes').select('created_at, status, quote_versions:current_version_id(total_cents, status)').is('deleted_at', null),
    supabase.from('quote_items').select('description, equipment_id, equipment(name)').limit(200),
  ]);

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
    (datedQuotes.data ?? []).filter((row) => monthKey(new Date(row.created_at)) === key && isApproved(row.status, versionOf(row)?.status)).length;

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
    { name: 'Em análise', value: (statusCounts.get('in_review') ?? 0) + (statusCounts.get('sent') ?? 0) + (statusCounts.get('viewed') ?? 0), color: '#D6A72C' },
    { name: 'Recusados', value: statusCounts.get('rejected') ?? 0, color: '#66758A' },
    { name: 'Rascunho', value: statusCounts.get('draft') ?? 0, color: '#DDE4EC' },
  ].filter((item) => item.value > 0);

  const counts = new Map<string, number>();
  for (const item of topItems.data ?? []) {
    const equipment = Array.isArray(item.equipment) ? item.equipment[0] : item.equipment;
    const name = equipment?.name || item.description;
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const topEquipment = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count }));

  const recent = recentQuotes.error ? [] : (recentQuotes.data ?? []);
  const hasQuotes = issued > 0;

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="Acompanhe orçamentos, conversão e contratos com os dados reais da operação."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Visão geral' }]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/clientes/novo">Novo cliente</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/orcamentos/novo">Novo orçamento</Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          featured
          label="Total orçado"
          value={formatBRL(quotedTotal)}
          icon={CircleDollarSign}
          tooltip="Soma do valor da versão atual de todos os orçamentos não excluídos."
          change={quotedChange === null ? null : { value: formatPercentChange(quotedChange), positive: quotedChange >= 0 }}
        />
        <StatCard
          label="Total aprovado"
          value={formatBRL(approvedTotal)}
          icon={FileCheck2}
          tooltip="Soma dos orçamentos com status aprovado ou convertido em contrato."
          change={approvedChange === null ? null : { value: formatPercentChange(approvedChange), positive: approvedChange >= 0 }}
        />
        <StatCard
          label="Contratos ativos"
          value={String(activeContracts)}
          icon={FileSignature}
          tooltip="Contratos com status ativo no momento."
          change={contractsChange === null ? null : { value: formatPercentChange(contractsChange), positive: contractsChange >= 0 }}
        />
        <StatCard
          label="Taxa de conversão"
          value={`${conversion.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}
          icon={Percent}
          tooltip="Orçamentos aprovados ou convertidos dividido pelo total de orçamentos."
          change={conversionChange === null ? null : { value: formatPercentChange(conversionChange), positive: conversionChange >= 0 }}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-5">
        <ContentCard
          className="xl:col-span-3"
          title="Desempenho de orçamentos"
          description="Valor orçado e aprovado nos últimos seis meses."
        >
          {hasQuotes ? (
            <QuotePerformanceChart data={monthly.map(({ month, quoted, approved }) => ({ month, quoted, approved }))} />
          ) : (
            <EmptyState
              title="Ainda não há orçamentos"
              text="Os gráficos aparecem quando existir pelo menos um orçamento cadastrado."
              action={
                <Button asChild>
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

      <div className="mt-6 grid gap-4 xl:grid-cols-5">
        <ContentCard
          className="xl:col-span-3"
          title="Orçamentos recentes"
          actions={
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/orcamentos">Ver todos</Link>
            </Button>
          }
        >
          {recent.length === 0 ? (
            <EmptyState
              title="Nenhum orçamento recente"
              text="Crie a primeira proposta comercial para começar o acompanhamento."
              action={
                <Button asChild>
                  <Link href="/admin/orcamentos/novo">Criar primeiro orçamento</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-paper-strong text-left text-[12px] text-muted">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Nº</th>
                    <th className="px-3 py-2 font-semibold">Cliente</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((quote) => {
                    const customer = Array.isArray(quote.customers) ? quote.customers[0] : quote.customers;
                    return (
                      <tr key={quote.id} className="border-t border-border">
                        <td className="px-3 py-3">
                          <Link href={`/admin/orcamentos/${quote.id}`} className="font-medium text-navy hover:underline">
                            {quote.number}
                          </Link>
                          <span className="block text-[12px] text-muted">{quote.title}</span>
                        </td>
                        <td className="px-3 py-3">{customer?.legal_name ?? '—'}</td>
                        <td className="px-3 py-3">
                          <QuoteStatusBadge status={quote.status as QuoteStatus} />
                        </td>
                        <td className="px-3 py-3 text-muted">{formatDateBr(quote.created_at.slice(0, 10))}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </ContentCard>
        <ContentCard className="xl:col-span-2" title="Equipamentos mais solicitados">
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
