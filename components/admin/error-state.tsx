import { Button } from '@/components/ui/button';

export function ErrorState({
  title = 'Não foi possível carregar os dados',
  text = 'Tente novamente. Se o problema continuar, fale com o administrador.',
  onRetry,
}: {
  title?: string;
  text?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-[14px] border border-danger/20 bg-danger-soft px-6 py-10 text-center">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-2 text-sm text-muted">{text}</p>
      {onRetry && (
        <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
