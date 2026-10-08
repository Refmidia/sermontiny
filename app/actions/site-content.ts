'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { SERVICES } from '@/lib/content/services';
import { SERVICE_ICON_OPTIONS } from '@/lib/content/service-icons';
import { SITE_SERVICES_TAG } from '@/lib/data/services';
import { SITE_MEDIA_TAG, isSiteMediaSlot } from '@/lib/data/site-media';
import { createClient } from '@/lib/db/server';
import { slugify } from '@/lib/format';
import { sanitizeMultiline, sanitizePlainText } from '@/lib/sanitize';

const PHOTO_MAX_BYTES = 3 * 1024 * 1024;
const COMPANY_SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

type Db = Awaited<ReturnType<typeof createClient>>;

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

function serviceFields(formData: FormData) {
  const description = String(formData.get('description') ?? '').trim();
  const icon = String(formData.get('icon') ?? '');
  return {
    title: text(formData, 'title', 190),
    short_title: text(formData, 'short_title', 120),
    summary: text(formData, 'summary', 500),
    description: description ? sanitizeMultiline(description) : null,
    highlights: lines(formData, 'highlights'),
    applications: lines(formData, 'applications'),
    icon: SERVICE_ICON_OPTIONS.some((option) => option.key === icon) ? icon : null,
    show_on_home: formData.get('show_on_home') === '1',
  };
}

function refreshServicePages(slug?: string) {
  updateTag(SITE_SERVICES_TAG);
  revalidatePath('/', 'layout');
  revalidatePath('/servicos');
  if (slug) revalidatePath(`/servicos/${slug}`);
  revalidatePath('/admin/servicos');
}

function photoExtension(file: File) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

async function uploadPhoto(db: Db, slug: string, photo: FormDataEntryValue | null) {
  if (!(photo instanceof File) || photo.size === 0) return { path: null };
  if (!photo.type.startsWith('image/')) return { error: 'Envie uma imagem (JPG, PNG ou WEBP).' };
  if (photo.size > PHOTO_MAX_BYTES) return { error: 'A foto ficou grande demais. Tente outra imagem.' };
  const path = `services/${slug}-${crypto.randomUUID().slice(0, 8)}.${photoExtension(photo)}`;
  const { error } = await db.storage.from('site').upload(path, photo, { contentType: photo.type });
  if (error) return { error: error.message || 'Não foi possível enviar a foto.' };
  return { path };
}

const isBuiltIn = (slug: string) => SERVICES.some((service) => service.slug === slug);

export async function createSiteService(formData: FormData) {
  try {
    const user = await assertPermission('settings.write');
    const fields = serviceFields(formData);
    const name = fields.short_title || fields.title;
    if (!name) return { error: 'Informe o nome do serviço.' };
    if (!fields.summary) return { error: 'Escreva um resumo curto para o card.' };

    const db = await createClient();
    const { data: rows, error: listError } = await db.from('site_services').select('slug, sort_order');
    if (listError) return { error: listError.message || 'Não foi possível criar o serviço.' };

    const taken = new Set([...SERVICES.map((service) => service.slug), ...(rows ?? []).map((row) => row.slug as string)]);
    const base = slugify(name).slice(0, 100) || 'servico';
    let slug = base;
    for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;

    const upload = await uploadPhoto(db, slug, formData.get('photo'));
    if (upload.error) return { error: upload.error };

    const lastOrder = Math.max(
      SERVICES.length * 10,
      ...(rows ?? []).map((row) => Number(row.sort_order) || 0),
    );
    const { error } = await db.from('site_services').insert({
      slug,
      ...fields,
      title: fields.title || name,
      short_title: fields.short_title || name,
      image_path: upload.path,
      is_custom: true,
      is_hidden: false,
      sort_order: lastOrder + 10,
      updated_by: user.id,
    });
    if (error) {
      if (upload.path) await db.storage.from('site').remove([upload.path]);
      return { error: error.message || 'Não foi possível criar o serviço.' };
    }

    await writeAuditLog({ actorId: user.id, action: 'create', entity: 'site_services', metadata: { slug } });
    refreshServicePages(slug);
    return { ok: true as const, slug };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível criar o serviço.' };
  }
}

