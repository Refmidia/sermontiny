'use client';

import Link from 'next/link';
import { FilePlus2, Inbox, Plus, UserCog, UserPlus, type LucideIcon } from 'lucide-react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ACTION_ICONS = {
  plus: Plus,
  inbox: Inbox,
  'file-plus': FilePlus2,
  'user-plus': UserPlus,
  'user-cog': UserCog,
} as const;

export type PageActionIcon = keyof typeof ACTION_ICONS;

export type PageAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: PageActionIcon;
  variant?: ButtonProps['variant'];
  disabled?: boolean;
  type?: 'button' | 'submit';
};

function resolveIcon(name?: PageActionIcon): LucideIcon | null {
  if (!name) return null;
  return ACTION_ICONS[name] ?? null;
}

export function PageActionBar({
  actions,
  children,
  className,
}: {
  actions?: PageAction[];
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions?.map((action) => {
        const Icon = resolveIcon(action.icon);
        const variant = action.variant ?? (action.href || action.onClick ? 'outline' : 'gold');
        if (action.href) {
          return (
            <Button key={action.label} asChild variant={variant} disabled={action.disabled}>
              <Link href={action.href}>
                {Icon ? <Icon /> : null}
                {action.label}
              </Link>
            </Button>
          );
        }
        return (
          <Button
            key={action.label}
            type={action.type ?? 'button'}
            variant={variant}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {Icon ? <Icon /> : null}
            {action.label}
          </Button>
        );
      })}
      {children}
    </div>
  );
}
