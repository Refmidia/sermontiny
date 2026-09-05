'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertPermission } from '@/lib/auth/session';
import { writeAuditLog } from '@/lib/audit';
import { createClient } from '@/lib/supabase/server';
import { customerContactSchema, customerSchema, customerUnitSchema } from '@/lib/validations/common';
import { emptyToNull } from '@/lib/forms';
import { sanitizeMultiline, sanitizePlainText } from '@/lib/sanitize';
import { onlyDigits } from '@/lib/format';

function formObject(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

export async function saveCustomer(formData: FormData) {
  const user = await assertPermission('customers.write');
  const id = String(formData.get('id') || '');
  const parsed = customerSchema.safeParse({
    ...formObject(formData),
    person_type: formData.get('person_type'),
    status: formData.get('status'),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' };
  }

  const payload = {
    person_type: parsed.data.person_type,
    legal_name: sanitizePlainText(parsed.data.legal_name),
    trade_name: emptyToNull(parsed.data.trade_name),
    document: onlyDigits(parsed.data.document),
    state_registration: emptyToNull(parsed.data.state_registration),
    email: emptyToNull(parsed.data.email),
    phone: emptyToNull(parsed.data.phone),
    whatsapp_ddi: parsed.data.whatsapp_ddi || '55',
    whatsapp_number: emptyToNull(parsed.data.whatsapp_number),
    zip: emptyToNull(parsed.data.zip),
    street: emptyToNull(parsed.data.street),
    number: emptyToNull(parsed.data.number),
    complement: emptyToNull(parsed.data.complement),
    district: emptyToNull(parsed.data.district),
    city: emptyToNull(parsed.data.city),
    state: emptyToNull(parsed.data.state),
    notes: parsed.data.notes ? sanitizeMultiline(parsed.data.notes) : null,
    status: parsed.data.status,
  };

  const supabase = await createClient();
  if (id) {
    const { error } = await supabase.from('customers').update(payload).eq('id', id);
    if (error) return { error: 'Não foi possível atualizar o cliente.' };
    await writeAuditLog({ actorId: user.id, action: 'update', entity: 'customers', entityId: id });
    revalidatePath('/admin/clientes');
    redirect(`/admin/clientes/${id}`);
  }

  const { data, error } = await supabase.from('customers').insert({ ...payload, created_by: user.id }).select('id').single();
  if (error || !data) return { error: 'Não foi possível cadastrar o cliente. Verifique se o documento já existe.' };
  await writeAuditLog({ actorId: user.id, action: 'create', entity: 'customers', entityId: data.id });
  revalidatePath('/admin/clientes');
  redirect(`/admin/clientes/${data.id}`);
}

export async function softDeleteCustomer(id: string) {
  const user = await assertPermission('customers.delete');
  const supabase = await createClient();
  const { error } = await supabase
    .from('customers')
    .update({ deleted_at: new Date().toISOString(), status: 'inactive' })
    .eq('id', id);
  if (error) return { error: 'Não foi possível excluir o cliente.' };
  await writeAuditLog({ actorId: user.id, action: 'soft_delete', entity: 'customers', entityId: id });
  revalidatePath('/admin/clientes');
  redirect('/admin/clientes');
}

export async function saveCustomerUnit(formData: FormData) {
  const user = await assertPermission('customers.write');
  const customerId = String(formData.get('customer_id') || '');
  const id = String(formData.get('id') || '');
  const parsed = customerUnitSchema.safeParse(formObject(formData));
  if (!parsed.success || !customerId) return { error: 'Dados da unidade inválidos.' };

  const payload = {
    customer_id: customerId,
    name: sanitizePlainText(parsed.data.name),
    internal_code: emptyToNull(parsed.data.internal_code),
    street: emptyToNull(parsed.data.street),
    number: emptyToNull(parsed.data.number),
    complement: emptyToNull(parsed.data.complement),
    district: emptyToNull(parsed.data.district),
    city: emptyToNull(parsed.data.city),
    state: emptyToNull(parsed.data.state),
    zip: emptyToNull(parsed.data.zip),
    manager_name: emptyToNull(parsed.data.manager_name),
    phone: emptyToNull(parsed.data.phone),
    whatsapp: emptyToNull(parsed.data.whatsapp),
    email: emptyToNull(parsed.data.email),
  };

  const supabase = await createClient();
  const result = id
    ? await supabase.from('customer_units').update(payload).eq('id', id)
    : await supabase.from('customer_units').insert(payload);
  if (result.error) return { error: 'Não foi possível salvar a unidade.' };
  await writeAuditLog({
    actorId: user.id,
    action: id ? 'update' : 'create',
    entity: 'customer_units',
    entityId: customerId,
  });
  revalidatePath(`/admin/clientes/${customerId}`);
  return { ok: true as const };
}

export async function saveCustomerContact(formData: FormData) {
  const user = await assertPermission('customers.write');
  const customerId = String(formData.get('customer_id') || '');
  const parsed = customerContactSchema.safeParse({
    ...formObject(formData),
    is_primary: formData.get('is_primary') === 'on',
  });
  if (!parsed.success || !customerId) return { error: 'Dados do contato inválidos.' };
  const supabase = await createClient();
  const { error } = await supabase.from('customer_contacts').insert({
    customer_id: customerId,
    unit_id: parsed.data.unit_id || null,
    name: sanitizePlainText(parsed.data.name),
    role: emptyToNull(parsed.data.role),
    email: emptyToNull(parsed.data.email),
    phone: emptyToNull(parsed.data.phone),
    whatsapp: emptyToNull(parsed.data.whatsapp),
    is_primary: parsed.data.is_primary,
  });
  if (error) return { error: 'Não foi possível salvar o contato.' };
  await writeAuditLog({ actorId: user.id, action: 'create', entity: 'customer_contacts', entityId: customerId });
  revalidatePath(`/admin/clientes/${customerId}`);
  return { ok: true as const };
}
