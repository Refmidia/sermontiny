'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ImagePlus, Plus, RotateCcw, Trash2, Undo2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createSiteService,
  deleteSiteService,
  resetSiteService,
  restoreHiddenService,
  saveServicesSection,
  saveSiteService,
} from '@/app/actions/site-content';
import { FormActions } from '@/components/admin/form-actions';
import { FormField } from '@/components/admin/form-section';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ADMIN_SELECT_CLASS } from '@/lib/admin-ui';
import { SERVICE_ICON_OPTIONS } from '@/lib/content/service-icons';
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
  iconKey: string;
  custom: boolean;
  showOnHome: boolean;
};

type ActionResult = { ok: true } | { error: string };

function failed(result: ActionResult | { ok: true; slug: string }) {
  if ('error' in result && result.error) {
    toast.error(result.error);
    return true;
  }
  return false;
}

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
      if (failed(await saveServicesSection(formData))) return;
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

function usePhotoPicker() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  async function pick(file: File | undefined) {
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

  function clear() {
    setPhoto(null);
    setPreview(null);
    setRemovePhoto(false);
  }

  return { photo, preview, removePhoto, setRemovePhoto, pick, clear };
}

function ServiceFields({
  service,
  picker,
  canWrite,
  pending,
}: {
  service: EditableService;
  picker: ReturnType<typeof usePhotoPicker>;
  canWrite: boolean;
  pending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const shown = picker.removePhoto ? service.defaultImageSrc : (picker.preview ?? service.imageSrc);

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <div className="space-y-3">
        <button
          type="button"
          disabled={!canWrite || pending}
          onClick={() => inputRef.current?.click()}
          className="relative block aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-navy"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shown} alt={`Foto de ${service.shortTitle || 'serviço'}`} className="h-full w-full object-cover" />
          {canWrite && (
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-navy/70 py-2 text-sm font-medium text-white">
              <ImagePlus className="h-4 w-4" />
              {service.customImage || picker.preview ? 'Trocar foto' : 'Escolher foto'}
            </span>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(event) => picker.pick(event.target.files?.[0])}
        />
        {picker.preview && <p className="text-[12px] text-gold">Nova foto selecionada — clique em Salvar.</p>}
        {picker.removePhoto && <p className="text-[12px] text-gold">A foto padrão volta ao salvar.</p>}
        {canWrite && service.customImage && !picker.preview && !picker.removePhoto && (
          <Button type="button" variant="ghost" size="sm" onClick={() => picker.setRemovePhoto(true)}>
            Usar foto padrão
          </Button>
        )}
        <FormField label="Ícone do card">
          <select name="icon" defaultValue={service.iconKey} className={ADMIN_SELECT_CLASS} disabled={!canWrite}>
            {SERVICE_ICON_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
        <label className="flex items-center gap-2 text-sm text-navy">
          <input type="checkbox" name="show_on_home" value="1" defaultChecked={service.showOnHome} disabled={!canWrite} />
          Mostrar na página inicial
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Nome no card" hint="Título curto que aparece nos cards.">
          <Input name="short_title" defaultValue={service.shortTitle} maxLength={120} disabled={!canWrite} required={service.custom} />
        </FormField>
        <FormField label="Título da página do serviço">
          <Input name="title" defaultValue={service.title} maxLength={190} disabled={!canWrite} />
        </FormField>
        <FormField label="Resumo do card" className="md:col-span-2">
          <Textarea name="summary" defaultValue={service.summary} maxLength={500} rows={2} disabled={!canWrite} required={service.custom} />
        </FormField>
        <FormField label="Texto da página do serviço" className="md:col-span-2">
          <Textarea name="description" defaultValue={service.description} rows={4} disabled={!canWrite} />
        </FormField>
        <FormField label="Como executamos" hint="Um item por linha.">
          <Textarea name="highlights" defaultValue={service.highlights.join('\n')} rows={5} disabled={!canWrite} />
        </FormField>
        <FormField label="Aplicações" hint="Um item por linha.">
          <Textarea name="applications" defaultValue={service.applications.join('\n')} rows={5} disabled={!canWrite} />
        </FormField>
      </div>
    </div>
  );
}

export function NewServiceCard({ defaultImageSrc }: { defaultImageSrc: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const picker = usePhotoPicker();

  const blank: EditableService = {
    slug: '',
    title: '',
    shortTitle: '',
    summary: '',
    description: '',
    highlights: [],
    applications: [],
    imageSrc: defaultImageSrc,
    defaultImageSrc,
    customImage: false,
    iconKey: 'factory',
    custom: true,
    showOnHome: false,
  };

  function close() {
    setOpen(false);
    picker.clear();
    setFormKey((key) => key + 1);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (picker.photo) formData.set('photo', picker.photo);
    startTransition(async () => {
      if (failed(await createSiteService(formData))) return;
      toast.success('Serviço adicionado. Já está no site.');
      close();
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button type="button" variant="gold" onClick={() => setOpen(true)}>
        <Plus />
        Adicionar serviço
      </Button>
    );
  }

  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
      className="basis-full rounded-[14px] border-2 border-gold bg-white p-5 shadow-panel md:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-navy">Novo serviço</h2>
          <p className="mt-1 text-[13px] text-muted">Preencha pelo menos o nome e o resumo. A foto é opcional.</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={close} aria-label="Cancelar">
          <X />
        </Button>
      </div>
      <ServiceFields service={blank} picker={picker} canWrite pending={pending} />
      <FormActions className="mt-5">
        <Button type="button" variant="ghost" onClick={close} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" variant="gold" disabled={pending}>
          {pending ? 'Adicionando...' : 'Adicionar serviço'}
        </Button>
      </FormActions>
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
  const [pending, startTransition] = useTransition();
  const picker = usePhotoPicker();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('slug', service.slug);
    if (picker.photo) formData.set('photo', picker.photo);
    if (picker.removePhoto) formData.set('remove_photo', '1');
    startTransition(async () => {
      if (failed(await saveSiteService(formData))) return;
      toast.success(`"${service.shortTitle}" salvo. Já está no site.`);
      picker.clear();
      router.refresh();
    });
  }

  function onReset() {
    if (!window.confirm('Voltar este serviço aos textos e à foto originais?')) return;
    startTransition(async () => {
      if (failed(await resetSiteService(service.slug))) return;
      toast.success('Serviço restaurado.');
      picker.clear();
      router.refresh();
    });
  }

  function onDelete() {
    const message = service.custom
      ? `Excluir "${service.shortTitle}"? Ele sai do site e não poderá ser recuperado.`
      : `Excluir "${service.shortTitle}" do site? Ele fica na lista de excluídos e pode voltar depois.`;
    if (!window.confirm(message)) return;
    startTransition(async () => {
      if (failed(await deleteSiteService(service.slug))) return;
      toast.success(`"${service.shortTitle}" excluído do site.`);
      router.refresh();
    });
  }

  return (
    <details className="group rounded-[14px] border border-border bg-white shadow-panel open:shadow-[0_16px_40px_rgba(7,27,53,0.08)]">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-4 [&::-webkit-details-marker]:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={service.imageSrc} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[11px] font-semibold tracking-[0.18em] text-gold">{String(index + 1).padStart(2, '0')}</p>
            {service.showOnHome && <Badge variant="muted">Página inicial</Badge>}
            {service.custom && <Badge variant="gold">Novo</Badge>}
          </div>
          <p className="truncate font-semibold text-navy">{service.shortTitle}</p>
          <p className="truncate text-[13px] text-muted">{service.summary}</p>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>

      <form onSubmit={onSubmit} className="border-t border-border p-5 md:p-6">
        <ServiceFields service={service} picker={picker} canWrite={canWrite} pending={pending} />

        {canWrite && (
          <FormActions className="mt-5">
            <Button type="button" variant="ghost" onClick={onDelete} disabled={pending} className="text-danger">
              <Trash2 />
              Excluir
            </Button>
            {!service.custom && (
              <Button type="button" variant="ghost" onClick={onReset} disabled={pending}>
                <RotateCcw />
                Restaurar original
              </Button>
            )}
            <Button type="submit" variant="gold" disabled={pending}>
              {pending ? 'Salvando...' : 'Salvar serviço'}
            </Button>
          </FormActions>
        )}
      </form>
    </details>
  );
}

export function HiddenServiceRow({
  slug,
  shortTitle,
  imageSrc,
  canWrite,
}: {
  slug: string;
  shortTitle: string;
  imageSrc: string;
  canWrite: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onRestore() {
    startTransition(async () => {
      if (failed(await restoreHiddenService(slug))) return;
      toast.success(`"${shortTitle}" voltou ao site.`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4 rounded-[14px] border border-dashed border-border bg-paper p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover opacity-60 grayscale" />
      <p className="min-w-0 flex-1 truncate font-medium text-muted">{shortTitle}</p>
      {canWrite && (
        <Button type="button" variant="outline" size="sm" onClick={onRestore} disabled={pending}>
          <Undo2 />
          {pending ? 'Voltando...' : 'Voltar ao site'}
        </Button>
      )}
    </div>
  );
}