export async function saveSiteService(formData: FormData) {
  try {
    const user = await assertPermission('settings.write');
    const slug = String(formData.get('slug') ?? '');
    const db = await createClient();
    const { data: current } = await db
      .from('site_services')
      .select('image_path, is_custom')
      .eq('slug', slug)
      .maybeSingle();
    if (!isBuiltIn(slug) && !current?.is_custom) return { error: 'Serviço inválido.' };

    const fields = serviceFields(formData);
    if (current?.is_custom && !(fields.short_title || fields.title)) return { error: 'Informe o nome do serviço.' };

    let imagePath: string | null = current?.image_path ?? null;
    const upload = await uploadPhoto(db, slug, formData.get('photo'));
    if (upload.error) return { error: upload.error };
    if (upload.path) imagePath = upload.path;
    else if (formData.get('remove_photo') === '1') imagePath = null;

    const { error } = await db
      .from('site_services')
      .upsert({ slug, ...fields, image_path: imagePath, updated_by: user.id }, { onConflict: 'slug' });
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
    if (!isBuiltIn(slug)) return { error: 'Só os serviços originais podem ser restaurados.' };
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

/** Serviços criados no painel são apagados; os originais do site ficam ocultos e podem voltar. */
export async function deleteSiteService(slug: string) {
  try {
    const user = await assertPermission('settings.write');
    const db = await createClient();
    const { data: current } = await db
      .from('site_services')
      .select('image_path, is_custom')
      .eq('slug', slug)
      .maybeSingle();

    if (current?.is_custom) {
      const { error } = await db.from('site_services').delete().eq('slug', slug);
      if (error) return { error: error.message || 'Não foi possível excluir o serviço.' };
      if (current.image_path) await db.storage.from('site').remove([current.image_path]);
    } else if (isBuiltIn(slug)) {
      const { error } = await db
        .from('site_services')
        .upsert({ slug, is_hidden: true, updated_by: user.id }, { onConflict: 'slug' });
      if (error) return { error: error.message || 'Não foi possível excluir o serviço.' };
    } else {
      return { error: 'Serviço não encontrado.' };
    }

    await writeAuditLog({ actorId: user.id, action: 'soft_delete', entity: 'site_services', metadata: { slug } });
    refreshServicePages(slug);
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível excluir o serviço.' };
  }
}

export async function restoreHiddenService(slug: string) {
  try {
    const user = await assertPermission('settings.write');
    if (!isBuiltIn(slug)) return { error: 'Serviço não encontrado.' };
    const db = await createClient();
    const { error } = await db
      .from('site_services')
      .update({ is_hidden: false, updated_by: user.id })
      .eq('slug', slug);
    if (error) return { error: error.message || 'Não foi possível voltar o serviço ao site.' };
    await writeAuditLog({ actorId: user.id, action: 'update', entity: 'site_services', metadata: { slug, restored: true } });
    refreshServicePages(slug);
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível voltar o serviço ao site.' };
  }
}

export async function saveSiteMedia(formData: FormData) {
  try {
    const user = await assertPermission('settings.write');
    const slot = String(formData.get('slot') ?? '');
    if (!isSiteMediaSlot(slot)) return { error: 'Foto inválida.' };

    const db = await createClient();
    const { data: current } = await db.from('site_media').select('image_path').eq('slot', slot).maybeSingle();

    if (formData.get('remove_photo') === '1') {
      const { error } = await db.from('site_media').delete().eq('slot', slot);
      if (error) return { error: error.message || 'Não foi possível voltar à foto padrão.' };
    } else {
      const upload = await uploadPhoto(db, `site-${slot}`, formData.get('photo'));
      if (upload.error) return { error: upload.error };
      if (!upload.path) return { error: 'Escolha uma foto.' };
      const { error } = await db
        .from('site_media')
        .upsert({ slot, image_path: upload.path, updated_by: user.id }, { onConflict: 'slot' });
      if (error) {
        await db.storage.from('site').remove([upload.path]);
        return { error: error.message || 'Não foi possível salvar a foto.' };
      }
    }
    if (current?.image_path) await db.storage.from('site').remove([current.image_path]);

    await writeAuditLog({ actorId: user.id, action: 'update', entity: 'site_media', metadata: { slot } });
    updateTag(SITE_MEDIA_TAG);
    revalidatePath('/');
    revalidatePath('/empresa');
    revalidatePath('/admin/fotos-do-site');
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Não foi possível salvar a foto.' };
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
