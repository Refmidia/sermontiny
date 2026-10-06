'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

export function MapEmbed({ query, address }: { query: string; address: string }) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        title="Mapa da Sermontiny"
        className="h-64 w-full rounded-[14px] border"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://maps.google.com/maps?q=${query}&z=15&output=embed`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group flex h-64 w-full flex-col items-center justify-center gap-3 rounded-[14px] border border-border bg-[linear-gradient(135deg,#eef3f9_0%,#dfe8f3_100%)] px-6 text-center transition hover:border-navy/30"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white shadow-md transition group-hover:scale-105">
        <MapPin className="h-5 w-5" />
      </span>
      <span className="text-sm font-semibold text-navy">Ver localização no mapa</span>
      <span className="max-w-xs text-xs leading-5 text-muted">{address}</span>
    </button>
  );
}
