'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ImagePlus, Trash2 } from 'lucide-react';
import { removeEquipmentPhoto, uploadEquipmentPhoto } from '@/app/actions/equipment';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function EquipmentPhotoField({
  equipmentId,
  photoUrl,
  canWrite = true,
  variant = 'card',
}: {
  equipmentId?: string;
  photoUrl?: string | null;
  canWrite?: boolean;
  variant?: 'card' | 'field';
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const shown = preview ?? photoUrl ?? null;

  function openPicker() {
    if (!canWrite || pending) return;
    inputRef.current?.click();
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file));

    if (!equipmentId) return;

    const data = new FormData();
    data.set('id', equipmentId);
    data.set('photo', file);
    startTransition(async () => {
      try {
        const result = await uploadEquipmentPhoto(data);
        if (result.error) {
          setError(result.error);
          setPreview(null);
          return;
        }
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Não foi possível enviar a foto.');
        setPreview(null);
      }
    });
  }

  function handleRemove() {
    if (!equipmentId) {
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    startTransition(async () => {
      try {
        const result = await removeEquipmentPhoto(equipmentId);
        if (result.error) {
          setError(result.error);
          return;
        }
        setPreview(null);
        router.refresh();
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Não foi possível remover a foto.');
      }
    });
  }

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        name={equipmentId ? undefined : 'photo'}
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={!canWrite || pending}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          'relative block w-full overflow-hidden rounded-xl border border-dashed text-left transition-colors',
          shown ? 'border-border bg-paper-strong' : 'border-navy/20 bg-paper-strong hover:border-gold hover:bg-white',
          canWrite && !pending && 'cursor-pointer',
          variant === 'card' ? 'aspect-[4/3]' : 'aspect-[16/9]',
        )}
      >
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Foto do equipamento" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-gold shadow-panel">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-sm font-semibold text-navy">
              {canWrite ? 'Clique ou arraste a foto' : 'Sem foto'}
            </span>
            {canWrite && <span className="text-xs text-muted">JPG, PNG ou WEBP até 8 MB</span>}
          </span>
        )}
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center bg-navy/45 text-sm font-medium text-white">
            Enviando...
          </span>
        )}
      </button>
      {canWrite && shown && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={openPicker} disabled={pending}>
            Trocar foto
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove} disabled={pending}>
            <Trash2 />
            Remover
          </Button>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
