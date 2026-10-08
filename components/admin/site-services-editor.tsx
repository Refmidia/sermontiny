'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ImagePlus, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { resetSiteService, saveServicesSection, saveSiteService } from '@/app/actions/site-content';
import { FormActions } from '@/components/admin/form-actions';
import { FormField } from '@/components/admin/form-section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { compressImageFile } from '@/lib/images/compress-avatar';

export type EditableService = {
  slug: string;
  title: string;
  shortTitle: string;
  summary: string;
  description: string;
  highlights: string[];
  applications: string[];
  imageSrc: string;
  defaultImageSrc: string;
  customImage: boolean;
};

export function ServicesSectionForm({
  eyebrow,
  title,
  canWrite,
}: {
  eyebrow: string;
  title: string;
  canWrite: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveServicesSection(formData);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Título da seção salvo.');
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-[14px] border border-border bg-white p-5 shadow-panel md:p-6"
    >
      <h2 className="text-lg font-semibold text-navy">Título da seção</h2>
      <p className="mt-1 text-[13px] text-muted">Aparece acima dos cards na página inicial e em Serviços.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_2fr]">
        <FormField label="Texto pequeno (acima do título)">
          <Input name="services_eyebrow" defaultValue={eyebrow} maxLength={120} disabled={!canWrite} />
        </FormField>
        <FormField label="Título">
          <Input name="services_title" defaultValue={title} maxLength={255} disabled={!canWrite} />
        </FormField>
      </div>
      {canWrite && (
        <FormActions className="mt-5">
          <Button type="submit" variant="gold" disabled={pending}>
            {pending ? 'Salvando...' : 'Salvar título'}
          </Button>
        </FormActions>
      )}
    </form>
  );
}

export function ServiceEditorCard({
  service,
  index,
  canWrite,
}: {
  service: EditableService;
  index: number;
  canWrite: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const shown = preview ?? service.imageSrc;

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, { maxEdge: 1600, quality: 0.8, type: 'image/webp' });
      setPhoto(compressed);
      setPreview(URL.createObjectURL(compressed));
      setRemovePhoto(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível processar a foto.');
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('slug', service.slug);
    if (photo) formData.set('photo', photo);
    if (removePhoto) formData.set('remove_photo', '1');
    startTransition(async () => {
      const result = await saveSiteService(formData);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`"${service.shortTitle}" salvo. Já está no site.`);
      setPhoto(null);
      setPreview(null);
      setRemovePhoto(false);
      router.refresh();
    });
  }

  function onReset() {
    if (!window.confirm('Voltar este serviço aos textos e à foto originais?')) return;
    startTransition(async () => {
      const result = await resetSiteService(service.slug);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Serviço restaurado.');
      setPhoto(null);
      setPreview(null);
      router.refresh();
    });
  }

  return (
    <details className="group rounded-[14px] border border-border bg-white shadow-panel open:shadow-[0_16px_40px_rgba(7,27,53,0.08)]">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-4 [&::-webkit-details-marker]:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={service.imageSrc} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.18em] text-gold">{String(index + 1).padStart(2, '0')}</p>
          <p className="truncate font-semibold text-navy">{service.shortTitle}</p>
          <p className="truncate text-[13px] text-muted">{service.summary}</p>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>

      <form onSubmit={onSubmit} className="border-t border-border p-5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            <button
              type="button"
              disabled={!canWrite || pending}
              onClick={() => inputRef.current?.click()}
              className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-navy"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={removePhoto ? service.defaultImageSrc : shown}
                alt={`Foto de ${service.shortTitle}`}
                className="h-full w-full object-cover"
              />
              {canWrite && (
                <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-navy/70 py-2 text-sm font-medium text-white">
                  <ImagePlus className="h-4 w-4" />
                  Trocar foto
                </span>
              )}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
            {preview && <p className="text-[12px] text-gold">Nova foto selecionada — clique em Salvar.</p>}
            {removePhoto && <p className="text-[12px] text-gold">A foto padrão volta ao salvar.</p>}
            {canWrite && service.customImage && !preview && !removePhoto && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setRemovePhoto(true)}>
                Usar foto padrão
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Nome no card" hint="Título curto que aparece na página inicial.">
              <Input name="short_title" defaultValue={service.shortTitle} maxLength={120} disabled={!canWrite} />
            </FormField>
            <FormField label="Título da página do serviço">
              <Input name="title" defaultValue={service.title} maxLength={190} disabled={!canWrite} />
            </FormField>
            <FormField label="Resumo do card" className="md:col-span-2">
              <Textarea name="summary" defaultValue={service.summary} maxLength={500} rows={2} disabled={!canWrite} />
            </FormField>
            <FormField label="Texto da página do serviço" className="md:col-span-2">
              <Textarea name="description" defaultValue={service.description} rows={4} disabled={!canWrite} />
            </FormField>
            <FormField label="Como executamos" hint="Um item por linha.">
              <Textarea name="highlights" defaultValue={service.highlights.join('\n')} rows={5} disabled={!canWrite} />
            </FormField>
            <FormField label="Aplicações" hint="Um item por linha.">
              <Textarea
                name="applications"
                defaultValue={service.applications.join('\n')}
                rows={5}
                disabled={!canWrite}
              />
            </FormField>
          </div>
        </div>

        {canWrite && (
          <FormActions className="mt-5">
            <Button type="button" variant="ghost" onClick={onReset} disabled={pending}>
              <RotateCcw />
              Restaurar original
            </Button>
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? 'Salvando...' : 'Salvar serviço'}
            </Button>
          </FormActions>
        )}
      </form>
    </details>
  );
}
