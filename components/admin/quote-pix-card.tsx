import { CheckCircle2 } from 'lucide-react';
import { formatBRL } from '@/lib/money';

export function QuotePixCard({
  qrSrc,
  keyLabel,
  totalCents,
  totalExtenso,
}: {
  qrSrc: string;
  keyLabel?: string | null;
  totalCents: number;
  totalExtenso: string;
}) {
  return (
    <section className="break-inside-avoid overflow-hidden rounded-xl border border-[#E4C56A] bg-[linear-gradient(180deg,#FFF9E8_0%,#F7E7B0_100%)] shadow-[0_8px_24px_rgba(214,167,44,0.16)]">
      <div className="h-1.5 bg-gold" />
      <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-navy px-2.5 py-0.5 text-[10px] font-bold tracking-[0.2em] text-gold">
              PIX
            </span>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-navy uppercase">Pagamento via Pix</p>
          </div>
          <p className="mt-3 text-[11px] font-bold tracking-wide text-navy/55 uppercase">Total à vista</p>
          <p className="mt-0.5 text-[26px] leading-none font-bold text-navy">{formatBRL(totalCents)}</p>
          <p className="mt-1.5 text-[11px] text-navy/60 italic">{totalExtenso}</p>
          {keyLabel ? (
            <div className="mt-3 rounded-lg border border-[#E4C56A] bg-white/80 px-3 py-2">
              <p className="text-[10px] font-bold tracking-[0.14em] text-gold uppercase">Chave Pix · CNPJ</p>
              <p className="mt-0.5 text-[15px] font-bold tracking-wide text-navy">{keyLabel}</p>
            </div>
          ) : null}
          <p className="mt-3 text-xs text-navy/65">Escaneie o QR Code no aplicativo do seu banco.</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-navy/70">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-gold" />
              Pagamento instantâneo
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="size-3.5 text-gold" />
              Guarde o comprovante
            </span>
          </div>
        </div>
        <div className="justify-self-center rounded-xl border-2 border-[#D6A72C] bg-white p-2 shadow-[0_6px_16px_rgba(7,27,53,0.08)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="QR Code Pix" className="size-32" />
        </div>
      </div>
    </section>
  );
}
