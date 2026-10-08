'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { SERVICES } from '@/lib/content/services';
import { SITE_SERVICES_TAG } from '@/lib/data/services';
import { createClient } from '@/lib/db/server';
import { sanitizeMultiline, sanitizePlainText } from '@/lib/sanitize';

const PHOTO_MAX_BYTES = 3 * 1024 * 1024;
const COMPANY_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

function text(formData: FormData, name: string, max: number) {
  const value = sanitizePlainText(String(formData.get(name) ?? '')).trim();
  return value ? value.slice(0, max) : null;
}

function lines(formData: FormData, name: string) {
  const items = String(formData.get(name) ?? '')
    .split(/\r?\n/)
    .map((line) => sanitizePlainText(line).trim())
    .filter(Boolean)
    .slice(0, 12);
  return items.length ? items : null;
}

function refreshServicePages(slug?: string) {
  updateTag(SITE_SERVICES_TAG);
  revalidatePath('/');
  revalidatePath('/servicos');
  if (slug) revalidatePath(`/servicos/${slug}`);
  revalidatePath('/admin/servicos');
}

function photoExtension(file: File) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function saveSiteService(formData: FormData) {
  try {
    const user = await assertPermission('settings.write');
    const slug = String(formData.get('slug') ?? '');
    if (!SERVICES.some((service) => service.slug === slug)) return { error: 'Serviço inválido.' };

    const db = await createClient();
    const { data: current } = await db.from('site_services').select('image_path').eq('slug', slug).maybeSingle();

    let imagePath: string | null = current?.image_path ?? null;
    const photo = formData.get('photo');
    if (photo instanceof File && photo.size > 0) {
      if (!photo.type.startsWith('image/')) return { error: 'Envie uma imagem (JPG, PNG ou WEBP).' };
      if (photo.size > PHOTO_MAX_BYTES) return { error: 'A foto ficou grande demais. Tente outra imagem.' };
      const path = `services/${slug}-${crypto.randomUUID().slice(0, 8)}.${photoExtension(photo)}`;
      const { error } = await db.storage.from('site').upload(path, photo, { contentType: photo.type });
      if (error) return { error: error.message || 'Não foi possível enviar a foto.' };
      imagePath = path;
    } else if (formData.get('remove_photo') === '1') {
      imagePath = null;
    }

    const description = String(formData.get('description') ?? '').trim();
    const { error } = await db.from('site_services').upsert(
      {
        slug,
        title: text(formData, 'title', 190),
        short_title: text(formData, 'short_title', 120),
        summary: text(formData, 'summary', 500),
        description: description ? sanitizeMultiline(description) : null,
        highlights: lines(formData, 'highlights'),
        applications: lines(formData, 'applications'),
        image_path: imagePath,
        updated_by: user.id,
      },
      { onConflict: 'slug' },
    );
    if (error) return { error: error.message || 'Não foi possível salvar o serviço.' };

    if (current?.image_path && current.image_path !== imagePath) {
      await db.storage.from('site').remove([current.image_path]);
    }

    await writeAuditLog({ actorId: user.id, action: 'update', entity: 'site_services', metadata: { slug } });
    refreshServicePages(slug);
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível salvar o serviço.' };
  }
}

export async function resetSiteService(slug: string) {
  try {
    const user = await assertPermission('settings.write');
    const db = await createClient();
    const { data: current } = await db.from('site_services').select('image_path').eq('slug', slug).maybeSingle();
    const { error } = await db.from('site_services').delete().eq('slug', slug);
    if (error) return { error: error.message || 'Não foi possível restaurar o serviço.' };
    if (current?.image_path) await db.storage.from('site').remove([current.image_path]);
    await writeAuditLog({ actorId: user.id, action: 'update', entity: 'site_services', metadata: { slug, reset: true } });
    refreshServicePages(slug);
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível restaurar o serviço.' };
  }
}

export async function saveServicesSection(formData: FormData) {
  try {
    const user = await assertPermission('settings.write');
    const db = await createClient();
    const { error } = await db
      .from('company_settings')
      .update({
        services_eyebrow: text(formData, 'services_eyebrow', 120),
        services_title: text(formData, 'services_title', 255),
      })
      .eq('id', COMPANY_SETTINGS_ID);
    if (error) return { error: error.message || 'Não foi possível salvar o título.' };
    await writeAuditLog({ actorId: user.id, action: 'update', entity: 'site_services', metadata: { section: true } });
    refreshServicePages();
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível salvar o título.' };
  }
}
