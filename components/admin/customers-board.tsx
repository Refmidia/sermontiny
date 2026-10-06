'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Building2,
  Download,
  FileText,
  Filter,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { softDeleteCustomer, updateCustomerStatus } from '@/app/actions/customers';
import { EmptyState } from '@/components/admin/empty-state';
import { PageActionBar } from '@/components/admin/page-action-bar';
import { PageHeader } from '@/components/admin/page-header';
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
import { formatCnpj, formatCpf, formatDateTimeBr, onlyDigits, toWhatsAppDigits } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ContractStatus, Customer, CustomerContact, RecordStatus } from '@/types/database';

const ACTIVE_CONTRACT_STATUSES: ContractStatus[] = ['active', 'signed', 'awaiting_signature'];
const PAGE_SIZE = 10;

export type CustomerRow = Customer & {
  customer_contacts?: CustomerContact[] | null;
  contracts?: Array<{ id: string; status: ContractStatus; deleted_at?: string | null }> | null;
};

type FilterKey = 'all' | 'active' | 'inactive' | 'with_contract';
type SortKey = 'recent' | 'oldest' | 'name_asc' | 'name_desc';

function formatDocument(document: string) {
  const digits = onlyDigits(document);
  if (digits.length === 14) return formatCnpj(digits);
  if (digits.length === 11) return formatCpf(digits);
  return document || '—';
}

function primaryContact(customer: CustomerRow) {
  const contacts = (customer.customer_contacts ?? []).filter((contact) => !contact.deleted_at);
  return contacts.find((contact) => contact.is_primary) ?? contacts[0] ?? null;
}

function activeContractsCount(customer: CustomerRow) {
  return (customer.contracts ?? []).filter(
    (contract) => !contract.deleted_at && ACTIVE_CONTRACT_STATUSES.includes(contract.status),
  ).length;
}

function whatsappHref(customer: CustomerRow, contact: CustomerContact | null) {
  const raw =
    contact?.whatsapp ||
    contact?.phone ||
    (customer.whatsapp_number ? `${customer.whatsapp_ddi || '55'}${customer.whatsapp_number}` : null) ||
    customer.phone;
  if (!raw) return null;
  return `https://wa.me/${toWhatsAppDigits(raw)}`;
}

function emailHref(customer: CustomerRow, contact: CustomerContact | null) {
  const email = contact?.email || customer.email;
  return email ? `mailto:${email}` : null;
}

function segmentLabel(customer: Customer) {
  if (customer.person_type === 'pf') return 'Pessoa física';
  if (customer.trade_name && customer.trade_name !== customer.legal_name) return customer.trade_name;
  return 'Empresa';
}

