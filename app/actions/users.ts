'use server';

import { revalidatePath } from 'next/cache';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { ROLE_LABELS, type RoleSlug } from '@/lib/permissions';

const PHOTO_MAX_BYTES = 1.5 * 1024 * 1024;
const AVATARS_BUCKET = 'avatars';

export type AdminUserRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  roleId: string | null;
  roleSlug: string | null;
  roleName: string | null;
  isActive: boolean;
  photoPath: string | null;
  photoUrl: string | null;
};

async function ensureAvatarsBucket() {
  const admin = createAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  if (!buckets?.some((bucket) => bucket.name === AVATARS_BUCKET)) {
    await admin.storage.createBucket(AVATARS_BUCKET, { public: false });
  }
}

async function storeProfilePhoto(profileId: string, file: File) {
  if (!file.size) return { error: 'Selecione uma imagem.' };
  if (file.size > PHOTO_MAX_BYTES) return { error: 'A foto ficou grande demais. Tente outra imagem.' };
  if (!file.type.startsWith('image/')) return { error: 'Envie uma imagem (JPG, PNG ou WEBP).' };

  await ensureAvatarsBucket();
  const admin = createAdminClient();
  // Sempre JPG compacto — evita PNG/WebP pesados no avatar.
  const path = `${profileId}.jpg`;
  const { error } = await admin.storage.from(AVATARS_BUCKET).upload(path, file, {
    upsert: true,
    contentType: 'image/jpeg',
  });
  if (error) return { error: error.message || 'Não foi possível enviar a foto.' };

  try {
    await admin.storage.from(AVATARS_BUCKET).remove([`${profileId}.png`, `${profileId}.webp`, `${profileId}.jpeg`]);
  } catch {
    // ignore
  }

  const { error: updateError } = await admin.from('profiles').update({ photo_path: path }).eq('id', profileId);
  if (updateError && !/photo_path|column/i.test(updateError.message)) {
    return { error: updateError.message || 'Foto enviada, mas não foi vinculada ao perfil.' };
  }

  return { path };
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await assertPermission('users.read');
  const admin = createAdminClient();
  const withPhoto = await admin
    .from('profiles')
    .select('id, full_name, phone, role_id, is_active, photo_path')
    .is('deleted_at', null)
    .order('full_name');

  const profilesResult = withPhoto.error
    ? await admin.from('profiles').select('id, full_name, phone, role_id, is_active').is('deleted_at', null).order('full_name')
    : withPhoto;

  const [{ data: roles }, authUsers] = await Promise.all([
    admin.from('roles').select('id, name, slug'),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  const emailById = new Map((authUsers.data?.users ?? []).map((user) => [user.id, user.email ?? '']));
  const roleById = new Map((roles ?? []).map((role) => [role.id, role]));

  return (profilesResult.data ?? []).map((profile) => {
    const role = profile.role_id ? roleById.get(profile.role_id) : null;
    const photoPath = 'photo_path' in profile ? ((profile.photo_path as string | null) ?? null) : null;
    return {
      id: profile.id,
      fullName: profile.full_name,
      email: emailById.get(profile.id) ?? '',
      phone: profile.phone,
      roleId: profile.role_id,
      roleSlug: role?.slug ?? null,
      roleName: role?.name ?? (role?.slug ? ROLE_LABELS[role.slug as RoleSlug] : null),
      isActive: profile.is_active,
      photoPath,
      // Só gera URL se houver foto — evita 404 em massa na lista.
      photoUrl: photoPath ? `/api/media/profiles/${profile.id}?v=${encodeURIComponent(photoPath)}` : null,
    };
  });
}

export async function createAdminUser(input: {
  fullName: string;
  email: string;
  password: string;
  roleId: string;
  phone?: string;
  photo?: File | null;
}) {
  const actor = await assertPermission('users.write');
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const roleId = input.roleId;
  const phone = input.phone?.trim() || null;

  if (!fullName || !email || !password || !roleId) {
    return { error: 'Preencha nome, e-mail, senha e perfil.' };
  }
  if (password.length < 8) {
    return { error: 'A senha precisa ter pelo menos 8 caracteres.' };
  }

  const admin = createAdminClient();
  const { data: role } = await admin.from('roles').select('id, slug').eq('id', roleId).maybeSingle();
  if (!role) return { error: 'Perfil inválido.' };

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError || !created.user) {
    return { error: createError?.message || 'Não foi possível criar o login.' };
  }

  const { error: profileError } = await admin.from('profiles').upsert({
    id: created.user.id,
    full_name: fullName,
    phone,
    role_id: roleId,
    is_active: true,
    deleted_at: null,
  });

  if (profileError) {
    return { error: profileError.message || 'Login criado, mas o perfil não foi ativado.' };
  }

  if (input.photo && input.photo.size > 0) {
    const photoResult = await storeProfilePhoto(created.user.id, input.photo);
    if (photoResult.error) {
      return { error: photoResult.error, userId: created.user.id };
    }
  }

  await writeAuditLog({
    actorId: actor.id,
    action: 'create',
    entity: 'profiles',
    entityId: created.user.id,
    metadata: { email, role: role.slug },
  });
  revalidatePath('/admin/usuarios');
  revalidatePath('/admin/configuracoes');
  return { ok: true as const, userId: created.user.id };
}

export async function updateAdminUser(input: {
  profileId: string;
  fullName: string;
  roleId: string;
  isActive: boolean;
  phone?: string;
  password?: string;
  photo?: File | null;
  removePhoto?: boolean;
}) {
  const actor = await assertPermission('users.write');
  const profileId = input.profileId;
  const fullName = input.fullName.trim();
  const roleId = input.roleId;
  if (!profileId || !fullName || !roleId) return { error: 'Dados inválidos.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({
      full_name: fullName,
      role_id: roleId,
      is_active: input.isActive,
      phone: input.phone?.trim() || null,
    })
    .eq('id', profileId);
  if (error) return { error: error.message || 'Não foi possível atualizar o usuário.' };

  // Foto antes da senha: troca de foto não deve depender de alteração de senha.
  if (input.removePhoto) {
    await admin.from('profiles').update({ photo_path: null }).eq('id', profileId);
    try {
      await admin.storage.from(AVATARS_BUCKET).remove([`${profileId}.jpg`, `${profileId}.png`, `${profileId}.webp`, `${profileId}.jpeg`]);
    } catch {
      // ignore
    }
  } else if (input.photo && input.photo.size > 0) {
    const photoResult = await storeProfilePhoto(profileId, input.photo);
    if (photoResult.error) return { error: photoResult.error };
  }

  const nextPassword = input.password?.trim() ?? '';
  if (nextPassword.length >= 8) {
    const { error: passwordError } = await admin.auth.admin.updateUserById(profileId, {
      password: nextPassword,
    });
    if (passwordError) return { error: passwordError.message || 'Não foi possível atualizar a senha.' };
  }

  await writeAuditLog({ actorId: actor.id, action: 'update', entity: 'profiles', entityId: profileId });
  revalidatePath('/admin/usuarios');
  revalidatePath('/admin/configuracoes');
  return { ok: true as const };
}

