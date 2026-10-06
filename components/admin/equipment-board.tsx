'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Download,
  Filter,
  Globe2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Truck,
  Wrench,
} from 'lucide-react';
import { updateEquipmentStatus } from '@/app/actions/equipment';
import { EmptyState } from '@/components/admin/empty-state';
import { PageActionBar } from '@/components/admin/page-action-bar';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatBRL } from '@/lib/money';
import { equipmentPhotoSrc } from '@/lib/storage-url';
import { cn } from '@/lib/utils';
import type { Equipment, EquipmentStatus } from '@/types/database';

const PAGE_SIZE = 10;

type FilterKey = 'all' | EquipmentStatus | 'on_site' | 'quoteable';
type SortKey = 'name_asc' | 'name_desc' | 'daily_desc' | 'daily_asc' | 'capacity_desc';

const STATUS_OPTIONS: EquipmentStatus[] = ['available', 'rented', 'maintenance', 'inactive'];

const STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponível',
  rented: 'Locado',
  maintenance: 'Em manutenção',
  inactive: 'Inativo',
};

function brandModel(item: Equipment) {
  return [item.brand, item.model].filter(Boolean).join(' ') || 'Marca não informada';
}

function statusSelectClass(status: EquipmentStatus) {
  switch (status) {
    case 'available':
      return 'border-success/30 bg-success-soft text-success';
    case 'rented':
      return 'border-navy/20 bg-navy/5 text-navy';
    case 'maintenance':
      return 'border-warning/40 bg-[#FFF4CC] text-[#8a6a12]';
    default:
      return 'border-border bg-paper-strong text-muted';
  }
}

