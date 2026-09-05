'use client';

import { useMemo, useState } from 'react';
import { updateLeadStatus } from '@/app/actions/leads';
import { ContentCard } from '@/components/admin/content-card';
import { EmptyState } from '@/components/admin/empty-state';
import { FilterBar } from '@/components/admin/filter-bar';
import { SearchInput } from '@/components/admin/search-input';
import { LeadStatusBadge, LEAD_STATUS_LABELS } from '@/components/admin/status-badge';
import { Button } from '@/components/ui/button';
import { ADMIN_SELECT_CLASS } from '@/lib/admin-ui';
import { formatDateTimeBr } from '@/lib/format';
import type { Lead, LeadStatus } from '@/types/database';

type LeadRow = Lead & { equipment?: { name: string } | { name: string }[] | null };

export function LeadsBoard({ data }: { data: LeadRow[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.filter((lead) => {
      const matchesStatus = !status || lead.status === status;
      const haystack = [lead.name, lead.email, lead.whatsapp, lead.phone, lead.subject, lead.message]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesStatus && haystack.includes(query.trim().toLowerCase());
    });
  }, [data, query, status]);

  async function onUpdate(leadId: string, formData: FormData) {
    setPendingId(leadId);
    await updateLeadStatus(leadId, String(formData.get('status')) as LeadStatus);
    setPendingId(null);
  }

  return (
    <ContentCard>
      <FilterBar count={filtered.length}>
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar contato" className="w-full sm:max-w-sm" />
        <select
          className={`${ADMIN_SELECT_CLASS} w-auto min-w-40`}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filtrar por status"
        >
          <option value="">Todos os status</option>
          {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum contato" text="Os pedidos enviados pelo site aparecem nesta lista." />
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const equipment = Array.isArray(lead.equipment) ? lead.equipment[0] : lead.equipment;
            return (
              <article key={lead.id} className="rounded-xl border border-border bg-paper px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-navy">{lead.name}</h2>
                    <p className="text-sm text-muted">{lead.subject || 'Sem assunto'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <LeadStatusBadge status={lead.status} />
                    <span className="text-[12px] text-muted">{formatDateTimeBr(lead.created_at)}</span>
                  </div>
                </div>
                <p className="mt-3 text-sm text-navy">{lead.message}</p>
                <p className="mt-2 text-[13px] text-muted">
                  {[lead.email, lead.whatsapp || lead.phone, equipment?.name].filter(Boolean).join(' · ')}
                </p>
                <form action={(formData) => onUpdate(lead.id, formData)} className="mt-3 flex flex-wrap gap-2">
                  <select name="status" defaultValue={lead.status} className={`${ADMIN_SELECT_CLASS} w-auto min-w-44`}>
                    {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" size="sm" disabled={pendingId === lead.id}>
                    {pendingId === lead.id ? 'Atualizando...' : 'Atualizar status'}
                  </Button>
                </form>
              </article>
            );
          })}
        </div>
      )}
    </ContentCard>
  );
}
