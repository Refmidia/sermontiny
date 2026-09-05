'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { equipmentSchema } from '@/lib/validations/common';
import { emptyToNull, parseMoneyField, parseOptionalNumber, uniqueSlug } from '@/lib/forms';
import { sanitizeMultiline, sanitizePlainText } from '@/lib/sanitize';

const PHOTO_MAX_BYTES = 8 * 1024 * 1024;

function revalidateEquipment(id?: string) {
  revalidatePath('/admin/equipamentos');
  revalidatePath('/equipamentos');
  if (id) revalidatePath(`/admin/equipamentos/${id}`);
}

function photoExtension(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith('.png') || file.type === 'image/png') return 'png';
  if (name.endsWith('.webp') || file.type === 'image/webp') return 'webp';
  return 'jpg';
}

async function storeEquipmentPhoto(file: File): Promise<{ path: string } | { error: string }> {
  if (!file.size) return { error: 'Selecione uma imagem.' };
  if (file.size > PHOTO_MAX_BYTES) return { error: 'A foto deve ter no máximo 8 MB.' };
  if (!file.type.startsWith('image/')) return { error: 'Envie um arquivo de imagem (JPG, PNG ou WEBP).' };

  const path = `${crypto.randomUUID()}.${photoExtension(file)}`;
  const options = { upsert: false, contentType: file.type || 'image/jpeg' };

  try {
    const admin = createAdminClient();
    const { error } = await admin.storage.from('equipment').upload(path, file, options);
    if (!error) return { path };
  } catch {
    // Cai no client autenticado se a service role não estiver no ambiente.
  }

  const supabase = await createClient();
  const { error } = await supabase.storage.from('equipment').upload(path, file, options);
  if (error) return { error: 'Não foi possível enviar a foto.' };
  return { path };
}

