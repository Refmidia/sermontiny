'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function WhatsAppSendForm({
  action,
}: {
  action: (to: string) => Promise<{ error?: string; waLink?: string; url?: string } | void>;
}) {
  const [to, setTo] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    const result = await action(to);
    setPending(false);
    if (!result) return;
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.waLink) {
      window.open(result.waLink, '_blank', 'noopener,noreferrer');
      setMessage('O WhatsApp foi aberto com a mensagem e o link do PDF. O aplicativo não anexa o arquivo automaticamente.');
      return;
    }
    setMessage(result.url ? `Mensagem enviada pela API oficial. PDF: ${result.url}` : 'Envio registrado.');
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <Input value={to} onChange={(event) => setTo(event.target.value)} placeholder="5511999999999" />
        <Button type="submit" disabled={pending}>
          {pending ? 'Preparando...' : 'Enviar'}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {message && <p className="text-sm text-steel">{message}</p>}
    </form>
  );
}
