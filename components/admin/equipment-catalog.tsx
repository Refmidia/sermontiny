'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LayoutGrid, Table2 } from 'lucide-react';
import { EquipmentTable } from '@/components/admin/tables';
import { EquipmentStatusBadge } from '@/components/admin/status-badge';
import { ContentCard } from '@/components/admin/content-card';
import { EmptyState } from '@/components/admin/empty-state';
import { SearchInput } from '@/components/admin/search-input';
import { Button } from '@/components/ui/button';
import { formatBRL } from '@/lib/money';
import { publicStorageUrl } from '@/lib/storage-url';
import type { Equipment } from '@/types/database';

export function EquipmentCatalog({ data, initialQuery = '' }: { data: Equipment[]; initialQuery?: string }) {
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [query, setQuery] = useState(initialQuery);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return data;
    return data.filter((item) =>
      [item.name, item.brand, item.model, item.plate].filter(Boolean).join(' ').toLowerCase().includes(term),
    );
  }, [data, query]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button type="button" variant={view === 'table' ? 'default' : 'outline'} size="sm" onClick={() => setView('table')}>
          <Table2 />
          Tabela
        </Button>
        <Button type="button" variant={view === 'cards' ? 'default' : 'outline'} size="sm" onClick={() => setView('cards')}>
          <LayoutGrid />
          Cards
        </Button>
      </div>
      {view === 'table' ? (
        <EquipmentTable data={data} initialQuery={initialQuery} />
      ) : (
        <ContentCard>
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar equipamento" className="mb-4 max-w-sm" />
          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum equipamento"
              text="Cadastre a frota para usar nos orçamentos."
              action={
                <Button asChild>
                  <Link href="/admin/equipamentos/novo">Novo equipamento</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => {
                const photo = publicStorageUrl('equipment', item.photo_path);
                return (
                  <Link
                    key={item.id}
                    href={`/admin/equipamentos/${item.id}`}
                    className="overflow-hidden rounded-[14px] border border-border bg-white transition-colors hover:border-navy/20"
                  >
                    <div className="bg-paper-strong aspect-[16/10]">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-muted">Sem foto</div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-navy">{item.name}</h3>
                        <EquipmentStatusBadge status={item.status} />
                      </div>
                      <p className="text-[13px] text-muted">
                        {[item.brand, item.model].filter(Boolean).join(' ') || 'Marca não informada'}
                        {item.capacity_tons ? ` · ${item.capacity_tons} t` : ''}
                      </p>
                      <p className="text-sm font-semibold text-navy">Diária {formatBRL(item.daily_cents)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </ContentCard>
      )}
    </div>
  );
}
