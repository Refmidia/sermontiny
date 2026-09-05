'use client';

import { useRouter } from 'next/navigation';
import { Bell, LayoutGrid, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from '@/components/admin/sidebar';
import { SearchInput } from '@/components/admin/search-input';
import { UserProfileMenu } from '@/components/admin/user-profile-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDateTimeBr } from '@/lib/format';
import type { PermissionSlug } from '@/lib/permissions';
import Link from 'next/link';

export type AdminNotification = {
  id: string;
  title: string;
  text: string;
  href: string;
  createdAt: string;
};

export function AdminHeader({
  name,
  roleName,
  email,
  permissions,
  collapsed,
  onToggle,
  notifications,
  mobileOpen,
  onMobileOpenChange,
}: {
  name: string;
  roleName: string | null;
  email?: string;
  permissions: PermissionSlug[];
  collapsed: boolean;
  onToggle: () => void;
  notifications: AdminNotification[];
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

  function onSearch(value: string) {
    const query = value.trim();
    if (query.length < 2) return;
    const upper = query.toUpperCase();
    if (upper.startsWith('ORC') || upper.startsWith('CTR')) {
      router.push(upper.startsWith('CTR') ? `/admin/contratos?q=${encodeURIComponent(query)}` : `/admin/orcamentos?q=${encodeURIComponent(query)}`);
      return;
    }
    router.push(`/admin/clientes?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-white px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={onToggle}>
        {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        <span className="sr-only">Recolher menu</span>
      </Button>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu />
            <span className="sr-only">Abrir menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[272px] bg-navy p-0 text-white [&>button]:text-white">
          <AdminSidebar
            collapsed={false}
            permissions={permissions}
            name={name}
            roleName={roleName}
            variant="drawer"
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 items-center gap-2">
        <LayoutGrid className="hidden h-4 w-4 text-gold sm:block" />
        <p className="truncate text-sm font-medium text-navy">Painel operacional</p>
      </div>

      <form
        className="mx-auto hidden min-w-0 max-w-xl flex-1 md:block"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          onSearch(String(form.get('q') ?? ''));
        }}
      >
        <SearchInput name="q" placeholder="Buscar cliente, orçamento..." className="w-full" />
      </form>

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-navy">
                  {notifications.length}
                </span>
              )}
              <span className="sr-only">Notificações</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-2">
            <p className="px-2 py-1 text-xs font-semibold tracking-wide text-muted uppercase">Contatos recentes</p>
            {notifications.length === 0 && <p className="px-2 py-3 text-sm text-muted">Nenhuma notificação no momento.</p>}
            {notifications.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <Link href={item.href} className="flex flex-col items-start gap-0.5 py-2">
                  <span className="text-sm font-medium text-navy">{item.title}</span>
                  <span className="text-[12px] text-muted">{item.text}</span>
                  <span className="text-[11px] text-muted">{formatDateTimeBr(item.createdAt)}</span>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem asChild>
              <Link href="/admin/leads" className="mt-1 font-medium text-steel">
                Ver todos os contatos
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <UserProfileMenu name={name} roleName={roleName} email={email} />
      </div>
    </header>
  );
}
