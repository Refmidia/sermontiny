'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Download, Mail, Printer } from 'lucide-react';
import { generateQuotePdf } from '@/app/actions/documents';
import { Button } from '@/components/ui/button';
import { WhatsAppSendForm } from '@/components/admin/whatsapp-send-form';

export function QuoteDocumentActions({
  quoteId,
  quoteNumber,
  customerEmail,
  sendWhatsApp,
}: {
  quoteId: string;
  quoteNumber: string;
  customerEmail?: string | null;
  sendWhatsApp: (to: string) => Promise<{ error?: string; waLink?: string; url?: string } | void>;
}) {
  const [pending, setPending] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  async function generate(open = true) {
    setPending(true);
    const result = await generateQuotePdf(quoteId, true);
    setPending(false);
    if (result.error || !result.ok || !result.url) {
      toast.error(result.error ?? 'Não foi possível gerar o PDF.');
      return null;
    }
    setPdfUrl(result.url);
    toast.success('PDF gerado.');
    if (open) window.open(result.url, '_blank', 'noopener,noreferrer');
    return result.url;
  }

  async function sendEmail() {
    const url = pdfUrl ?? (await generate(false));
    if (!url) return;
    const subject = encodeURIComponent(`Proposta comercial ${quoteNumber} · Sermontiny`);
    const body = encodeURIComponent(
      `Segue a proposta comercial ${quoteNumber} em PDF:\n\n${url}\n\nSermontiny Montagens Industriais e Locações`,
    );
    window.location.href = `mailto:${customerEmail ?? ''}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline">
          <Link href={`/admin/orcamentos/${quoteId}/imprimir`} target="_blank">
            <Printer />
            Imprimir
          </Link>
        </Button>
        <Button type="button" variant="gold" disabled={pending} onClick={() => void generate(true)}>
          <Download />
          {pending ? 'Gerando PDF...' : 'Gerar e abrir PDF'}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => void sendEmail()}>
          <Mail />
          Enviar por e-mail
        </Button>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-navy">Enviar PDF pelo WhatsApp</p>
        <WhatsAppSendForm action={sendWhatsApp} />
      </div>
    </div>
  );
}
