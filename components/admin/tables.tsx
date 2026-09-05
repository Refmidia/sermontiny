'use client';

import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/admin/data-table';
import {
  ContractStatusBadge,
  EquipmentStatusBadge,
  QuoteStatusBadge,
  RecordStatusBadge,
} from '@/components/admin/status-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { formatBRL } from '@/lib/money';
import { formatDateBr } from '@/lib/format';
import {
  CONTRACT_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  type ContractStatus,
  type Customer,
  type Equipment,
  type QuoteStatus,
} from '@/types/database';

function RowActions({ href, label }: { href: string; label: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Ações de ${label}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={href}>Abrir</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CustomersTable({ data, initialQuery = '' }: { data: Customer[]; initialQuery?: string }) {
  const columns: ColumnDef<Customer>[] = [
    {
      accessorKey: 'legal_name',
      header: 'Cliente',
      cell: ({ row }) => (
        <Link href={`/admin/clientes/${row.original.id}`} className="font-medium text-navy hover:underline">
          {row.original.legal_name}
        </Link>
      ),
    },
    { accessorKey: 'document', header: 'CNPJ/CPF' },
    { accessorKey: 'city', header: 'Cidade' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <RecordStatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions href={`/admin/clientes/${row.original.id}`} label={row.original.legal_name} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      initialQuery={initialQuery}
      searchPlaceholder="Buscar cliente"
      emptyTitle="Nenhum cliente"
      emptyText="Cadastre o primeiro cliente para iniciar propostas e contratos."
      emptyAction={
        <Button asChild>
          <Link href="/admin/clientes/novo">Novo cliente</Link>
        </Button>
      }
      mobileTitle={(row) => row.legal_name}
      filters={[
        {
          id: 'status',
          label: 'Todos os status',
          value: '',
          onChange: () => undefined,
          options: [
            { value: 'active', label: 'Ativo' },
            { value: 'inactive', label: 'Inativo' },
          ],
        },
      ]}
    />
  );
}

export function EquipmentTable({ data, initialQuery = '' }: { data: Equipment[]; initialQuery?: string }) {
  const columns: ColumnDef<Equipment>[] = [
    {
      accessorKey: 'name',
      header: 'Equipamento',
      cell: ({ row }) => (
        <Link href={`/admin/equipamentos/${row.original.id}`} className="font-medium text-navy hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      id: 'brand_model',
      header: 'Marca / modelo',
      cell: ({ row }) => [row.original.brand, row.original.model].filter(Boolean).join(' ') || '—',
    },
    {
      accessorKey: 'capacity_tons',
      header: 'Capacidade',
      cell: ({ row }) => (row.original.capacity_tons ? `${row.original.capacity_tons} t` : '—'),
    },
    {
      accessorKey: 'daily_cents',
      header: 'Diária',
      cell: ({ row }) => formatBRL(row.original.daily_cents),
    },
    {
      accessorKey: 'monthly_cents',
      header: 'Mensal',
      cell: ({ row }) => formatBRL(row.original.monthly_cents),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <EquipmentStatusBadge status={row.original.status} />,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions href={`/admin/equipamentos/${row.original.id}`} label={row.original.name} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      initialQuery={initialQuery}
      searchPlaceholder="Buscar equipamento"
      emptyTitle="Nenhum equipamento"
      emptyText="Cadastre a frota para usar nos orçamentos."
      emptyAction={
        <Button asChild>
          <Link href="/admin/equipamentos/novo">Novo equipamento</Link>
        </Button>
      }
      mobileTitle={(row) => row.name}
      filters={[
        {
          id: 'status',
          label: 'Todos os status',
          value: '',
          onChange: () => undefined,
          options: [
            { value: 'available', label: 'Disponível' },
            { value: 'rented', label: 'Locado' },
            { value: 'maintenance', label: 'Manutenção' },
            { value: 'inactive', label: 'Inativo' },
          ],
        },
      ]}
    />
  );
}

export type QuoteRow = {
  id: string;
  number: string;
  title: string;
  status: QuoteStatus;
  created_at?: string;
  customers: { legal_name: string } | { legal_name: string }[] | null;
  customer_units?: { name: string } | { name: string }[] | null;
  quote_versions?: { total_cents: number; version_number: number; valid_until: string | null } | { total_cents: number; version_number: number; valid_until: string | null }[] | null;
};

export function QuotesTable({ data, initialQuery = '' }: { data: QuoteRow[]; initialQuery?: string }) {
  const columns: ColumnDef<QuoteRow>[] = [
    {
      accessorKey: 'number',
      header: 'Número',
      cell: ({ row }) => (
        <Link href={`/admin/orcamentos/${row.original.id}`} className="font-medium text-navy hover:underline">
          {row.original.number}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Cliente',
      accessorFn: (row) => {
        const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
        return customer?.legal_name ?? '';
      },
      cell: ({ row }) => {
        const customer = Array.isArray(row.original.customers) ? row.original.customers[0] : row.original.customers;
        return customer?.legal_name ?? '—';
      },
    },
    {
      id: 'unit',
      header: 'Unidade',
      cell: ({ row }) => {
        const unit = Array.isArray(row.original.customer_units) ? row.original.customer_units[0] : row.original.customer_units;
        return unit?.name ?? '—';
      },
    },
    { accessorKey: 'title', header: 'Escopo' },
    {
      id: 'total',
      header: 'Valor',
      cell: ({ row }) => {
        const version = Array.isArray(row.original.quote_versions) ? row.original.quote_versions[0] : row.original.quote_versions;
        return formatBRL(version?.total_cents ?? 0);
      },
    },
    {
      id: 'version',
      header: 'Versão',
      cell: ({ row }) => {
        const version = Array.isArray(row.original.quote_versions) ? row.original.quote_versions[0] : row.original.quote_versions;
        return version?.version_number ? `V${version.version_number}` : '—';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <QuoteStatusBadge status={row.original.status} />,
    },
    {
      id: 'valid_until',
      header: 'Validade',
      cell: ({ row }) => {
        const version = Array.isArray(row.original.quote_versions) ? row.original.quote_versions[0] : row.original.quote_versions;
        return version?.valid_until ? formatDateBr(version.valid_until) : '—';
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Data',
      cell: ({ row }) => (row.original.created_at ? formatDateBr(row.original.created_at.slice(0, 10)) : '—'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions href={`/admin/orcamentos/${row.original.id}`} label={row.original.number} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      initialQuery={initialQuery}
      searchPlaceholder="Buscar orçamento"
      emptyTitle="Nenhum orçamento"
      emptyText="Crie a primeira proposta comercial."
      emptyAction={
        <Button asChild>
          <Link href="/admin/orcamentos/novo">Novo orçamento</Link>
        </Button>
      }
      mobileTitle={(row) => row.number}
      filters={[
        {
          id: 'status',
          label: 'Todos os status',
          value: '',
          onChange: () => undefined,
          options: Object.entries(QUOTE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
        },
      ]}
    />
  );
}

export type ContractRow = {
  id: string;
  number: string;
  object: string;
  status: ContractStatus;
  total_cents: number;
  ends_on: string | null;
  starts_on?: string | null;
  signed_at?: string | null;
  customers?: { legal_name: string } | { legal_name: string }[] | null;
  quotes?: { number: string } | { number: string }[] | null;
};

export function ContractsTable({ data, initialQuery = '' }: { data: ContractRow[]; initialQuery?: string }) {
  const columns: ColumnDef<ContractRow>[] = [
    {
      accessorKey: 'number',
      header: 'Número',
      cell: ({ row }) => (
        <Link href={`/admin/contratos/${row.original.id}`} className="font-medium text-navy hover:underline">
          {row.original.number}
        </Link>
      ),
    },
    {
      id: 'customer',
      header: 'Cliente',
      accessorFn: (row) => {
        const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
        return customer?.legal_name ?? '';
      },
      cell: ({ row }) => {
        const customer = Array.isArray(row.original.customers) ? row.original.customers[0] : row.original.customers;
        return customer?.legal_name ?? '—';
      },
    },
    {
      id: 'quote',
      header: 'Orçamento',
      cell: ({ row }) => {
        const quote = Array.isArray(row.original.quotes) ? row.original.quotes[0] : row.original.quotes;
        return quote?.number ?? '—';
      },
    },
    { accessorKey: 'object', header: 'Objeto' },
    {
      accessorKey: 'total_cents',
      header: 'Valor',
      cell: ({ row }) => formatBRL(row.original.total_cents),
    },
    {
      id: 'period',
      header: 'Vigência',
      cell: ({ row }) =>
        [row.original.starts_on, row.original.ends_on].filter(Boolean).map((value) => formatDateBr(value as string)).join(' — ') || '—',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <ContractStatusBadge status={row.original.status} />,
    },
    {
      id: 'signed',
      header: 'Assinatura',
      cell: ({ row }) => (row.original.signed_at ? formatDateBr(row.original.signed_at.slice(0, 10)) : 'Pendente'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <RowActions href={`/admin/contratos/${row.original.id}`} label={row.original.number} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      initialQuery={initialQuery}
      searchPlaceholder="Buscar contrato"
      emptyTitle="Nenhum contrato"
      emptyText="Contratos nascem de orçamentos aprovados."
      emptyAction={
        <Button asChild>
          <Link href="/admin/orcamentos">Abrir orçamentos</Link>
        </Button>
      }
      mobileTitle={(row) => row.number}
      filters={[
        {
          id: 'status',
          label: 'Todos os status',
          value: '',
          onChange: () => undefined,
          options: Object.entries(CONTRACT_STATUS_LABELS).map(([value, label]) => ({ value, label })),
        },
      ]}
    />
  );
}
