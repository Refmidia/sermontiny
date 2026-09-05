'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactSchema, type ContactInput } from '@/lib/validations/common';
import { submitContact } from '@/app/actions/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Equipment } from '@/types/database';

const SUBJECTS = [
  'Solicitação de orçamento',
  'Locação de equipamento',
  'Montagem industrial',
  'Manutenção',
  'Dúvida comercial',
  'Outro assunto',
];

export function ContactForm({
  equipment,
  selectedEquipmentId,
}: {
  equipment: Equipment[];
  selectedEquipmentId?: string;
}) {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      whatsapp: '',
      company: '',
      subject: 'Solicitação de orçamento',
      equipmentId: selectedEquipmentId ?? '',
      message: '',
      consent: false,
    },
  });

  async function onSubmit(values: ContactInput) {
    setError(null);
    const data = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      data.set(key, String(value ?? ''));
    });
    const result = await submitContact(data);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    form.reset();
  }

  if (success) {
    return (
      <div className="rounded-xl border border-gold/40 bg-white p-6">
        <h3 className="font-display text-xl text-navy">Mensagem recebida</h3>
        <p className="mt-2 text-sm text-muted">
          A equipe comercial da Sermontiny retornará com as próximas informações. Se o assunto for urgente,
          utilize também o WhatsApp informado nesta página.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome" error={form.formState.errors.name?.message}>
          <Input {...form.register('name')} autoComplete="name" />
        </Field>
        <Field label="Empresa" error={form.formState.errors.company?.message}>
          <Input {...form.register('company')} />
        </Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register('email')} autoComplete="email" />
        </Field>
        <Field label="Telefone" error={form.formState.errors.phone?.message}>
          <Input {...form.register('phone')} autoComplete="tel" />
        </Field>
        <Field label="WhatsApp" error={form.formState.errors.whatsapp?.message}>
          <Input {...form.register('whatsapp')} />
        </Field>
        <Field label="Assunto" error={form.formState.errors.subject?.message}>
          <select
            className="admin-select"
            {...form.register('subject')}
          >
            {SUBJECTS.map((subject) => (
              <option key={subject}>{subject}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Equipamento de interesse" error={form.formState.errors.equipmentId?.message}>
        <select
          className="admin-select"
          {...form.register('equipmentId')}
        >
          <option value="">Não especificado</option>
          {equipment.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Mensagem" error={form.formState.errors.message?.message}>
        <Textarea rows={6} {...form.register('message')} />
      </Field>
      <label className="flex items-start gap-2 text-sm text-muted">
        <input type="checkbox" className="mt-1" {...form.register('consent')} />
        <span>
          Autorizo o tratamento dos meus dados para retorno comercial, conforme a{' '}
          <a href="/privacidade" className="text-navy underline">
            política de privacidade
          </a>
          .
        </span>
      </label>
      {form.formState.errors.consent && (
        <p className="text-sm text-destructive">{form.formState.errors.consent.message}</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Enviando...' : 'Enviar mensagem'}
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
