'use client';

import { useMemo, useState } from 'react';
import { ContentCard } from '@/components/admin/content-card';
import { EmptyState } from '@/components/admin/empty-state';
import { FilterBar } from '@/components/admin/filter-bar';
import { SearchInput } from '@/components/admin/search-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ADMIN_SELECT_CLASS } from '@/lib/admin-ui';
import { formatDateTimeBr } from '@/lib/format';

export type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  profiles?: { full_name: string } | { full_name: string }[] | null;
};

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  create: 'Criação',
  update: 'Atualização',
  soft_delete: 'Exclusão',
  price_change: 'Alteração de preço',
  pdf_generate: 'Geração de PDF',
  whatsapp_send: 'Envio WhatsApp',
  approve: 'Aprovação',
  convert_contract: 'Conversão em contrato',
};

export function AuditBoard({ data }: { data: AuditRow[] }) {
  const [query, setQuery] = useState('');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [user, setUser] = useState('');
  const [selected, setSelected] = useState<AuditRow | null>(null);

  const users = useMemo(() => {
    return [...new Set(data.map((row) => profileName(row)))].filter(Boolean);
  }, [data]);
  const entities = useMemo(() => [...new Set(data.map((row) => row.entity))].filter(Boolean), [data]);

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const name = profileName(row);
      const haystack = [name, row.action, row.entity, row.entity_id, JSON.stringify(row.metadata ?? {})]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (
        (!action || row.action === action) &&
        (!entity || row.entity === entity) &&
        (!user || name === user) &&
        haystack.includes(query.trim().toLowerCase())
      );
    });
  }, [data, action, entity, user, query]);

  return (
    <ContentCard>
      <FilterBar count={filtered.length}>
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar na auditoria" className="w-full sm:max-w-sm" />
        <select className={`${ADMIN_SELECT_CLASS} w-auto min-w-40`} value={action} onChange={(event) => setAction(event.target.value)}>
          <option value="">Todas as ações</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select className={`${ADMIN_SELECT_CLASS} w-auto min-w-40`} value={entity} onChange={(event) => setEntity(event.target.value)}>
          <option value="">Todas as entidades</option>
          {entities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <select className={`${ADMIN_SELECT_CLASS} w-auto min-w-40`} value={user} onChange={(event) => setUser(event.target.value)}>
          <option value="">Todos os usuários</option>
          {users.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum evento" text="As ações do painel serão listadas aqui." />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <table className="w-full text-sm">
              <thead className="bg-paper-strong text-left text-[12px] text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">Data e hora</th>
                  <th className="px-3 py-2 font-semibold">Usuário</th>
                  <th className="px-3 py-2 font-semibold">Ação</th>
                  <th className="px-3 py-2 font-semibold">Entidade</th>
                  <th className="px-3 py-2 font-semibold">IP</th>
                  <th className="px-3 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-3">{formatDateTimeBr(row.created_at)}</td>
                    <td className="px-3 py-3">{profileName(row)}</td>
                    <td className="px-3 py-3">{ACTION_LABELS[row.action] ?? row.action}</td>
                    <td className="px-3 py-3">
                      {row.entity}
                      {row.entity_id ? ` · ${row.entity_id.slice(0, 8)}` : ''}
                    </td>
                    <td className="px-3 py-3 text-muted">{ipFromMetadata(row.metadata)}</td>
                    <td className="px-3 py-3 text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => setSelected(row)}>
                        Ver detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {filtered.map((row) => (
              <article key={row.id} className="rounded-xl border border-border bg-paper p-4">
                <p className="text-sm font-semibold text-navy">{ACTION_LABELS[row.action] ?? row.action}</p>
                <p className="text-[13px] text-muted">{profileName(row)} · {formatDateTimeBr(row.created_at)}</p>
                <p className="mt-1 text-sm">{row.entity}</p>
                <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setSelected(row)}>
                  Ver detalhes
                </Button>
              </article>
            ))}
          </div>
        </>
      )}

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhe da auditoria</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-2 text-sm">
              <p><strong>Usuário:</strong> {profileName(selected)}</p>
              <p><strong>Ação:</strong> {ACTION_LABELS[selected.action] ?? selected.action}</p>
              <p><strong>Entidade:</strong> {selected.entity}</p>
              <p><strong>Data:</strong> {formatDateTimeBr(selected.created_at)}</p>
              <p><strong>IP:</strong> {ipFromMetadata(selected.metadata)}</p>
              <pre className="overflow-auto rounded-lg bg-paper p-3 text-[12px] whitespace-pre-wrap">
                {JSON.stringify(selected.metadata ?? {}, null, 2)}
              </pre>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ContentCard>
  );
}

function profileName(row: AuditRow) {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return profile?.full_name ?? 'Sistema';
}

function ipFromMetadata(metadata?: Record<string, unknown> | null) {
  const value = metadata?.ip ?? metadata?.client_ip;
  return typeof value === 'string' && value ? value : 'Não disponível';
}