export function EquipmentBoard({ data, canWrite }: { data: Equipment[]; canWrite: boolean }) {
  const router = useRouter();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, EquipmentStatus>>({});
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('name_asc');
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [, startTransition] = useTransition();

  const rows = useMemo(
    () => data.map((item) => (statusOverrides[item.id] ? { ...item, status: statusOverrides[item.id] } : item)),
    [data, statusOverrides],
  );

  const kpis = useMemo(() => {
    const total = rows.length;
    const available = rows.filter((item) => item.status === 'available').length;
    const rented = rows.filter((item) => item.status === 'rented').length;
    const maintenance = rows.filter((item) => item.status === 'maintenance').length;
    return { total, available, rented, maintenance };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((item) => {
      if (filter === 'available' && item.status !== 'available') return false;
      if (filter === 'rented' && item.status !== 'rented') return false;
      if (filter === 'maintenance' && item.status !== 'maintenance') return false;
      if (filter === 'inactive' && item.status !== 'inactive') return false;
      if (filter === 'on_site' && !item.show_on_website) return false;
      if (filter === 'quoteable' && !item.available_for_quote) return false;
      if (!q) return true;
      const haystack = [item.name, item.brand, item.model, item.plate, item.asset_number]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    list.sort((a, b) => {
      if (sort === 'name_desc') return b.name.localeCompare(a.name, 'pt-BR');
      if (sort === 'daily_desc') return b.daily_cents - a.daily_cents;
      if (sort === 'daily_asc') return a.daily_cents - b.daily_cents;
      if (sort === 'capacity_desc') return (b.capacity_tons ?? 0) - (a.capacity_tons ?? 0);
      return a.name.localeCompare(b.name, 'pt-BR');
    });
    return list;
  }, [rows, query, filter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function patchStatus(id: string, status: EquipmentStatus) {
    setStatusOverrides((current) => ({ ...current, [id]: status }));
  }

  function clearOverride(id: string) {
    setStatusOverrides((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function changeStatus(item: Equipment, status: EquipmentStatus) {
    if (!canWrite || item.status === status) return;
    const previous = item.status;
    patchStatus(item.id, status);
    setPendingId(item.id);
    startTransition(async () => {
      const result = await updateEquipmentStatus(item.id, status);
      setPendingId(null);
      if (result.error) {
        patchStatus(item.id, previous);
        toast.error(result.error);
        return;
      }
      clearOverride(item.id);
      toast.success('Status atualizado com sucesso');
      router.refresh();
    });
  }

  function exportCsv() {
    const header = ['Equipamento', 'Marca', 'Modelo', 'Capacidade (t)', 'Diária', 'Mensal', 'Status', 'No site', 'Orçamento'];
    const lines = filtered.map((item) =>
      [
        item.name,
        item.brand ?? '',
        item.model ?? '',
        item.capacity_tons != null ? String(item.capacity_tons) : '',
        formatBRL(item.daily_cents),
        formatBRL(item.monthly_cents),
        STATUS_LABELS[item.status],
        item.show_on_website ? 'Sim' : 'Não',
        item.available_for_quote ? 'Sim' : 'Não',
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(';'),
    );
    const blob = new Blob([[header.join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `equipamentos-sermontiny-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const chips: Array<{ value: FilterKey; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'available', label: 'Disponíveis' },
    { value: 'rented', label: 'Locados' },
    { value: 'maintenance', label: 'Manutenção' },
    { value: 'inactive', label: 'Inativos' },
    { value: 'on_site', label: 'No site' },
    { value: 'quoteable', label: 'Para orçamento' },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Equipamentos"
        description="Gerencie a frota, capacidades e valores de locação."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Equipamentos' }]}
        actions={
          <PageActionBar>
            <Button type="button" variant="outline" onClick={exportCsv}>
              <Download />
              Exportar
            </Button>
            {canWrite ? (
              <Button asChild variant="gold">
                <Link href="/admin/equipamentos/novo">
                  <Plus />
                  Novo equipamento
                </Link>
              </Button>
            ) : null}
          </PageActionBar>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={Truck} label="Total na frota" value={kpis.total} hint="Equipamentos cadastrados" tone="bg-info-soft text-info" />
        <KpiCard
          icon={CheckCircle2}
          label="Disponíveis"
          value={kpis.available}
          hint="Prontos para locação"
          tone="bg-success-soft text-success"
        />
        <KpiCard icon={Globe2} label="Locados" value={kpis.rented} hint="Em operação no cliente" tone="bg-navy/5 text-navy" />
        <KpiCard
          icon={Wrench}
          label="Em manutenção"
          value={kpis.maintenance}
          hint="Fora de operação"
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
                placeholder="Buscar por nome, marca, modelo ou placa"
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
                aria-label="Ordenar equipamentos"
              >
                <option value="name_asc">Nome A–Z</option>
                <option value="name_desc">Nome Z–A</option>
                <option value="daily_desc">Maior diária</option>
                <option value="daily_asc">Menor diária</option>
                <option value="capacity_desc">Maior capacidade</option>
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
                title="Nenhum equipamento encontrado"
                text="Ajuste a busca ou os filtros, ou cadastre um novo equipamento."
                action={
                  canWrite ? (
                    <Button asChild variant="gold">
                      <Link href="/admin/equipamentos/novo">
                        <Plus />
                        Novo equipamento
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
                      <th className="px-3 py-2.5 font-semibold">Equipamento</th>
                      <th className="px-3 py-2.5 font-semibold">Capacidade</th>
                      <th className="px-3 py-2.5 font-semibold">Diária</th>
                      <th className="hidden px-3 py-2.5 font-semibold xl:table-cell">Mensal</th>
                      <th className="hidden px-3 py-2.5 font-semibold md:table-cell">Site</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="w-0 whitespace-nowrap px-3 py-2.5 font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item) => (
                      <EquipmentTableRow
                        key={item.id}
                        item={item}
                        canWrite={canWrite}
                        pending={pendingId === item.id}
                        onStatus={(status) => changeStatus(item, status)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 p-3 lg:hidden">
                {pageItems.map((item) => (
                  <EquipmentMobileCard
                    key={item.id}
                    item={item}
                    canWrite={canWrite}
                    pending={pendingId === item.id}
                    onStatus={(status) => changeStatus(item, status)}
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
  icon: typeof Truck;
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

function StatusSelect({
  value,
  disabled,
  pending,
  onChange,
}: {
  value: EquipmentStatus;
  disabled?: boolean;
  pending?: boolean;
  onChange: (status: EquipmentStatus) => void;
}) {
  return (
    <select
      value={value}
      disabled={disabled || pending}
      aria-label="Status do equipamento"
      onChange={(event) => onChange(event.target.value as EquipmentStatus)}
      className={cn(
        'h-8 min-w-[118px] max-w-full appearance-none rounded-lg border px-2.5 pr-7 text-[12px] font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-gold/50 disabled:opacity-70',
        statusSelectClass(value),
      )}
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}

function ActionIcon({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button asChild type="button" variant="outline" size="icon" className="h-8 w-8 shrink-0" aria-label={label}>
          <Link href={href}>{children}</Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function EquipmentActions({ item }: { item: Equipment }) {
  return (
    <div className="inline-flex flex-nowrap items-center gap-1">
      <ActionIcon label="Editar" href={`/admin/equipamentos/${item.id}`}>
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
            <Link href={`/admin/equipamentos/${item.id}`}>Ver equipamento</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EquipmentTableRow({
  item,
  canWrite,
  pending,
  onStatus,
}: {
  item: Equipment;
  canWrite: boolean;
  pending: boolean;
  onStatus: (status: EquipmentStatus) => void;
}) {
  const photo = equipmentPhotoSrc(item);
  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-paper/70">
      <td className="px-3 py-2.5 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-11 w-14 shrink-0 overflow-hidden rounded-lg border border-border bg-paper-strong">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-[10px] text-muted">Sem foto</div>
            )}
          </div>
          <div className="min-w-0">
            <Link href={`/admin/equipamentos/${item.id}`} className="block truncate font-semibold text-navy hover:underline">
              {item.name}
            </Link>
            <p className="truncate text-[12px] text-muted">{brandModel(item)}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 align-middle whitespace-nowrap text-navy">
        {item.capacity_tons != null ? `${item.capacity_tons} t` : '—'}
      </td>
      <td className="px-3 py-2.5 align-middle whitespace-nowrap font-semibold text-navy">{formatBRL(item.daily_cents)}</td>
      <td className="hidden px-3 py-2.5 align-middle whitespace-nowrap text-navy xl:table-cell">{formatBRL(item.monthly_cents)}</td>
      <td className="hidden px-3 py-2.5 align-middle md:table-cell">
        {item.show_on_website ? (
          <span className="text-[12px] font-semibold text-success">Visível</span>
        ) : (
          <span className="text-[12px] text-muted">Oculto</span>
        )}
      </td>
      <td className="px-3 py-2.5 align-middle">
        <StatusSelect value={item.status} disabled={!canWrite} pending={pending} onChange={onStatus} />
      </td>
      <td className="w-0 whitespace-nowrap px-3 py-2.5 align-middle">
        <EquipmentActions item={item} />
      </td>
    </tr>
  );
}

function EquipmentMobileCard({
  item,
  canWrite,
  pending,
  onStatus,
}: {
  item: Equipment;
  canWrite: boolean;
  pending: boolean;
  onStatus: (status: EquipmentStatus) => void;
}) {
  const photo = equipmentPhotoSrc(item);
  return (
    <article className="rounded-[12px] border border-border bg-paper p-3">
      <div className="flex items-start gap-3">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-paper-strong">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-muted">Sem foto</div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-navy">{item.name}</h3>
          <p className="text-[12px] text-muted">{brandModel(item)}</p>
          <p className="mt-1 text-[12px] text-muted">
            {item.capacity_tons != null ? `${item.capacity_tons} t` : 'Sem capacidade'} · Diária {formatBRL(item.daily_cents)}
          </p>
        </div>
        <StatusSelect value={item.status} disabled={!canWrite} pending={pending} onChange={onStatus} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/equipamentos/${item.id}`}>
            <Pencil />
            Editar
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link href={`/admin/equipamentos/${item.id}`}>
            <MoreHorizontal />
            Ver
          </Link>
        </Button>
      </div>
    </article>
  );
}
