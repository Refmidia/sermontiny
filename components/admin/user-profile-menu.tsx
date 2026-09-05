'use client';

import Link from 'next/link';
import { LogOut, Settings, User } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { initialsFromName } from '@/lib/admin-ui';

export function UserProfileMenu({
  name,
  roleName,
  email,
}: {
  name: string;
  roleName: string | null;
  email?: string;
}) {
  const initials = initialsFromName(name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menu do perfil"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-semibold text-white">
            {initials}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <div className="px-2 py-2">
          <p className="truncate text-sm font-semibold text-navy">{name}</p>
          <p className="truncate text-[12px] text-muted">{roleName ?? 'Perfil sem nome'}</p>
          {email && <p className="truncate text-[12px] text-muted">{email}</p>}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/configuracoes">
            <Settings className="h-4 w-4" />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/admin">
            <User className="h-4 w-4" />
            Painel
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <form action={logoutAction}>
          <button type="submit" className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-danger hover:bg-danger-soft">
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
