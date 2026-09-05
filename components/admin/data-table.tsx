'use client';

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/admin/empty-state';
import { FilterBar } from '@/components/admin/filter-bar';
import { SearchInput } from '@/components/admin/search-input';
import { ContentCard } from '@/components/admin/content-card';
import { ADMIN_SELECT_CLASS } from '@/lib/admin-ui';

type FilterOption = { value: string; label: string };

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = 'Buscar',
  initialQuery = '',
  emptyTitle = 'Nenhum registro',
  emptyText = 'Ajuste a busca ou cadastre o primeiro item.',
  emptyAction,
  filters,
  mobileTitle,
}: {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  searchPlaceholder?: string;
  initialQuery?: string;
  emptyTitle?: string;
  emptyText?: string;
  emptyAction?: React.ReactNode;
  filters?: Array<{
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: FilterOption[];
  }>;
  mobileTitle?: (row: TData) => string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<Record<string, string>>({});

  const filteredData = useMemo(() => {
    return data.filter((row) =>
      Object.entries(statusFilter).every(([key, value]) => {
        if (!value) return true;
        return String((row as Record<string, unknown>)[key] ?? '') === value;
      }),
    );
  }, [data, statusFilter]);

  // TanStack Table is incompatible with React Compiler memoization.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const rows = table.getRowModel().rows;
  const resultCount = table.getFilteredRowModel().rows.length;

  return (
    <ContentCard bodyClassName="p-5">
      <FilterBar count={resultCount}>
        <SearchInput
          value={globalFilter}
          onChange={setGlobalFilter}
          placeholder={searchPlaceholder}
          className="w-full sm:max-w-sm"
        />
        {filters?.map((filter) => (
          <select
            key={filter.id}
            aria-label={filter.label}
            value={statusFilter[filter.id] ?? filter.value}
            onChange={(event) => {
              const value = event.target.value;
              setStatusFilter((current) => ({ ...current, [filter.id]: value }));
              filter.onChange(value);
            }}
            className={`${ADMIN_SELECT_CLASS} w-auto min-w-40`}
          >
            <option value="">{filter.label}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </FilterBar>

      {resultCount === 0 ? (
        <EmptyState title={emptyTitle} text={emptyText} action={emptyAction} />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-border md:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="cursor-pointer"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows.map((row) => (
              <article key={row.id} className="rounded-xl border border-border bg-paper px-4 py-3">
                {mobileTitle && (
                  <p className="mb-2 text-sm font-semibold text-navy">{mobileTitle(row.original)}</p>
                )}
                <dl className="space-y-2">
                  {row.getVisibleCells().map((cell) => {
                    const header = cell.column.columnDef.header;
                    const label = typeof header === 'string' ? header : cell.column.id;
                    return (
                      <div key={cell.id} className="flex items-start justify-between gap-3 text-sm">
                        <dt className="text-[12px] text-muted">{label}</dt>
                        <dd className="text-right text-navy">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-[12px] text-muted">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}
    </ContentCard>
  );
}
