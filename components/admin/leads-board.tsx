'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createLead, softDeleteLead, updateLeadStatus } from '@/app/actions/leads';
import { LeadDetailSheet, type LeadDetail } from '@/components/admin/leads/lead-detail-sheet';
import { LeadKpiCards } from '@/components/admin/leads/lead-kpi-cards';
import { LeadStatusSelect } from '@/components/admin/leads/lead-status-select';
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { initialsFromName } from '@/lib/admin-ui';
import { formatDateTimeBr, toWhatsAppDigits } from '@/lib/format';
import { LEAD_FILTER_CHIPS, leadInterest, leadSourceLabel } from '@/lib/leads/ui';
import { cn } from '@/lib/utils';
import type { Lead, LeadStatus } from '@/types/database';
import {
  Archive,
  Filter,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

export type LeadRow = Lead & {
  equipment?: { name: string } | { name: string }[] | null;
  assignee?: { full_name: string; roles?: { name: string } | { name: string }[] | null } | null;
};

type SortKey = 'recent' | 'oldest' | 'name_asc' | 'name_desc';

const PAGE_SIZE = 10;

function equipmentName(lead: LeadRow) {
  const equipment = Array.isArray(lead.equipment) ? lead.equipment[0] : lead.equipment;
  return equipment?.name ?? null;
}

function assigneeInfo(lead: LeadRow) {
  const assignee = Array.isArray(lead.assignee) ? lead.assignee[0] : lead.assignee;
  if (!assignee) return { name: null as string | null, role: null as string | null };
  const role = Array.isArray(assignee.roles) ? assignee.roles[0] : assignee.roles;
  return { name: assignee.full_name, role: role?.name ?? null };
}

function toDetail(lead: LeadRow): LeadDetail {
  const assignee = assigneeInfo(lead);
  return {
    ...lead,
    equipmentName: equipmentName(lead),
    assigneeName: assignee.name,
    assigneeRole: assignee.role,
  };
}

export function LeadsBoard({
  data,
  canWrite,
}: {
  data: LeadRow[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [statusOverrides, setStatusOverrides] = useState<Record<string, LeadStatus>>({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | LeadStatus>('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [page, setPage] = useState(1);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<LeadDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<LeadRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LeadRow | null>(null);
  const [, startTransition] = useTransition();

  const rows = useMemo(
    () => data.map((lead) => (statusOverrides[lead.id] ? { ...lead, status: statusOverrides[lead.id] } : lead)),
    [data, statusOverrides],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((lead) => {
      const matchesStatus = !statusFilter || lead.status === statusFilter;
      if (!matchesStatus) return false;
      if (!q) return true;
      const haystack = [lead.name, lead.company, lead.email, lead.phone, lead.whatsapp, lead.subject, lead.message]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    list.sort((a, b) => {
      if (sort === 'name_asc') return a.name.localeCompare(b.name, 'pt-BR');
      if (sort === 'name_desc') return b.name.localeCompare(a.name, 'pt-BR');
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return sort === 'oldest' ? aTime - bTime : bTime - aTime;
    });
    return list;
  }, [rows, query, statusFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const kpis = useMemo(
    () => ({
      total: rows.length,
      novos: rows.filter((lead) => lead.status === 'new').length,
      emAndamento: rows.filter((lead) => lead.status === 'in_progress').length,
      convertidos: rows.filter((lead) => lead.status === 'converted').length,
    }),
    [rows],
  );

  function patchStatus(id: string, status: LeadStatus) {
    setStatusOverrides((current) => ({ ...current, [id]: status }));
    setSelected((current) => (current?.id === id ? { ...current, status } : current));
  }

  function clearOverride(id: string) {
    setStatusOverrides((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  }

  function changeStatus(lead: LeadRow, status: LeadStatus) {
    if (!canWrite || lead.status === status) return;
    const previous = lead.status;
    patchStatus(lead.id, status);
    setPendingId(lead.id);
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, status);
      setPendingId(null);
      if (result.error) {
        patchStatus(lead.id, previous);
        toast.error(result.error);
        return;
      }
      clearOverride(lead.id);
      toast.success('Status atualizado com sucesso');
      router.refresh();
    });
  }

  function openDetails(lead: LeadRow) {
    setSelected(toDetail(lead));
    setDetailOpen(true);
  }

  function confirmArchive(lead: LeadRow) {
    if (!canWrite) return;
    setArchiveTarget(lead);
  }

  function confirmDelete(lead: LeadRow) {
    if (!canWrite) return;
    setDeleteTarget(lead);
  }

  function runDeleteLead() {
    const lead = deleteTarget;
    if (!lead) return;
    startTransition(async () => {
      const result = await softDeleteLead(lead.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Contato excluído.');
      setDeleteTarget(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Contatos"
        description="Acompanhe e converta as solicitações recebidas pelo site."
        crumbs={[{ href: '/admin', label: 'Painel' }, { label: 'Contatos' }]}
        actions={
          <PageActionBar>
            {canWrite ? (
              <Button type="button" variant="default" onClick={() => setCreateOpen(true)}>
                <Plus />
                Novo contato
              </Button>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Atualizar lista"
                  onClick={() => router.refresh()}
                >
                  <RefreshCw />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar lista</TooltipContent>
            </Tooltip>
          </PageActionBar>
        }
      />

      <LeadKpiCards
        total={kpis.total}
        novos={kpis.novos}
        emAndamento={kpis.emAndamento}
        convertidos={kpis.convertidos}
      />

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
                  placeholder="Buscar por nome, empresa ou telefone"
                  className="pl-9"
                  aria-label="Buscar contatos"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFiltersOpen((value) => !value)}
                >
                  <Filter />
                  Filtros
                </Button>
                <select
                  className="admin-select h-10 min-w-[160px]"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as SortKey)}
                  aria-label="Ordenar contatos"
                >
                  <option value="recent">Mais recentes</option>
                  <option value="oldest">Mais antigos</option>
                  <option value="name_asc">Nome A–Z</option>
                  <option value="name_desc">Nome Z–A</option>
                </select>
              </div>
            </div>

            <div className={cn('mt-3 flex flex-wrap gap-2', !filtersOpen && 'hidden sm:flex')}>
              {LEAD_FILTER_CHIPS.map((chip) => {
                const active = statusFilter === chip.value;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      setStatusFilter(chip.value);
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
                  title="Nenhum contato encontrado"
                  text="Ajuste a busca ou os filtros, ou cadastre um novo contato."
                  action={
                    canWrite ? (
                      <Button type="button" variant="gold" onClick={() => setCreateOpen(true)}>
                        <Plus />
                        Novo contato
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
                        <th className="px-3 py-2.5 font-semibold">Contato</th>
                        <th className="px-3 py-2.5 font-semibold">Interesse</th>
                        <th className="hidden px-3 py-2.5 font-semibold xl:table-cell">Responsável</th>
                        <th className="px-3 py-2.5 font-semibold">Última interação</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="w-0 whitespace-nowrap px-3 py-2.5 font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageItems.map((lead) => (
                        <LeadTableRow
                          key={lead.id}
                          lead={lead}
                          canWrite={canWrite}
                          pending={pendingId === lead.id}
                          onStatus={(status) => changeStatus(lead, status)}
                          onDetails={() => openDetails(lead)}
                          onArchive={() => confirmArchive(lead)}
                          onDelete={() => confirmDelete(lead)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="space-y-3 p-3 lg:hidden">
                  {pageItems.map((lead) => (
                    <LeadMobileCard
                      key={lead.id}
                      lead={lead}
                      canWrite={canWrite}
                      pending={pendingId === lead.id}
                      onStatus={(status) => changeStatus(lead, status)}
                      onDetails={() => openDetails(lead)}
                      onArchive={() => confirmArchive(lead)}
                      onDelete={() => confirmDelete(lead)}
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

      <LeadDetailSheet
        lead={selected}
        open={detailOpen}
        canWrite={canWrite}
        onOpenChange={setDetailOpen}
        onStatusSaved={(id, status) => {
          patchStatus(id, status);
          clearOverride(id);
          router.refresh();
        }}
      />

      <CreateLeadDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          setCreateOpen(false);
          router.refresh();
        }}
      />

      <AlertDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Arquivar contato</AlertDialogTitle>
            <AlertDialogDescription>
              Arquivar o contato{' '}
              <span className="font-semibold text-navy">{archiveTarget?.name}</span>? Essa ação pode ser
              revertida depois alterando o status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                const lead = archiveTarget;
                setArchiveTarget(null);
                if (lead) changeStatus(lead, 'archived');
              }}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-navy">Excluir contato</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir o contato <span className="font-semibold text-navy">{deleteTarget?.name}</span>? Ele sai da
              lista do painel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger hover:bg-[#8f1c14]"
              onClick={(event) => {
                event.preventDefault();
                runDeleteLead();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ActionIconButton({
  label,
  href,
  disabled,
  onClick,
  children,
}: {
  label: string;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
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
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-8 w-8 shrink-0"
        disabled={disabled}
        aria-label={label}
        onClick={onClick}
      >
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

function LeadActions({
  lead,
  onDetails,
  onArchive,
  onDelete,
  canWrite,
}: {
  lead: LeadRow;
  onDetails: () => void;
  onArchive: () => void;
  onDelete: () => void;
  canWrite: boolean;
}) {
  const phone = lead.phone || lead.whatsapp || '';
  const whatsapp = lead.whatsapp || lead.phone || '';
  return (
    <div className="flex flex-nowrap items-center justify-start gap-1">
      <ActionIconButton
        label="WhatsApp"
        disabled={!whatsapp}
        href={whatsapp ? `https://wa.me/${toWhatsAppDigits(whatsapp)}` : undefined}
      >
        <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
      </ActionIconButton>
      <ActionIconButton label="Ligar" disabled={!phone} href={phone ? `tel:${phone}` : undefined}>
        <Phone className="h-3.5 w-3.5" />
      </ActionIconButton>
      <ActionIconButton label="E-mail" disabled={!lead.email} href={lead.email ? `mailto:${lead.email}` : undefined}>
        <Mail className="h-3.5 w-3.5" />
      </ActionIconButton>
      {canWrite ? (
        <ActionIconButton label="Arquivar" onClick={onArchive}>
          <Archive className="h-3.5 w-3.5" />
        </ActionIconButton>
      ) : null}
      {canWrite ? (
        <ActionIconButton label="Excluir" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-danger" />
        </ActionIconButton>
      ) : null}
      <Button type="button" size="sm" className="h-8 shrink-0 px-2.5 text-[12px]" variant="default" onClick={onDetails}>
        Detalhes
      </Button>
    </div>
  );
}

function LeadTableRow({
  lead,
  canWrite,
  pending,
  onStatus,
  onDetails,
  onArchive,
  onDelete,
}: {
  lead: LeadRow;
  canWrite: boolean;
  pending: boolean;
  onStatus: (status: LeadStatus) => void;
  onDetails: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const assignee = assigneeInfo(lead);
  const interest = leadInterest({
    subject: lead.subject,
    company: lead.company,
    equipmentName: equipmentName(lead),
  });

  return (
    <tr className="border-b border-border last:border-b-0 hover:bg-paper/70">
      <td className="px-3 py-2.5 align-middle">
        <div className="flex min-w-0 gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-[10px] font-semibold text-white">
            {initialsFromName(lead.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-navy">{lead.name}</p>
            <p className="truncate text-[12px] text-muted">{lead.company || lead.subject || 'Solicitação do site'}</p>
            <p className="mt-0.5 truncate text-[11px] text-muted">
              {[lead.email, lead.phone || lead.whatsapp].filter(Boolean).join(' · ') || 'Sem contato'}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <p className="line-clamp-2 text-navy">{interest}</p>
      </td>
      <td className="hidden px-3 py-2.5 align-middle xl:table-cell">
        {assignee.name ? (
          <div className="min-w-0">
            <p className="truncate font-medium text-navy">{assignee.name}</p>
            <p className="truncate text-[12px] text-muted">{assignee.role || 'Equipe'}</p>
          </div>
        ) : (
          <span className="text-muted">Não atribuído</span>
        )}
      </td>
      <td className="px-3 py-2.5 align-middle">
        <p className="font-medium whitespace-nowrap text-navy">{formatDateTimeBr(lead.updated_at || lead.created_at)}</p>
        <p className="text-[12px] text-muted">{leadSourceLabel(lead.source)}</p>
      </td>
      <td className="px-3 py-2.5 align-middle">
        <LeadStatusSelect
          value={lead.status}
          disabled={!canWrite}
          pending={pending}
          onChange={onStatus}
          className="min-w-0 w-full max-w-[148px]"
        />
      </td>
      <td className="w-0 whitespace-nowrap px-3 py-2.5 align-middle">
        <LeadActions
          lead={lead}
          canWrite={canWrite}
          onDetails={onDetails}
          onArchive={onArchive}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
}

function LeadMobileCard({
  lead,
  canWrite,
  pending,
  onStatus,
  onDetails,
  onArchive,
  onDelete,
}: {
  lead: LeadRow;
  canWrite: boolean;
  pending: boolean;
  onStatus: (status: LeadStatus) => void;
  onDetails: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const interest = leadInterest({
    subject: lead.subject,
    company: lead.company,
    equipmentName: equipmentName(lead),
  });
  const whatsapp = lead.whatsapp || lead.phone || '';

  return (
    <article className="rounded-[12px] border border-border bg-paper p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-white">
            {initialsFromName(lead.name)}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-navy">{lead.name}</h3>
            <p className="text-[12px] text-muted">{interest}</p>
          </div>
        </div>
        <LeadStatusSelect value={lead.status} disabled={!canWrite} pending={pending} onChange={onStatus} />
      </div>
      <p className="mt-3 text-[12px] text-muted">{formatDateTimeBr(lead.created_at)} · {leadSourceLabel(lead.source)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline" disabled={!whatsapp}>
          <a href={whatsapp ? `https://wa.me/${toWhatsAppDigits(whatsapp)}` : undefined} target="_blank" rel="noreferrer">
            <WhatsAppIcon className="text-[#25D366]" />
            WhatsApp
          </a>
        </Button>
        {canWrite ? (
          <Button type="button" size="sm" variant="outline" onClick={onArchive}>
            <Archive />
            Arquivar
          </Button>
        ) : null}
        {canWrite ? (
          <Button type="button" size="sm" variant="outline" className="text-danger" onClick={onDelete}>
            <Trash2 />
            Excluir
          </Button>
        ) : null}
        <Button type="button" size="sm" variant="default" onClick={onDetails}>
          Ver detalhes
        </Button>
      </div>
    </article>
  );
}

function CreateLeadDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  function submit() {
    startTransition(async () => {
      const result = await createLead({ name, email, phone, whatsapp: phone, company, subject, message });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Contato cadastrado');
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
      setSubject('');
      setMessage('');
      onCreated();
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo contato</DialogTitle>
          <DialogDescription>Cadastre uma solicitação recebida fora do formulário do site.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <Input placeholder="Nome" value={name} onChange={(event) => setName(event.target.value)} />
          <Input placeholder="E-mail" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Input placeholder="Telefone / WhatsApp" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <Input placeholder="Empresa" value={company} onChange={(event) => setCompany(event.target.value)} />
          <Input placeholder="Assunto / interesse" value={subject} onChange={(event) => setSubject(event.target.value)} />
          <Textarea placeholder="Mensagem" value={message} onChange={(event) => setMessage(event.target.value)} rows={4} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" variant="gold" disabled={pending || !name.trim()} onClick={submit}>
              {pending ? 'Salvando...' : 'Cadastrar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