function isNewThisMonth(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function CustomersBoard({ data, canWrite, canDelete }: { data: CustomerRow[]; canWrite: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, RecordStatus>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [, startTransition] = useTransition();

  const rows = useMemo(
    () => data.map((customer) => (statusOverrides[customer.id] ? { ...customer, status: statusOverrides[customer.id] } : customer)),
    [data, statusOverrides],
  );

  const kpis = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((customer) => customer.status === 'active').length;
    const withContract = rows.filter((customer) => activeContractsCount(customer) > 0).length;
    const novos = rows.filter((customer) => isNewThisMonth(customer.created_at)).length;
    return {
      total,
      active,
      activePct: total ? (active / total) * 100 : 0,
      withContract,
      novos,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((customer) => {
      const contact = primaryContact(customer);
      const contracts = activeContractsCount(customer);
      if (filter === 'active' && customer.status !== 'active') return false;
      if (filter === 'inactive' && customer.status !== 'inactive') return false;
      if (filter === 'with_contract' && contracts === 0) return false;
      if (!q) return true;
      const haystack = [
        customer.legal_name,
        customer.trade_name,
        customer.document,
        customer.city,
        customer.state,
        customer.email,
        customer.phone,
        contact?.name,
        contact?.email,
        contact?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    list.sort((a, b) => {
      if (sort === 'name_asc') return a.legal_name.localeCompare(b.legal_name, 'pt-BR');
      if (sort === 'name_desc') return b.legal_name.localeCompare(a.legal_name, 'pt-BR');
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sort === 'oldest' ? aTime - bTime : bTime - aTime;
    });
    return list;
  }, [rows, query, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function patchStatus(id: string, status: RecordStatus) {
    setStatusOverrides((current) => ({ ...current, [id]: status }));
  }

  function clearOverride(id: string) {
    setStatusOverrides((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function changeStatus(customer: CustomerRow, status: RecordStatus) {
    if (!canWrite || customer.status === status) return;
    const previous = customer.status;
    patchStatus(customer.id, status);
    setPendingId(customer.id);
    startTransition(async () => {
      const result = await updateCustomerStatus(customer.id, status);
      setPendingId(null);
      if (result.error) {
        patchStatus(customer.id, previous);
        toast.error(result.error);
        return;
      }
      clearOverride(customer.id);
      toast.success('Status atualizado com sucesso');
      router.refresh();
    });
  }

  function exportCsv() {
    const header = ['Cliente', 'Documento', 'Cidade', 'UF', 'Status', 'E-mail', 'Telefone', 'Contratos ativos'];
    const lines = filtered.map((customer) => {
      const contact = primaryContact(customer);
      return [
        customer.legal_name,
        formatDocument(customer.document),
        customer.city ?? '',
        customer.state ?? '',
        customer.status === 'active' ? 'Ativo' : 'Inativo',
        contact?.email || customer.email || '',
        contact?.phone || customer.phone || '',
        String(activeContractsCount(customer)),
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(';');
    });
    const blob = new Blob([[header.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `clientes-sermontiny-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const chips: Array<{ value: FilterKey; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Ativos' },
    { value: 'inactive', label: 'Inativos' },
    { value: 'with_contract', label: 'Com contrato' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description="Gerencie clientes, unidades e contatos comerciais."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Clientes' }]}
        actions={
          <PageActionBar>
            <Button type="button" variant="outline" onClick={exportCsv}>
              <Download />
              Exportar
            </Button>
            {canWrite ? (
              <Button asChild>
                <Link href="/admin/clientes/novo">
                  <Plus />
                  Novo cliente
                </Link>
              </Button>
            ) : null}
          </PageActionBar>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Users} label="Total de clientes" value={kpis.total} hint="Empresas cadastradas" tone="bg-info-soft text-info" />
        <KpiCard
          icon={Building2}
          label="Clientes ativos"
          value={kpis.active}
          hint={`${kpis.activePct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da base total`}
          tone="bg-success-soft text-success"
        />
        <KpiCard
          icon={FileText}
          label="Contratos vigentes"
          value={kpis.withContract}
          hint="Clientes com contrato em andamento"
          tone="bg-info-soft text-info"
        />
        <KpiCard
          icon={UserPlus}
          label="Novos este mês"
          value={kpis.novos}
          hint="Novos clientes cadastrados"
          tone="bg-[#FFF4CC] text-[#8a6a12]"
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
                  placeholder="Buscar por empresa, CNPJ, cidade ou contato"
                  className="pl-9"
                  aria-label="Buscar clientes"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFiltersOpen((value) => !value)}>
                  <Filter />
                  Filtros
                </Button>
                <select
                  className="admin-select h-10 min-w-[160px]"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  aria-label="Ordenar clientes"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                  <option value="name_asc">Nome A–Z</option>
                  <option value="name_desc">Nome Z–A</option>
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
              <span className="ml-auto text-[12px] text-muted">{filtered.length} clientes encontrados</span>
            </div>
          </div>

          <div className="rounded-[12px] border border-border bg-white shadow-panel">
            {pageItems.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Nenhum cliente encontrado"
                  text="Ajuste a busca ou cadastre o primeiro cliente da carteira."
                  action={
                    canWrite ? (
                      <Button asChild variant="gold">
                        <Link href="/admin/clientes/novo">
                          <Plus />
                          Novo cliente
                        </Link>
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <>
                <div className="hidden lg:block">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-border bg-paper text-[11px] tracking-wide text-muted uppercase">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Cliente</th>
                        <th className="px-3 py-2.5 font-semibold">Documento</th>
                        <th className="hidden px-3 py-2.5 font-semibold xl:table-cell">Localização</th>
                        <th className="px-3 py-2.5 font-semibold">Contato principal</th>
                        <th className="px-3 py-2.5 font-semibold">Contratos</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="w-0 whitespace-nowrap px-3 py-2.5 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((customer) => (
                        <CustomerTableRow
                          key={customer.id}
                          customer={customer}
                          canWrite={canWrite}
                          canDelete={canDelete}
                          pending={pendingId === customer.id}
                          onStatus={(status) => changeStatus(customer, status)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-3 lg:hidden">
                  {pageItems.map((customer) => (
                    <CustomerMobileCard
                      key={customer.id}
                      customer={customer}
                      canWrite={canWrite}
                      canDelete={canDelete}
                      pending={pendingId === customer.id}
                      onStatus={(status) => changeStatus(customer, status)}
                    />
                  ))}
                </div>

                <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[12px] text-muted">
                    Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a{' '}
                    {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} registros
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
  icon: typeof Users;
  label: string;
  value: number;
  hint: string;
  tone: string;
}) {
  return (
    <article className="rounded-[12px] border border-border bg-white px-4 py-3 shadow-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-muted">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-navy">{value}</p>
          <p className="mt-1 text-[11px] text-muted">{hint}</p>
        </div>
        <span className={cn('inline-flex h-9 w-9 items-center justify-center rounded-lg', tone)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </article>
  );
}

function StatusSelect({
  value,
  disabled,
  pending,
  onChange,
}: {
  value: RecordStatus;
  disabled?: boolean;
  pending?: boolean;
  onChange: (status: RecordStatus) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled || pending}
      aria-label="Status do cliente"
      onChange={(event) => onChange(event.target.value as RecordStatus)}
      className={cn(
        'h-8 min-w-[100px] max-w-full appearance-none rounded-lg border px-2.5 pr-7 text-[12px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-gold/50 disabled:opacity-70',
        value === 'active'
          ? 'border-success/30 bg-success-soft text-success'
          : 'border-border bg-paper-strong text-muted',
      )}
    >
      <option value="active">Ativo</option>
      <option value="inactive">Inativo</option>
    </select>
  );
}

function ActionIcon({
  label,
  href,
  disabled,
  children,
}: {
  label: string;
  href?: string | null;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const content =
    href && !disabled ? (
      <Button asChild type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label={label}>
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {children}
        </a>
      </Button>
    ) : (
      <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" disabled aria-label={label}>
        {children}
      </Button>
    );
  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function CustomerActions({ customer, canDelete }: { customer: CustomerRow; canDelete: boolean }) {
  const router = useRouter();
  const contact = primaryContact(customer);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDelete, startDelete] = useTransition();

  function runDelete() {
    startDelete(async () => {
      const result = await softDeleteCustomer(customer.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Cliente excluído.');
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="inline-flex flex-nowrap items-center gap-1">
        <ActionIcon label="WhatsApp" href={whatsappHref(customer, contact)}>
          <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
        </ActionIcon>
        <ActionIcon label="E-mail" href={emailHref(customer, contact)}>
          <Mail className="h-3.5 w-3.5" />
        </ActionIcon>
        <ActionIcon label="Novo orçamento" href={`/admin/orcamentos/novo?customer=${customer.id}`}>
          <FileText className="h-3.5 w-3.5" />
        </ActionIcon>
        <ActionIcon label="Editar cliente" href={`/admin/clientes/${customer.id}`}>
          <Pencil className="h-3.5 w-3.5" />
        </ActionIcon>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label="Mais ações">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/clientes/${customer.id}`}>Ver cliente</Link>
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
                  Excluir cliente
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Excluir cliente</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir <span className="font-semibold text-navy">{customer.legal_name}</span>? O cliente sai da lista
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

function CustomerTableRow({
  customer,
  canWrite,
  canDelete,
  pending,
  onStatus,
}: {
  customer: CustomerRow;
  canWrite: boolean;
  canDelete: boolean;
  pending: boolean;
  onStatus: (status: RecordStatus) => void;
}) {
  const contact = primaryContact(customer);
  const contracts = activeContractsCount(customer);
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-paper/70">
      <td className="px-3 py-2.5 align-middle">
        <div className="min-w-0">
          <Link href={`/admin/clientes/${customer.id}`} className="block truncate font-semibold text-navy hover:underline">
            {customer.legal_name}
          </Link>
          <p className="truncate text-[12px] text-muted">{segmentLabel(customer)}</p>
        </div>
      </td>
      <td className="px-3 py-2.5 align-middle whitespace-nowrap text-navy">{formatDocument(customer.document)}</td>
      <td className="hidden px-3 py-2.5 align-middle text-navy xl:table-cell">
        <span className="line-clamp-2">
          {customer.city ? `${customer.city}${customer.state ? ` - ${customer.state}` : ''}` : '—'}
        </span>
      </td>
      <td className="px-3 py-2.5 align-middle">
        {contact ? (
          <div className="min-w-0">
            <p className="truncate font-medium text-navy">{contact.name}</p>
            <p className="truncate text-[12px] text-muted">{contact.phone || contact.email || contact.role || 'Contato'}</p>
          </div>
        ) : (
          <span className="truncate text-muted">{customer.phone || customer.email || 'Sem contato'}</span>
        )}
      </td>
      <td className="px-3 py-2.5 align-middle">
        {contracts > 0 ? (
          <span className="font-medium text-navy">
            {contracts} {contracts === 1 ? 'ativo' : 'ativos'}
          </span>
        ) : (
          <span className="text-muted">Sem contrato</span>
        )}
      </td>
      <td className="px-3 py-2.5 align-middle">
        <StatusSelect value={customer.status} disabled={!canWrite} pending={pending} onChange={onStatus} />
      </td>
      <td className="w-0 whitespace-nowrap px-3 py-2.5 align-middle">
        <CustomerActions customer={customer} canDelete={canDelete} />
      </td>
    </tr>
  );
}

function CustomerMobileCard({
  customer,
  canWrite,
  canDelete,
  pending,
  onStatus,
}: {
  customer: CustomerRow;
  canWrite: boolean;
  canDelete: boolean;
  pending: boolean;
  onStatus: (status: RecordStatus) => void;
}) {
  const contact = primaryContact(customer);
  const contracts = activeContractsCount(customer);
  return (
    <article className="rounded-[12px] border border-border bg-paper p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-navy">{customer.legal_name}</h3>
          <p className="text-[12px] text-muted">{formatDocument(customer.document)}</p>
          <p className="text-[12px] text-muted">
            {customer.city ? `${customer.city}${customer.state ? ` - ${customer.state}` : ''}` : 'Sem cidade'}
          </p>
        </div>
        <StatusSelect value={customer.status} disabled={!canWrite} pending={pending} onChange={onStatus} />
      </div>
      <p className="mt-2 text-[12px] text-muted">
        {contracts > 0 ? `${contracts} contrato(s) ativo(s)` : 'Sem contrato'} · {formatDateTimeBr(customer.created_at)}
      </p>
      <div className="mt-3">
        <CustomerActions customer={customer} canDelete={canDelete} />
      </div>
    </article>
  );
}
