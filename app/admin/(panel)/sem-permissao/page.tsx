import Link from 'next/link';
import { ContentCard } from '@/components/admin/content-card';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <ContentCard title="Acesso restrito">
      <p className="text-sm text-muted">
        O seu perfil não possui permissão para esta área. Solicite ajuste ao administrador.
      </p>
      <Button asChild className="mt-4">
        <Link href="/admin">Voltar ao painel</Link>
      </Button>
    </ContentCard>
  );
}
