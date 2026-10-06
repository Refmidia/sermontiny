'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CheckCircle2,
  FileSignature,
  FileText,
  Filter,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { softDeleteContract } from '@/app/actions/contracts';
import { EmptyState } from '@/components/admin/empty-state';
import { PageActionBar } from '@/components/admin/page-action-bar';
import { PageHeader } from '@/components/admin/page-header';
import { ContractStatusBadge } from '@/components/admin/status-badge';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDateBr, formatPhoneBr, toWhatsAppDigits } from '@/lib/format';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';
import { CONTRACT_STATUS_LABELS, type ContractStatus } from '@/types/database';

const PAGE_SIZE = 10;

type CustomerBoard = {
  id?: string;
  legal_name: string;
  phone?: string | null;
  whatsapp_ddi?: string | null;
  whatsapp_number?: string | null;
};

type QuoteBoard = {
  id?: string;
  number: string;
};

export type ContractBoardRow = {
  id: string;
  number: string;
  object: string;
  status: ContractStatus;
  total_cents: number;
  starts_on?: string | null;
  ends_on?: string | null;
  signed_at?: string | null;
  created_at?: string;
  quote_id?: string | null;
  customers?: CustomerBoard | CustomerBoard[] | null;
  quotes?: QuoteBoard | QuoteBoard[] | null;
};

type FilterKey = 'all' | ContractStatus;
type SortKey = 'recent' | 'oldest' | 'value_desc' | 'value_asc' | 'number_asc';

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function customerName(row: ContractBoardRow) {
  return asOne(row.customers)?.legal_name ?? '—';
}

function customerId(row: ContractBoardRow) {
  return asOne(row.customers)?.id ?? null;
}

function quoteInfo(row: ContractBoardRow) {
  return asOne(row.quotes);
}

function customerWhatsApp(row: ContractBoardRow) {
  const customer = asOne(row.customers);
  if (!customer) return null;
  const raw =
    (customer.whatsapp_number
      ? `${customer.whatsapp_ddi || '55'}${customer.whatsapp_number}`
      : null) || customer.phone;
  if (!raw) return null;
  const digits = toWhatsAppDigits(raw);
  return digits ? `https://wa.me/${digits}` : null;
}

function customerPhoneLabel(row: ContractBoardRow) {
  const customer = asOne(row.customers);
  if (!customer) return null;
  const raw =
    (customer.whatsapp_number
      ? `${customer.whatsapp_ddi || '55'}${customer.whatsapp_number}`
      : null) || customer.phone;
  if (!raw) return null;
  return formatPhoneBr(raw);
}

function periodLabel(row: ContractBoardRow) {
  const parts = [row.starts_on, row.ends_on].filter(Boolean).map((value) => formatDateBr(value as string));
  return parts.length ? parts.join(' — ') : '—';
}

