'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const KEY = 'sermontiny-cookie-consent';

function subscribe() {
  return () => undefined;
}

function getConsent() {
  return window.localStorage.getItem(KEY);
}

export function CookieBanner() {
  const stored = useSyncExternalStore(subscribe, getConsent, () => 'pending');
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || stored === 'pending' || stored) return null;

  function persist(value: string) {
    window.localStorage.setItem(KEY, value);
    setDismissed(true);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 p-4 shadow-panel">
      <div className="site-container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted">
          Utilizamos cookies essenciais para o funcionamento do site e, com o seu consentimento, cookies de
          medição. Consulte a{' '}
          <Link href="/cookies" className="font-medium text-navy underline">
            política de cookies
          </Link>{' '}
          e a{' '}
          <Link href="/privacidade" className="font-medium text-navy underline">
            política de privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => persist('essential')}>
            Somente essenciais
          </Button>
          <Button onClick={() => persist('all')}>Aceitar</Button>
        </div>
      </div>
    </div>
  );
}
