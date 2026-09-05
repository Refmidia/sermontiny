'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdminLogo } from '@/components/admin/admin-logo';

function LoginForm() {
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(
    params.get('config') === 'missing' ? 'O acesso ao painel ainda não está disponível. Fale com o administrador.' : null,
  );
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) setError(result.error);
    setPending(false);
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="next" value={params.get('next') ?? '/admin'} />
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            className="pr-11"
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted hover:text-navy"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Entrando...' : 'Entrar'}
      </Button>
      <p className="text-center text-sm">
        <Link href="/admin/recuperar-senha" className="text-steel underline">
          Esqueci minha senha
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="industrial-grid flex min-h-dvh items-center justify-center bg-navy px-4 py-10">
      <div className="w-full max-w-md rounded-[14px] bg-white p-8 shadow-panel">
        <AdminLogo href="/admin/login" className="mb-6" />
        <h1 className="text-[30px] font-bold text-navy">Acesso administrativo</h1>
        <p className="mt-2 text-sm text-muted">Área restrita da Sermontiny Montagens Industriais. Não há cadastro público.</p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
