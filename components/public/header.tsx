'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Menu } from 'lucide-react';
import { Logo } from '@/components/public/logo';
import { SiteContainer } from '@/components/public/site-container';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/', label: 'Início' },
  { href: '/empresa', label: 'Empresa' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/equipamentos', label: 'Equipamentos' },
  { href: '/projetos', label: 'Projetos' },
  { href: '/contato', label: 'Contato' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PublicHeader({ inverted = false }: { inverted?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white shadow-[0_1px_0_rgba(7,27,53,0.04)]">
      <SiteContainer className="flex h-[76px] items-center justify-between gap-4">
        <Logo className="min-w-0" />
        <nav className="hidden items-center gap-7 xl:flex" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium whitespace-nowrap transition-colors',
                isActive(pathname, item.href) ? 'text-navy' : 'text-muted hover:text-navy',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden lg:block">
          <Button asChild variant="gold">
            <Link href="/contato">
              Solicitar orçamento
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Button asChild variant="gold" size="sm">
            <Link href="/contato">Orçamento</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant={inverted ? 'outline' : 'ghost'} size="icon">
                <Menu />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-navy text-white">
              <Logo inverted className="mb-8" />
              <nav className="flex flex-col gap-4">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn('text-lg', isActive(pathname, item.href) ? 'text-gold' : 'text-white/85 hover:text-gold')}
                  >
                    {item.label}
                  </Link>
                ))}
                <Button asChild variant="gold" className="mt-4">
                  <Link href="/contato" onClick={() => setOpen(false)}>
                    Solicitar orçamento
                  </Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </SiteContainer>
    </header>
  );
}