export function ContractsBoard({
  data,
  canWrite,
  canDelete,
  initialQuery = '',
}: {
  data: ContractBoardRow[];
  canWrite: boolean;
  canDelete: boolean;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const kpis = useMemo(() => {
    const total = data.length;
    const drafts = data.filter((row) => row.status === 'draft' || row.status === 'in_review').length;
    const awaiting = data.filter((row) => row.status === 'sent' || row.status === 'awaiting_signature').length;
    const active = data.filter((row) => row.status === 'signed' || row.status === 'active').length;
    return { total, drafts, awaiting, active };
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data.filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false;
      if (!q) return true;
      const haystack = [
        row.number,
        row.object,
        customerName(row),
        quoteInfo(row)?.number,
        customerPhoneLabel(row),
        CONTRACT_STATUS_LABELS[row.status],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    list.sort((a, b) => {
      if (sort === 'value_desc') return (b.total_cents ?? 0) - (a.total_cents ?? 0);
      if (sort === 'value_asc') return (a.total_cents ?? 0) - (b.total_cents ?? 0);
      if (sort === 'number_asc') return a.number.localeCompare(b.number, 'pt-BR');
      const aTime = new Date(a.created_at ?? 0).getTime();
      const bTime = new Date(b.created_at ?? 0).getTime();
      return sort === 'oldest' ? aTime - bTime : bTime - aTime;
    });
    return list;
  }, [data, query, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const chips: Array<{ value: FilterKey; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'draft', label: 'Rascunhos' },
    { value: 'awaiting_signature', label: 'Aguardando assinatura' },
    { value: 'signed', label: 'Assinados' },
    { value: 'active', label: 'Ativos' },
    { value: 'closed', label: 'Encerrados' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contratos"
        description="Acompanhe vigências, assinaturas e documentos em um só lugar."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Contratos' }]}
        actions={
          <PageActionBar>
            {canWrite ? (
              <Button asChild>
                <Link href="/admin/orcamentos?status=approved">
                  <Plus />
                  Novo contrato
                </Link>
              </Button>
            ) : null}
          </PageActionBar>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={FileSignature} label="Total de contratos" value={kpis.total} hint="Cadastrados" tone="bg-info-soft text-info" />
        <KpiCard icon={Pencil} label="Em elaboração" value={kpis.drafts} hint="Rascunho ou revisão" tone="bg-paper-strong text-muted" />
        <KpiCard icon={Send} label="Aguardando" value={kpis.awaiting} hint="Envio ou assinatura" tone="bg-warning-soft text-warning" />
        <KpiCard icon={CheckCircle2} label="Ativos / assinados" value={kpis.active} hint="Em vigência" tone="bg-success-soft text-success" />
      </div>

      <div className="space-y-4">
        <div className="rounded-[12px] border border-border bg-white p-4 shadow-panel">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por número, cliente, objeto ou orçamento"
                className="h-10 pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" className="h-10" onClick={() => setFiltersOpen((open) => !open)}>
                <Filter />
                Filtros
              </Button>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortKey)}
                className="admin-select h-10 min-w-[160px]"
                aria-label="Ordenar contratos"
              >
                <option value="recent">Mais recentes</option>
                <option value="oldest">Mais antigos</option>
                <option value="value_desc">Maior valor</option>
                <option value="value_asc">Menor valor</option>
                <option value="number_asc">Número A–Z</option>
              </select>
            </div>
          </div>

          <div className={cn('mt-3 flex flex-wrap items-center gap-2', !filtersOpen && 'hidden sm:flex')}>
            {chips.map((chip) => {
              const active = filter === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => {
                    setFilter(chip.value);
                    setPage(1);
                  }}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-[12px] font-semibold transition',
                    active
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-navy hover:border-navy/30 hover:bg-paper',
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-[12px] border border-border bg-white shadow-panel">
          {pageItems.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Nenhum contrato encontrado"
                text="Contratos nascem de orçamentos aprovados. Confirme um orçamento para gerar o contrato."
                action={
                  <Button asChild>
                    <Link href="/admin/orcamentos">
                      <FileText />
                      Abrir orçamentos
                    </Link>
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1080px] text-left text-sm">
                  <thead className="border-b border-border bg-paper text-[11px] tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Contrato</th>
                      <th className="px-3 py-2.5 font-semibold">Cliente</th>
                      <th className="px-3 py-2.5 font-semibold">Orçamento</th>
                      <th className="px-3 py-2.5 font-semibold">Valor</th>
                      <th className="px-3 py-2.5 font-semibold">Vigência</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="px-3 py-2.5 font-semibold">Assinatura</th>
                      <th className="w-0 whitespace-nowrap px-3 py-2.5 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((row) => (
                      <ContractTableRow key={row.id} row={row} canWrite={canWrite} canDelete={canDelete} />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 xl:hidden">
                {pageItems.map((row) => (
                  <ContractMobileCard key={row.id} row={row} canWrite={canWrite} canDelete={canDelete} />
                ))}
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[12px] text-muted">
                  Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a {Math.min(currentPage * PAGE_SIZE, filtered.length)} de{' '}
                  {filtered.length} registros
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Anterior
                  </Button>
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-navy px-2 text-sm font-semibold text-white">
                    {currentPage}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: typeof FileText;
  label: string;
  value: number;
  hint: string;
  tone: string;
}) {
  return (
    <div className="rounded-[12px] border border-border bg-white p-4 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-muted">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-navy">{value}</p>
          <p className="mt-1 text-[12px] text-muted">{hint}</p>
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', tone)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ContractActions({ row, canWrite, canDelete }: { row: ContractBoardRow; canWrite: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, startDelete] = useTransition();
  const wa = customerWhatsApp(row);
  const detailHref = `/admin/contratos/${row.id}`;
  const quote = quoteInfo(row);
  const quoteHref = quote?.id ? `/admin/orcamentos/${quote.id}` : row.quote_id ? `/admin/orcamentos/${row.quote_id}` : null;

  function runDelete() {
    startDelete(async () => {
      const result = await softDeleteContract(row.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Contrato excluído.');
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="inline-flex flex-nowrap items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={detailHref}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-navy transition hover:border-navy/30 hover:bg-paper"
              aria-label="Abrir contrato"
            >
              <FileText className="h-4 w-4" />
            </Link>
          </TooltipTrigger>
          <TooltipContent>Abrir contrato</TooltipContent>
        </Tooltip>

        {canWrite ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={detailHref}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent bg-navy text-white transition hover:bg-navy-secondary"
                aria-label="Editar"
              >
                <Pencil className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            {wa ? (
              <a
                href={wa}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent bg-[#25D366] text-white transition hover:bg-[#1ebe57]"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4 text-white" />
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-muted opacity-40"
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </button>
            )}
          </TooltipTrigger>
          <TooltipContent>WhatsApp</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl border-border bg-white text-navy hover:bg-paper"
              aria-label="Mais ações"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild>
              <Link href={detailHref}>
                <FileText className="mr-2 h-4 w-4" />
                Abrir ficha
              </Link>
            </DropdownMenuItem>
            {canWrite ? (
              <DropdownMenuItem asChild>
                <Link href={detailHref}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
            ) : null}
            {quoteHref ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={quoteHref}>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Ver orçamento
                  </Link>
                </DropdownMenuItem>
              </>
            ) : null}
            {canDelete ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-danger focus:text-danger"
                  onSelect={(event) => {
                    event.preventDefault();
                    setDeleteOpen(true);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir contrato
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Excluir contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir o contrato <span className="font-semibold text-navy">{row.number}</span>? Ele sai da lista do
              painel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingDelete}
              className="bg-danger hover:bg-[#8f1c14]"
              onClick={(event) => {
                event.preventDefault();
                runDelete();
              }}
            >
              {pendingDelete ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ContractTableRow({
  row,
  canWrite,
  canDelete,
}: {
  row: ContractBoardRow;
  canWrite: boolean;
  canDelete: boolean;
}) {
  const clientId = customerId(row);
  const quote = quoteInfo(row);

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-paper/70">
      <td className="px-3 py-2.5 align-middle">
        <div className="min-w-0">
          <Link href={`/admin/contratos/${row.id}`} className="block truncate font-semibold text-navy hover:underline">
            {row.number}
          </Link>
          <p className="truncate text-[12px] text-muted">{row.object || '—'}</p>
        </div>
      </td>
      <td className="px-3 py-2.5 align-middle">
        {clientId ? (
          <Link href={`/admin/clientes/${clientId}`} className="block truncate font-medium text-navy hover:underline">
            {customerName(row)}
          </Link>
        ) : (
          <p className="truncate font-medium text-navy">{customerName(row)}</p>
        )}
      </td>
      <td className="px-3 py-2.5 align-middle whitespace-nowrap text-navy">
        {quote?.id ? (
          <Link href={`/admin/orcamentos/${quote.id}`} className="hover:underline">
            {quote.number}
          </Link>
        ) : (
          quote?.number ?? '—'
        )}
      </td>
      <td className="px-3 py-2.5 align-middle whitespace-nowrap font-semibold text-navy">{formatBRL(row.total_cents)}</td>
      <td className="px-3 py-2.5 align-middle whitespace-nowrap text-navy">{periodLabel(row)}</td>
      <td className="px-3 py-2.5 align-middle">
        <ContractStatusBadge status={row.status} />
      </td>
      <td className="px-3 py-2.5 align-middle whitespace-nowrap text-navy">
        {row.signed_at ? formatDateBr(row.signed_at.slice(0, 10)) : 'Pendente'}
      </td>
      <td className="w-0 whitespace-nowrap px-3 py-2.5 align-middle">
        <ContractActions row={row} canWrite={canWrite} canDelete={canDelete} />
      </td>
    </tr>
  );
}

function ContractMobileCard({
  row,
  canWrite,
  canDelete,
}: {
  row: ContractBoardRow;
  canWrite: boolean;
  canDelete: boolean;
}) {
  const quote = quoteInfo(row);
  return (
    <article className="rounded-[12px] border border-border bg-paper p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-navy">{row.number}</h3>
          <p className="mt-0.5 truncate text-sm font-medium text-navy">{customerName(row)}</p>
          <p className="mt-1 text-sm font-semibold text-navy">{formatBRL(row.total_cents)}</p>
          <p className="mt-1 text-[12px] text-muted">{periodLabel(row)}</p>
          {quote?.number ? <p className="mt-1 text-[12px] text-muted">Orçamento {quote.number}</p> : null}
        </div>
        <ContractStatusBadge status={row.status} />
      </div>
      <div className="mt-3">
        <ContractActions row={row} canWrite={canWrite} canDelete={canDelete} />
      </div>
    </article>
  );
}
