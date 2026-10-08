'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { saveSiteMedia } from '@/app/actions/site-content';
import { FormActions } from '@/components/admin/form-actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { compressImageFile } from '@/lib/images/compress-avatar';

export function SiteMediaCard({
  slot,
  label,
  where,
  src,
  custom,
  canWrite,
}: {
  slot: string;
  label: string;
  where: string;
  src: string;
  custom: boolean;
  canWrite: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, { maxEdge: 1920, quality: 0.8, type: 'image/webp' });
      setPhoto(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível processar a foto.');
    }
  }

  function submit(removePhoto: boolean) {
    const formData = new FormData();
    formData.set('slot', slot);
    if (removePhoto) formData.set('remove_photo', '1');
    else if (photo) formData.set('photo', photo);
    startTransition(async () => {
      const result = await saveSiteMedia(formData);
      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(removePhoto ? 'Foto padrão de volta no site.' : 'Foto trocada. Já está no site.');
      setPhoto(null);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    });
  }

  return (
    <div className="rounded-[14px] border border-border bg-white p-5 shadow-panel">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold text-navy">{label}</h2>
        {custom && <Badge variant="gold">Foto trocada</Badge>}
      </div>
      <p className="mt-1 text-[13px] text-muted">{where}</p>

      <button
        type="button"
        disabled={!canWrite || pending}
        onClick={() => inputRef.current?.click()}
        className="relative mt-4 block aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-navy"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview ?? src} alt={label} className="h-full w-full object-cover" />
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
      {preview && <p className="mt-2 text-[12px] text-gold">Nova foto selecionada — clique em Salvar foto.</p>}

      {canWrite && (
        <FormActions className="mt-4">
          {custom && !preview && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                if (window.confirm('Voltar para a foto original do site?')) submit(true);
              }}
            >
              Usar foto padrão
            </Button>
          )}
          {preview && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                setPhoto(null);
                setPreview(null);
              }}
            >
              Cancelar
            </Button>
          )}
          <Button type="button" variant="gold" disabled={pending || !photo} onClick={() => submit(false)}>
            {pending ? 'Salvando...' : 'Salvar foto'}
          </Button>
        </FormActions>
      )}
    </div>
  );
}
