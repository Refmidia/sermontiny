'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  FileSignature,
  Gauge,
  Inbox,
  LogOut,
  Settings,
  Shield,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { AdminLogo } from '@/components/admin/admin-logo';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { initialsFromName } from '@/lib/admin-ui';
import { cn } from '@/lib/utils';
import { hasPermission, type PermissionSlug } from '@/lib/permissions';

type NavItem = { href: string; label: string; icon: LucideIcon; permission: PermissionSlug };
type NavGroup = { label: string; items: NavItem[] };

const GROUPS: NavGroup[] = [
  {
    label: 'Visão geral',
    items: [{ href: '/admin', label: 'Dashboard', icon: Gauge, permission: 'dashboard.read' }],
  },
  {
    label: 'Operação',
    items: [
      { href: '/admin/leads', label: 'Contatos', icon: Inbox, permission: 'leads.read' },
      { href: '/admin/clientes', label: 'Clientes', icon: Users, permission: 'customers.read' },
      { href: '/admin/equipamentos', label: 'Equipamentos', icon: Truck, permission: 'equipment.read' },
      { href: '/admin/orcamentos', label: 'Orçamentos', icon: ClipboardList, permission: 'quotes.read' },
      { href: '/admin/contratos', label: 'Contratos', icon: FileSignature, permission: 'contracts.read' },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { href: '/admin/auditoria', label: 'Auditoria', icon: Shield, permission: 'audit.read' },
      { href: '/admin/configuracoes', label: 'Configurações', icon: Settings, permission: 'settings.read' },
    ],
  },
];

export function AdminSidebar({
  collapsed,
  permissions,
  name,
  roleName,
  variant = 'desktop',
  onNavigate,
}: {
  collapsed: boolean;
  permissions: PermissionSlug[];
  name: string;
  roleName: string | null;
  variant?: 'desktop' | 'drawer';
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const compact = collapsed && variant === 'desktop';

  return (
    <aside
      className={cn(
        'flex h-dvh min-h-0 flex-col overflow-hidden bg-navy text-white',
        variant === 'desktop' && 'hidden lg:flex',
        variant === 'desktop' && (compact ? 'w-20' : 'w-[272px]'),
        variant === 'drawer' && 'w-full',
      )}
    >
      <div className={cn('flex shrink-0 items-center justify-center border-b border-white/10', compact ? 'px-3 py-5' : 'px-4 py-5')}>
        <AdminLogo compact={compact} inverted href="/admin" />
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-4" aria-label="Administrativo">
        {GROUPS.map((group) => {
          const items = group.items.filter((item) => hasPermission(permissions, item.permission));
          if (items.length === 0) return null;
          return (
            <div key={group.label} className="mb-5">
              {!compact && (
                <p className="mb-2 px-3 text-[11px] font-semibold tracking-[0.16em] text-white/40 uppercase">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                  const link = (
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'relative flex min-w-0 items-center gap-3 overflow-hidden rounded-lg px-3 py-2.5 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white',
                        active && 'bg-[#0d294a] text-white',
                        compact && 'justify-center px-0',
                      )}
                    >
                      {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-gold" />}
                      <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-gold' : 'text-white/80')} />
                      {!compact && <span className="truncate">{item.label}</span>}
                    </Link>
                  );

                  if (!compact) return <div key={item.href}>{link}</div>;

                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{link}</TooltipTrigger>
                      <TooltipContent side="right">{item.label}</TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className={cn('shrink-0 border-t border-white/10', compact ? 'p-2' : 'p-4')}>
        <div className={cn('flex items-center gap-3', compact && 'flex-col')}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-gold">
            {initialsFromName(name)}
          </span>
          {!compact && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{name}</p>
              <p className="truncate text-[12px] text-white/50">{roleName ?? 'Usuário'}</p>
            </div>
          )}
          <form action={logoutAction}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </form>
        </div>
      </div>
    </aside>
  );
}
