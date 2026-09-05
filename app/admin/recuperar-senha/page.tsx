'use client';

import { useState } from 'react';
import Link from 'next/link';
import { recoverAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLogo } from '@/components/admin/admin-logo';

export default function RecoverPage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await recoverAction(formData);
    setPending(false);
    if ('error' in result && result.error) {
      setError(result.error);
      return;
    }
    setMessage('Se o e-mail existir e estiver ativo, enviaremos as instruções de recuperação.');
  }

  return (
    <div className="industrial-grid flex min-h-dvh items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-md rounded-[14px] bg-white p-8 shadow-panel">
        <AdminLogo href="/admin/login" className="mb-6" />
        <h1 className="text-[30px] font-bold text-navy">Recuperar senha</h1>
        <p className="mt-2 text-sm text-muted">Informe o e-mail do seu acesso ao painel.</p>
        <form action={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          {message && <p className="text-sm text-steel">{message}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Enviando...' : 'Enviar instruções'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link href="/admin/login" className="text-steel underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
