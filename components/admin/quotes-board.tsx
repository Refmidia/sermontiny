'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Banknote,
  Check,
  CheckCircle2,
  Download,
  FileText,
  Filter,
  ImageDown,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  Printer,
  Search,
  Send,
  Trash2,
} from 'lucide-react';
import { createContractFromQuote } from '@/app/actions/contracts';
import { softDeleteQuote } from '@/app/actions/quotes';
import { EmptyState } from '@/components/admin/empty-state';
import { PageActionBar } from '@/components/admin/page-action-bar';
import { PageHeader } from '@/components/admin/page-header';
import { QuotePaymentsDialog } from '@/components/admin/quote-payments-dialog';
import { QuoteStatusBadge } from '@/components/admin/status-badge';
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
import { QUOTE_STATUS_LABELS, type QuoteStatus } from '@/types/database';

const PAGE_SIZE = 10;

type CustomerBoard = {
  id?: string;
  legal_name: string;
  phone?: string | null;
  whatsapp_ddi?: string | null;
  whatsapp_number?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

type UnitBoard = {
  name: string;
  street?: string | null;
  number?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
};

type VersionBoard = {
  total_cents: number;
  version_number: number;
  valid_until: string | null;
};

export type QuoteBoardRow = {
  id: string;
  number: string;
  title: string;
  status: QuoteStatus;
  created_at?: string;
  customer_id?: string | null;
  customers: CustomerBoard | CustomerBoard[] | null;
  customer_units?: UnitBoard | UnitBoard[] | null;
  quote_versions?: VersionBoard | VersionBoard[] | null;
  quote_payments?: Array<{ amount_cents: number; deleted_at?: string | null }> | null;
  contracts?: Array<{ id: string; deleted_at?: string | null }> | null;
};

type FilterKey = 'all' | QuoteStatus;
type SortKey = 'recent' | 'oldest' | 'value_desc' | 'value_asc' | 'number_asc';

function asOne<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function customerName(row: QuoteBoardRow) {
  return asOne(row.customers)?.legal_name ?? '—';
}

function customerId(row: QuoteBoardRow) {
  return row.customer_id || asOne(row.customers)?.id || null;
}

function versionInfo(row: QuoteBoardRow) {
  return asOne(row.quote_versions);
}

function unitInfo(row: QuoteBoardRow) {
  return asOne(row.customer_units);
}

function unitName(row: QuoteBoardRow) {
  return unitInfo(row)?.name ?? null;
}

function receivedCents(row: QuoteBoardRow) {
  return (row.quote_payments ?? [])
    .filter((payment) => !payment.deleted_at)
    .reduce((sum, payment) => sum + (payment.amount_cents || 0), 0);
}

function contractId(row: QuoteBoardRow) {
  return (row.contracts ?? []).find((contract) => !contract.deleted_at)?.id ?? null;
}

function buildAddress(parts: {
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
} | null) {
  if (!parts) return null;
  const line = [
    [parts.street, parts.number].filter(Boolean).join(', '),
    parts.complement,
    parts.district,
    [parts.city, parts.state].filter(Boolean).join(' - '),
    parts.zip,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(' · ');
  return line || null;
}

function customerAddress(row: QuoteBoardRow) {
  return buildAddress(unitInfo(row)) || buildAddress(asOne(row.customers));
}

function mapsHref(row: QuoteBoardRow) {
  const address = customerAddress(row);
  if (!address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function customerPhoneLabel(row: QuoteBoardRow) {
  const customer = asOne(row.customers);
  if (!customer) return null;
  const raw =
    (customer.whatsapp_number
      ? `${customer.whatsapp_ddi || '55'}${customer.whatsapp_number}`
      : null) || customer.phone;
  if (!raw) return null;
  return formatPhoneBr(raw);
}

function customerWhatsApp(row: QuoteBoardRow) {
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

function downloadPdf(id: string, number: string) {
  const link = document.createElement('a');
  link.href = `/api/quotes/${id}/pdf?download=1`;
  link.download = `${number}.pdf`;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  toast.success('Download do PDF iniciado.');
}

function downloadImage(id: string) {
  window.open(`/admin/orcamentos/${id}/imprimir?export=png`, '_blank', 'noopener,noreferrer');
}

export function QuotesBoard({
  data,
  canWrite,
  canConvert,
  canDelete,
}: {
  data: QuoteBoardRow[];
  canWrite: boolean;
  canConvert: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [receivedOverrides, setReceivedOverrides] = useState<Record<string, number>>({});

  const kpis = useMemo(() => {
    const total = data.length;
    const drafts = data.filter((row) => row.status === 'draft').length;
    const sent = data.filter((row) => row.status === 'sent' || row.status === 'viewed').length;
    const approved = data.filter((row) => row.status === 'approved' || row.status === 'converted').length;
    return { total, drafts, sent, approved };
  }, [data]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = data.filter((row) => {
      if (filter !== 'all' && row.status !== filter) return false;
      if (!q) return true;
      const version = versionInfo(row);
      const haystack = [
        row.number,
        row.title,
        customerName(row),
        unitName(row),
        customerPhoneLabel(row),
        customerAddress(row),
        version?.version_number,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    list.sort((a, b) => {
      const av = versionInfo(a);
      const bv = versionInfo(b);
      if (sort === 'value_desc') return (bv?.total_cents ?? 0) - (av?.total_cents ?? 0);
      if (sort === 'value_asc') return (av?.total_cents ?? 0) - (bv?.total_cents ?? 0);
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

  function exportCsv() {
    const header = ['Número', 'Cliente', 'Telefone', 'Endereço', 'Valor', 'Recebido', 'Status', 'Criado em'];
    const lines = filtered.map((row) => {
      const version = versionInfo(row);
      const received = receivedOverrides[row.id] ?? receivedCents(row);
      return [
        row.number,
        customerName(row),
        customerPhoneLabel(row) ?? '',
        customerAddress(row) ?? '',
        formatBRL(version?.total_cents ?? 0),
        formatBRL(received),
        QUOTE_STATUS_LABELS[row.status],
        row.created_at ? formatDateBr(row.created_at.slice(0, 10)) : '',
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(';');
    });
    const blob = new Blob([[header.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `orcamentos-sermontiny-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const chips: Array<{ value: FilterKey; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'draft', label: 'Rascunhos' },
    { value: 'sent', label: 'Enviados' },
    { value: 'approved', label: 'Aprovados' },
    { value: 'rejected', label: 'Reprovados' },
    { value: 'converted', label: 'Convertidos' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Orçamentos"
        description="Recebimentos, materiais e conversão em contrato em um só lugar."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Orçamentos' }]}
        actions={
          <PageActionBar>
            <Button type="button" variant="outline" onClick={exportCsv}>
              <Download />
              Exportar
            </Button>
            {canWrite ? (
              <Button asChild variant="gold">
                <Link href="/admin/orcamentos/novo">
                  <Plus />
                  Novo orçamento
                </Link>
              </Button>
            ) : null}
          </PageActionBar>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={FileText} label="Total de orçamentos" value={kpis.total} hint="Propostas cadastradas" tone="bg-info-soft text-info" />
        <KpiCard icon={Pencil} label="Rascunhos" value={kpis.drafts} hint="Em elaboração" tone="bg-paper-strong text-muted" />
        <KpiCard icon={Send} label="Enviados" value={kpis.sent} hint="Aguardando retorno" tone="bg-info-soft text-info" />
        <KpiCard
          icon={CheckCircle2}
          label="Aprovados"
          value={kpis.approved}
          hint="Aprovados ou convertidos"
          tone="bg-success-soft text-success"
        />
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
                placeholder="Buscar por número, cliente, telefone ou endereço"
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
                aria-label="Ordenar orçamentos"
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
                title="Nenhum orçamento encontrado"
                text="Ajuste a busca ou os filtros, ou crie a primeira proposta."
                action={
                  canWrite ? (
                    <Button asChild variant="gold">
                      <Link href="/admin/orcamentos/novo">
                        <Plus />
                        Novo orçamento
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[1100px] text-left text-sm">
                  <thead className="border-b border-border bg-paper text-[11px] tracking-wide text-muted uppercase">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">ID</th>
                      <th className="px-3 py-2.5 font-semibold">Cliente</th>
                      <th className="px-3 py-2.5 font-semibold">Telefone</th>
                      <th className="px-3 py-2.5 font-semibold">Endereço</th>
                      <th className="px-3 py-2.5 font-semibold">Valor</th>
                      <th className="px-3 py-2.5 font-semibold">Recebido</th>
                      <th className="w-0 whitespace-nowrap px-3 py-2.5 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((row) => (
                      <QuoteTableRow
                        key={row.id}
                        row={row}
                        canWrite={canWrite}
                        canConvert={canConvert}
                        canDelete={canDelete}
                        received={receivedOverrides[row.id] ?? receivedCents(row)}
                        onReceivedChange={(value) => {
                          setReceivedOverrides((current) => ({ ...current, [row.id]: value }));
                          router.refresh();
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 xl:hidden">
                {pageItems.map((row) => (
                  <QuoteMobileCard
                    key={row.id}
                    row={row}
                    canWrite={canWrite}
                    canConvert={canConvert}
                    canDelete={canDelete}
                    received={receivedOverrides[row.id] ?? receivedCents(row)}
                    onReceivedChange={(value) => {
                      setReceivedOverrides((current) => ({ ...current, [row.id]: value }));
                      router.refresh();
                    }}
                  />
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

function IconAction({
  label,
  href,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  href?: string | null;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const buttonClass = cn(
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40',
    className,
  );

  const content =
    href && !disabled ? (
      <a
        href={href}
        target={href.startsWith('http') || href.includes('/imprimir') ? '_blank' : undefined}
        rel="noreferrer"
        className={buttonClass}
        aria-label={label}
      >
        {children}
      </a>
    ) : (
      <button type="button" className={buttonClass} aria-label={label} disabled={disabled} onClick={onClick}>
        {children}
      </button>
    );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function ChipLink({
  href,
  disabled,
  children,
  className,
}: {
  href?: string | null;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const classes = cn(
    'inline-flex h-9 max-w-full items-center gap-1.5 rounded-xl border px-2.5 text-[12px] font-semibold transition',
    disabled || !href
      ? 'cursor-not-allowed border-border bg-paper text-muted opacity-60'
      : className,
  );

  if (!href || disabled) {
    return <span className={classes}>{children}</span>;
  }

  return (
    <a href={href} target="_blank" rel="noreferrer" className={classes}>
      {children}
    </a>
  );
}

function QuoteActions({
  row,
  canWrite,
  canConvert,
  canDelete,
  received,
  onReceivedChange,
  paymentsOpen: paymentsOpenProp,
  onPaymentsOpenChange,
}: {
  row: QuoteBoardRow;
  canWrite: boolean;
  canConvert: boolean;
  canDelete: boolean;
  received: number;
  onReceivedChange: (value: number) => void;
  paymentsOpen?: boolean;
  onPaymentsOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalPaymentsOpen, setInternalPaymentsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const paymentsOpen = paymentsOpenProp ?? internalPaymentsOpen;
  const [pendingConvert, startConvert] = useTransition();
  const [pendingDelete, startDelete] = useTransition();
  const wa = customerWhatsApp(row);
  const previewHref = `/admin/orcamentos/${row.id}/imprimir`;
  const totalCents = versionInfo(row)?.total_cents ?? 0;
  const existingContractId = contractId(row);
  const alreadyConverted = row.status === 'converted' || Boolean(existingContractId);

  function openPayments(open: boolean) {
    if (onPaymentsOpenChange) onPaymentsOpenChange(open);
    else setInternalPaymentsOpen(open);
  }

  function handleConfirmContract() {
    if (existingContractId) {
      router.push(`/admin/contratos/${existingContractId}`);
      return;
    }
    if (!canConvert) {
      toast.error('Sem permissão para criar contratos.');
      return;
    }
    setConfirmOpen(true);
  }

  function runConvert() {
    startConvert(async () => {
      const result = await createContractFromQuote(row.id);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      if (!('contractId' in result) || !result.contractId) {
        toast.error('Não foi possível gerar o contrato.');
        return;
      }
      toast.success('Contrato gerado com sucesso.');
      router.push(`/admin/contratos/${result.contractId}`);
      router.refresh();
    });
  }

  function runDelete() {
    startDelete(async () => {
      const result = await softDeleteQuote(row.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Orçamento excluído.');
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="inline-flex flex-nowrap items-center gap-1.5">
        <IconAction
          label="Recebimentos"
          className="border-border bg-white text-navy hover:border-navy/30 hover:bg-paper"
          onClick={() => openPayments(true)}
        >
          <Banknote className="h-4 w-4" />
        </IconAction>
        <IconAction
          label={alreadyConverted ? 'Abrir contrato' : 'Confirmar → contrato'}
          className="border-transparent bg-navy text-white hover:bg-navy-secondary"
          disabled={pendingConvert || (!canConvert && !existingContractId)}
          onClick={handleConfirmContract}
        >
          <Check className="h-4 w-4" strokeWidth={2.5} />
        </IconAction>
        <IconAction
          label="Ver orçamento"
          className="border-border bg-white text-navy hover:border-navy/30 hover:bg-paper"
          href={previewHref}
        >
          <FileText className="h-4 w-4" />
        </IconAction>
        <IconAction
          label="WhatsApp"
          className="border-transparent bg-[#25D366] text-white hover:bg-[#1ebe57]"
          href={wa}
          disabled={!wa}
        >
          <WhatsAppIcon className="h-4 w-4 text-white" />
        </IconAction>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0 rounded-xl border-border bg-navy text-white hover:bg-navy/90 hover:text-white"
              aria-label="Mais ações"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <a href={previewHref} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-2 h-4 w-4" />
                Ver orçamento
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/admin/orcamentos/${row.id}`}>
                <FileText className="mr-2 h-4 w-4" />
                Abrir ficha
              </Link>
            </DropdownMenuItem>
            {canWrite ? (
              <DropdownMenuItem asChild>
                <Link href={`/admin/orcamentos/${row.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                openPayments(true);
              }}
            >
              <Banknote className="mr-2 h-4 w-4" />
              Recebimentos
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={pendingConvert || (!canConvert && !existingContractId)}
              onSelect={(event) => {
                event.preventDefault();
                handleConfirmContract();
              }}
            >
              <Check className="mr-2 h-4 w-4" />
              {alreadyConverted ? 'Abrir contrato' : 'Confirmar → contrato'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                downloadPdf(row.id, row.number);
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Baixar PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                downloadImage(row.id);
              }}
            >
              <ImageDown className="mr-2 h-4 w-4" />
              Baixar imagem
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={previewHref} target="_blank" rel="noopener noreferrer">
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </a>
            </DropdownMenuItem>
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
                  Excluir orçamento
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <QuotePaymentsDialog
        open={paymentsOpen}
        onOpenChange={openPayments}
        quoteId={row.id}
        quoteNumber={row.number}
        customerName={customerName(row)}
        totalCents={totalCents}
        canWrite={canWrite}
        onReceivedChange={onReceivedChange}
        initialReceivedCents={received}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Gerar contrato</AlertDialogTitle>
            <AlertDialogDescription>
              Confirmar o orçamento <span className="font-semibold text-navy">{row.number}</span>
              {customerName(row) !== '—' ? (
                <>
                  {' '}
                  de <span className="font-semibold text-navy">{customerName(row)}</span>
                </>
              ) : null}{' '}
              e gerar o contrato agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingConvert}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pendingConvert}
              onClick={(event) => {
                event.preventDefault();
                setConfirmOpen(false);
                runConvert();
              }}
            >
              {pendingConvert ? 'Gerando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Excluir orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir o orçamento <span className="font-semibold text-navy">{row.number}</span>? Ele sai da lista
              do painel.
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

function QuoteTableRow({
  row,
  canWrite,
  canConvert,
  canDelete,
  received,
  onReceivedChange,
}: {
  row: QuoteBoardRow;
  canWrite: boolean;
  canConvert: boolean;
  canDelete: boolean;
  received: number;
  onReceivedChange: (value: number) => void;
}) {
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const version = versionInfo(row);
  const total = version?.total_cents ?? 0;
  const clientId = customerId(row);
  const phone = customerPhoneLabel(row);
  const wa = customerWhatsApp(row);
  const map = mapsHref(row);

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-paper/70">
      <td className="px-3 py-2.5 align-middle whitespace-nowrap">
        <Link href={`/admin/orcamentos/${row.id}`} className="font-semibold text-navy hover:underline">
          #{row.number.replace(/^#/, '')}
        </Link>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <div className="min-w-0">
          {clientId ? (
            <Link href={`/admin/clientes/${clientId}`} className="block truncate font-semibold text-navy hover:underline">
              {customerName(row)}
            </Link>
          ) : (
            <p className="truncate font-semibold text-navy">{customerName(row)}</p>
          )}
          {unitName(row) ? <p className="truncate text-[12px] text-muted">{unitName(row)}</p> : null}
        </div>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <ChipLink
          href={wa}
          disabled={!wa}
          className="border-border bg-white text-navy hover:border-navy/30 hover:bg-paper"
        >
          <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
          <span className="truncate">{phone ?? 'Sem telefone'}</span>
        </ChipLink>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <ChipLink
          href={map}
          disabled={!map}
          className="border-border bg-white text-navy hover:border-navy/30 hover:bg-paper"
        >
          <MapPin className="h-3.5 w-3.5 text-muted" />
          Mapa
        </ChipLink>
      </td>
      <td className="px-3 py-2.5 align-middle whitespace-nowrap font-semibold text-navy">{formatBRL(total)}</td>
      <td className="px-3 py-2.5 align-middle">
        <button
          type="button"
          onClick={() => setPaymentsOpen(true)}
          className="inline-flex max-w-full items-center rounded-full border border-border bg-paper px-2.5 py-1.5 text-[12px] font-semibold text-navy transition hover:border-navy/30 hover:bg-white"
          title="Registrar ou ver recebimentos"
        >
          <span className="truncate">
            {formatBRL(received)} / {formatBRL(total)}
          </span>
        </button>
      </td>
      <td className="w-0 whitespace-nowrap px-3 py-2.5 align-middle">
        <QuoteActions
          row={row}
          canWrite={canWrite}
          canConvert={canConvert}
          canDelete={canDelete}
          received={received}
          onReceivedChange={onReceivedChange}
          paymentsOpen={paymentsOpen}
          onPaymentsOpenChange={setPaymentsOpen}
        />
      </td>
    </tr>
  );
}

function QuoteMobileCard({
  row,
  canWrite,
  canConvert,
  canDelete,
  received,
  onReceivedChange,
}: {
  row: QuoteBoardRow;
  canWrite: boolean;
  canConvert: boolean;
  canDelete: boolean;
  received: number;
  onReceivedChange: (value: number) => void;
}) {
  const [paymentsOpen, setPaymentsOpen] = useState(false);
  const version = versionInfo(row);
  const total = version?.total_cents ?? 0;
  const phone = customerPhoneLabel(row);
  const wa = customerWhatsApp(row);
  const map = mapsHref(row);

  return (
    <article className="rounded-[12px] border border-border bg-paper p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-navy">#{row.number.replace(/^#/, '')}</h3>
          <p className="mt-0.5 truncate text-sm font-semibold text-navy">{customerName(row)}</p>
          <p className="mt-1 text-sm font-semibold text-navy">{formatBRL(total)}</p>
        </div>
        <QuoteStatusBadge status={row.status} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ChipLink
          href={wa}
          disabled={!wa}
          className="border-border bg-white text-navy hover:border-navy/30 hover:bg-paper"
        >
          <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
          <span className="truncate">{phone ?? 'Sem telefone'}</span>
        </ChipLink>
        <ChipLink
          href={map}
          disabled={!map}
          className="border-border bg-white text-navy hover:border-navy/30 hover:bg-paper"
        >
          <MapPin className="h-3.5 w-3.5 text-muted" />
          Mapa
        </ChipLink>
        <button
          type="button"
          onClick={() => setPaymentsOpen(true)}
          className="inline-flex items-center rounded-full border border-border bg-white px-2.5 py-1.5 text-[12px] font-semibold text-navy"
        >
          {formatBRL(received)} / {formatBRL(total)}
        </button>
      </div>

      <div className="mt-3">
        <QuoteActions
          row={row}
          canWrite={canWrite}
          canConvert={canConvert}
          canDelete={canDelete}
          received={received}
          onReceivedChange={onReceivedChange}
          paymentsOpen={paymentsOpen}
          onPaymentsOpenChange={setPaymentsOpen}
        />
      </div>
    </article>
  );
}
