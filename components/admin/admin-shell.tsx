'use client';

import { useState, useSyncExternalStore } from 'react';
import { AdminLogo } from '@/components/admin/admin-logo';
import { AdminSidebar } from '@/components/admin/sidebar';
import { AdminHeader, type AdminNotification } from '@/components/admin/admin-header';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  getSidebarCollapsed,
  getSidebarCollapsedServer,
  subscribeSidebarCollapsed,
  toggleSidebarCollapsed,
} from '@/lib/sidebar-preference';
import { cn } from '@/lib/utils';
import type { PermissionSlug } from '@/lib/permissions';

export function AdminShell({
  name,
  roleName,
  email,
  permissions,
  notifications,
  children,
}: {
  name: string;
  roleName: string | null;
  email?: string;
  permissions: PermissionSlug[];
  notifications: AdminNotification[];
  children: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsed,
    getSidebarCollapsedServer,
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh bg-paper">
        <div className="sticky top-0 z-40 flex print:hidden">
          <div
            className={cn(
              'hidden h-16 shrink-0 items-center justify-center border-b border-white/10 bg-navy lg:flex',
              collapsed ? 'w-20 px-2' : 'w-[272px] px-4',
            )}
          >
            <AdminLogo compact={collapsed} inverted href="/admin" />
          </div>
          <div className="min-w-0 flex-1">
            <AdminHeader
              name={name}
              roleName={roleName}
              email={email}
              permissions={permissions}
              collapsed={collapsed}
              onToggle={toggleSidebarCollapsed}
              notifications={notifications}
              mobileOpen={mobileOpen}
              onMobileOpenChange={setMobileOpen}
            />
          </div>
        </div>

        <div className="fixed top-16 bottom-0 left-0 z-30 hidden print:hidden lg:block">
          <AdminSidebar
            collapsed={collapsed}
            permissions={permissions}
            name={name}
            roleName={roleName}
            variant="desktop"
            showBrand={false}
          />
        </div>

        <div className={cn('flex min-h-[calc(100dvh-4rem)] min-w-0 flex-col print:pl-0', collapsed ? 'lg:pl-20' : 'lg:pl-[272px]')}>
          <main className="w-full min-w-0 flex-1 px-4 py-6 md:px-6 lg:px-8 print:px-0 print:py-0">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
