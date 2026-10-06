'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Download, ImageDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toPng } from 'html-to-image';

export function QuotePreviewActions({
  quoteId,
  quoteNumber,
  targetId,
}: {
  quoteId: string;
  quoteNumber: string;
  targetId: string;
}) {
  const router = useRouter();

  function downloadPdf() {
    const link = document.createElement('a');
    link.href = `/api/quotes/${quoteId}/pdf?download=1`;
    link.download = `${quoteNumber}.pdf`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Download do PDF iniciado.');
  }

  async function downloadImage() {
    try {
      const node = document.getElementById(targetId);
      if (!node) throw new Error('Documento não encontrado.');
      toast.message('Gerando imagem...');
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `${quoteNumber}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Imagem baixada.');
    } catch {
      toast.error('Não foi possível baixar a imagem.');
      router.push(`/admin/orcamentos/${quoteId}/imprimir?export=png`);
    }
  }

  return (
    <div className="print:hidden flex flex-wrap items-center justify-center gap-3">
      <Button type="button" className="min-w-[140px] bg-navy text-white hover:bg-navy/90" onClick={downloadPdf}>
        <Download />
        Baixar PDF
      </Button>
      <Button type="button" variant="gold" className="min-w-[140px]" onClick={() => void downloadImage()}>
        <ImageDown />
        Baixar imagem
      </Button>
      <Button type="button" variant="outline" className="min-w-[140px] bg-white" onClick={() => window.print()}>
        <Printer />
        Imprimir
      </Button>
    </div>
  );
}