export async function updateUserRole(formData: FormData) {
  const user = await assertPermission('users.write');
  const profileId = String(formData.get('profile_id') || '');
  const roleId = String(formData.get('role_id') || '');
  const isActive = formData.get('is_active') === 'on';
  if (!profileId || !roleId) return { error: 'Usuário ou perfil inválido.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ role_id: roleId, is_active: isActive })
    .eq('id', profileId);
  if (error) return { error: 'Não foi possível atualizar o usuário.' };
  await writeAuditLog({ actorId: user.id, action: 'update', entity: 'profiles', entityId: profileId });
  revalidatePath('/admin/usuarios');
  revalidatePath('/admin/configuracoes');
  return { ok: true as const };
}

export async function softDeleteAdminUser(profileId: string) {
  const actor = await assertPermission('users.write');
  if (!profileId) return { error: 'Usuário inválido.' };
  if (actor.id === profileId) {
    return { error: 'Você não pode excluir o próprio usuário.' };
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!profile) return { error: 'Usuário não encontrado.' };

  const { error } = await admin
    .from('profiles')
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq('id', profileId);
  if (error) return { error: error.message || 'Não foi possível excluir o usuário.' };

  try {
    await admin.auth.admin.updateUserById(profileId, { ban_duration: '876000h' });
  } catch {
    // Perfil já fica inativo mesmo se o ban falhar.
  }

  await writeAuditLog({
    actorId: actor.id,
    action: 'soft_delete',
    entity: 'profiles',
    entityId: profileId,
  });
  revalidatePath('/admin/usuarios');
  revalidatePath('/admin/configuracoes');
  return { ok: true as const };
}
