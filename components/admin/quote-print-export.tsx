'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';

export function QuotePrintExport({
  targetId,
  fileName,
}: {
  targetId: string;
  fileName: string;
}) {
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (searchParams.get('export') !== 'png' || started.current) return;
    started.current = true;
    setBusy(true);

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const node = document.getElementById(targetId);
        if (!node) throw new Error('Documento não encontrado.');

        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        if (cancelled) return;

        const link = document.createElement('a');
        link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
        link.href = dataUrl;
        link.click();
        toast.success('Imagem baixada.');

        const url = new URL(window.location.href);
        url.searchParams.delete('export');
        window.history.replaceState({}, '', url.toString());
      } catch {
        if (!cancelled) toast.error('Não foi possível baixar a imagem.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchParams, targetId, fileName]);

  if (!busy) return null;
  return (
    <p className="print:hidden text-sm text-muted" aria-live="polite">
      Preparando imagem para download...
    </p>
  );
}
