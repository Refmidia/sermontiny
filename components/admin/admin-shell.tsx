'use client';

import { useState, useSyncExternalStore } from 'react';
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
        <div className="fixed inset-y-0 left-0 z-30 hidden print:hidden lg:block">
          <AdminSidebar
            collapsed={collapsed}
            permissions={permissions}
            name={name}
            roleName={roleName}
            variant="desktop"
          />
        </div>
        <div className={cn('flex min-h-dvh min-w-0 flex-col print:pl-0', collapsed ? 'lg:pl-20' : 'lg:pl-[272px]')}>
          <div className="print:hidden">
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
          <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 md:px-6 lg:px-8 print:max-w-none print:px-0 print:py-0">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