export async function saveEquipment(formData: FormData) {
  const user = await assertPermission('equipment.write');
  const canWritePrice = user.permissions.includes('prices.write');
  const id = String(formData.get('id') || '');
  const parsed = equipmentSchema.safeParse({
    name: formData.get('name'),
    brand: formData.get('brand') || '',
    model: formData.get('model') || '',
    capacity_tons: formData.get('capacity_tons') || '',
    plate: formData.get('plate') || '',
    year: formData.get('year') || '',
    asset_number: formData.get('asset_number') || '',
    description: formData.get('description') || '',
    technical_features: formData.get('technical_features') || '',
    status: formData.get('status'),
    available_for_quote: formData.get('available_for_quote') === 'on',
    show_on_website: formData.get('show_on_website') === 'on',
    show_availability_public: formData.get('show_availability_public') === 'on',
    daily_reais: formData.get('daily_reais') || '',
    monthly_reais: formData.get('monthly_reais') || '',
    hourly_reais: formData.get('hourly_reais') || '',
    km_reais: formData.get('km_reais') || '',
    min_hours_per_day: formData.get('min_hours_per_day') || '',
    notes: formData.get('notes') || '',
    name_needs_confirmation: formData.get('name_needs_confirmation') === 'on',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };

  const payload: Record<string, unknown> = {
    name: sanitizePlainText(parsed.data.name),
    brand: emptyToNull(parsed.data.brand),
    model: emptyToNull(parsed.data.model),
    capacity_tons: parseOptionalNumber(parsed.data.capacity_tons),
    plate: emptyToNull(parsed.data.plate),
    year: parseOptionalNumber(parsed.data.year),
    asset_number: emptyToNull(parsed.data.asset_number),
    description: parsed.data.description ? sanitizeMultiline(parsed.data.description) : null,
    technical_features: parsed.data.technical_features
      ? sanitizeMultiline(parsed.data.technical_features)
      : null,
    status: parsed.data.status,
    available_for_quote: parsed.data.available_for_quote,
    show_on_website: parsed.data.show_on_website,
    show_availability_public: parsed.data.show_availability_public,
    notes: parsed.data.notes ? sanitizeMultiline(parsed.data.notes) : null,
    name_needs_confirmation: parsed.data.name_needs_confirmation,
  };

  if (canWritePrice) {
    payload.daily_cents = parseMoneyField(parsed.data.daily_reais);
    payload.monthly_cents = parseMoneyField(parsed.data.monthly_reais);
    payload.hourly_cents = parseMoneyField(parsed.data.hourly_reais);
    payload.km_cents = parseMoneyField(parsed.data.km_reais);
    payload.min_hours_per_day = parseOptionalNumber(parsed.data.min_hours_per_day) ?? 10;
  }

  const supabase = await createClient();
  const photo = formData.get('photo');
  if (photo instanceof File && photo.size > 0) {
    const stored = await storeEquipmentPhoto(photo);
    if ('error' in stored) return { error: stored.error };
    payload.photo_path = stored.path;
  }

  if (id) {
    const { data: current } = await supabase
      .from('equipment')
      .select('daily_cents, monthly_cents, hourly_cents, km_cents')
      .eq('id', id)
      .single();
    const { error } = await supabase.from('equipment').update(payload).eq('id', id);
    if (error) return { error: 'Não foi possível atualizar o equipamento.' };
    if (
      canWritePrice &&
      current &&
      (current.daily_cents !== payload.daily_cents ||
        current.monthly_cents !== payload.monthly_cents ||
        current.hourly_cents !== payload.hourly_cents ||
        current.km_cents !== payload.km_cents)
    ) {
      await writeAuditLog({
        actorId: user.id,
        action: 'price_change',
        entity: 'equipment',
        entityId: id,
        metadata: { from: current, to: payload },
      });
    } else {
      await writeAuditLog({ actorId: user.id, action: 'update', entity: 'equipment', entityId: id });
    }
    revalidateEquipment(id);
    return { ok: true as const };
  }

  payload.slug = uniqueSlug(parsed.data.name, crypto.randomUUID().slice(0, 6));
  payload.created_by = user.id;
  const { data, error } = await supabase.from('equipment').insert(payload).select('id').single();
  if (error || !data) return { error: 'Não foi possível cadastrar o equipamento.' };
  await writeAuditLog({ actorId: user.id, action: 'create', entity: 'equipment', entityId: data.id });
  revalidatePath('/admin/equipamentos');
  return { ok: true as const, id: data.id };
}

export async function uploadEquipmentPhoto(formData: FormData) {
  const user = await assertPermission('equipment.write');
  const id = String(formData.get('id') || '');
  const photo = formData.get('photo');
  if (!id) return { error: 'Equipamento inválido.' };
  if (!(photo instanceof File) || photo.size === 0) return { error: 'Selecione uma imagem.' };

  const stored = await storeEquipmentPhoto(photo);
  if ('error' in stored) return { error: stored.error };

  const supabase = await createClient();
  const { data: current } = await supabase.from('equipment').select('photo_path').eq('id', id).maybeSingle();
  const { error } = await supabase.from('equipment').update({ photo_path: stored.path }).eq('id', id);
  if (error) return { error: 'Não foi possível salvar a foto.' };

  if (current?.photo_path) {
    const admin = createAdminClient();
    await admin.storage.from('equipment').remove([current.photo_path]);
  }

  await writeAuditLog({ actorId: user.id, action: 'update', entity: 'equipment', entityId: id, metadata: { photo: true } });
  revalidateEquipment(id);
  return { ok: true as const };
}

export async function removeEquipmentPhoto(id: string) {
  const user = await assertPermission('equipment.write');
  const supabase = await createClient();
  const { data: current } = await supabase.from('equipment').select('photo_path').eq('id', id).maybeSingle();
  const { error } = await supabase.from('equipment').update({ photo_path: null }).eq('id', id);
  if (error) return { error: 'Não foi possível remover a foto.' };

  if (current?.photo_path) {
    const admin = createAdminClient();
    await admin.storage.from('equipment').remove([current.photo_path]);
  }

  await writeAuditLog({ actorId: user.id, action: 'update', entity: 'equipment', entityId: id, metadata: { photo: false } });
  revalidateEquipment(id);
  return { ok: true as const };
}

export async function softDeleteEquipment(id: string) {
  const user = await assertPermission('equipment.delete');
  const supabase = await createClient();
  const { error } = await supabase
    .from('equipment')
    .update({ deleted_at: new Date().toISOString(), show_on_website: false, available_for_quote: false })
    .eq('id', id);
  if (error) return { error: 'Não foi possível excluir o equipamento.' };
  await writeAuditLog({ actorId: user.id, action: 'soft_delete', entity: 'equipment', entityId: id });
  revalidatePath('/admin/equipamentos');
  redirect('/admin/equipamentos');
}
