'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

export function WhatsAppWidget({ href, phone }: { href: string; phone: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {open && (
        <div
          role="dialog"
          aria-label="Conversar no WhatsApp"
          className="w-[300px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_rgba(7,27,53,0.3)] ring-1 ring-black/5"
        >
          <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15">
              <WhatsAppIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Sermontiny</p>
              <p className="text-xs text-white/80">Comercial • {phone}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fechar"
              className="rounded-full p-1 text-white/80 transition hover:bg-white/15 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="bg-[#ECE5DD] px-4 py-5">
            <div className="relative max-w-[85%] rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm leading-5 text-neutral-800 shadow-sm">
              Olá! 👋 Como podemos ajudar? Fale com nosso comercial sobre montagem industrial ou locação de
              equipamentos.
            </div>
          </div>
          <div className="bg-white p-3">
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1ebe5a]"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Iniciar conversa
            </a>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Fechar conversa do WhatsApp' : 'Abrir conversa do WhatsApp'}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,0.45)] transition hover:scale-105 hover:bg-[#1ebe5a] focus-visible:ring-4 focus-visible:ring-[#25D366]/40 focus-visible:outline-none"
      >
        {open ? <X className="h-6 w-6" /> : <WhatsAppIcon className="h-7 w-7" />}
      </button>
    </div>
  );
}
