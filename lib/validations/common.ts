import { z } from 'zod';

export const optionalText = z.string().trim().max(500).optional().or(z.literal(''));
export const requiredName = z.string().trim().min(2, 'Informe um nome válido.').max(180);

export const emailSchema = z
  .string()
  .trim()
  .email('E-mail inválido.')
  .max(180)
  .optional()
  .or(z.literal(''));

export const contactSchema = z.object({
  name: requiredName,
  email: z.string().trim().email('E-mail inválido.').max(180).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(30).optional().or(z.literal('')),
  company: z.string().trim().max(180).optional().or(z.literal('')),
  subject: z.string().trim().min(2, 'Informe o assunto.').max(180),
  equipmentId: z.string().uuid().optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Descreva o atendimento com pelo menos 10 caracteres.').max(4000),
  consent: z
    .boolean()
    .refine((value) => value === true, 'É necessário aceitar a política de privacidade.'),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
});

export const recoverSchema = z.object({
  email: z.string().trim().email('E-mail inválido.'),
});

export const customerSchema = z.object({
  person_type: z.enum(['pj', 'pf']),
  legal_name: requiredName,
  trade_name: optionalText,
  document: z.string().trim().min(11, 'Informe CPF ou CNPJ.').max(20),
  state_registration: optionalText,
  email: emailSchema,
  phone: optionalText,
  whatsapp_ddi: z.string().trim().min(1).max(4).default('55'),
  whatsapp_number: optionalText,
  zip: optionalText,
  street: optionalText,
  number: optionalText,
  complement: optionalText,
  district: optionalText,
  city: optionalText,
  state: z.string().trim().max(2).optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  status: z.enum(['active', 'inactive']),
});

export const customerUnitSchema = z.object({
  name: requiredName,
  internal_code: optionalText,
  street: optionalText,
  number: optionalText,
  complement: optionalText,
  district: optionalText,
  city: optionalText,
  state: z.string().trim().max(2).optional().or(z.literal('')),
  zip: optionalText,
  manager_name: optionalText,
  phone: optionalText,
  whatsapp: optionalText,
  email: emailSchema,
});

export const customerContactSchema = z.object({
  name: requiredName,
  role: optionalText,
  email: emailSchema,
  phone: optionalText,
  whatsapp: optionalText,
  unit_id: z.string().uuid().optional().or(z.literal('')),
  is_primary: z.boolean().default(false),
});

export const equipmentSchema = z.object({
  name: requiredName,
  brand: optionalText,
  model: optionalText,
  capacity_tons: z.string().optional().or(z.literal('')),
  plate: optionalText,
  year: z.string().optional().or(z.literal('')),
  asset_number: optionalText,
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  technical_features: z.string().trim().max(4000).optional().or(z.literal('')),
  status: z.enum(['available', 'rented', 'maintenance', 'inactive']),
  available_for_quote: z.boolean(),
  show_on_website: z.boolean(),
  show_availability_public: z.boolean(),
  daily_reais: z.string().optional().or(z.literal('')),
  monthly_reais: z.string().optional().or(z.literal('')),
  hourly_reais: z.string().optional().or(z.literal('')),
  km_reais: z.string().optional().or(z.literal('')),
  min_hours_per_day: z.string().optional().or(z.literal('')),
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  name_needs_confirmation: z.boolean(),
});

export const quoteItemSchema = z.object({
  equipment_id: z.string().uuid().optional().or(z.literal('')),
  kind: z.enum(['equipment', 'service', 'additional']),
  additional_code: optionalText,
  description: z.string().trim().min(2).max(500),
  unit: z.enum(['daily', 'hour', 'month', 'kilometer', 'unit', 'fixed']),
  quantity: z.string().min(1),
  unit_price_reais: z.string().min(1),
  discount_reais: z.string().optional().or(z.literal('')),
  surcharge_reais: z.string().optional().or(z.literal('')),
});

export const quoteSchema = z.object({
  customer_id: z.string().uuid('Selecione o cliente.'),
  unit_id: z.string().uuid().optional().or(z.literal('')),
  contact_id: z.string().uuid().optional().or(z.literal('')),
  title: requiredName,
  description: z.string().trim().max(4000).optional().or(z.literal('')),
  scope: z.string().trim().max(8000).optional().or(z.literal('')),
  activity_code: optionalText,
  issued_at: z.string().min(8),
  valid_until: z.string().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  payment_terms: z.string().trim().max(4000).optional().or(z.literal('')),
  payment_deadline: optionalText,
  internal_notes: z.string().trim().max(4000).optional().or(z.literal('')),
  customer_notes: z.string().trim().max(4000).optional().or(z.literal('')),
  discount_reais: z.string().optional().or(z.literal('')),
  surcharge_reais: z.string().optional().or(z.literal('')),
  tax_reais: z.string().optional().or(z.literal('')),
  items: z.array(quoteItemSchema).min(1, 'Inclua ao menos um item.'),
});

export const companySettingsSchema = z.object({
  legal_name: requiredName,
  trade_name: requiredName,
  cnpj: z.string().trim().min(14).max(20),
  state_registration: optionalText,
  street: optionalText,
  number: optionalText,
  complement: optionalText,
  district: optionalText,
  city: optionalText,
  state: z.string().trim().max(2).optional().or(z.literal('')),
  zip: optionalText,
  phones_text: z.string().trim().max(400).optional().or(z.literal('')),
  whatsapp: optionalText,
  email: emailSchema,
  website: optionalText,
  bank_name: optionalText,
  bank_agency: optionalText,
  bank_account: optionalText,
  pix_key: optionalText,
  default_payment_terms: z.string().trim().max(4000).optional().or(z.literal('')),
  default_commercial_terms: z.string().trim().max(4000).optional().or(z.literal('')),
  default_responsibilities: z.string().trim().max(4000).optional().or(z.literal('')),
  quote_prefix: z.string().trim().min(2).max(8),
  contract_prefix: z.string().trim().min(2).max(8),
  show_public_prices: z.boolean(),
  whatsapp_provider: z.enum(['wa_me', 'cloud_api']),
  quote_whatsapp_template: z.string().trim().min(10).max(1000),
  contract_whatsapp_template: z.string().trim().min(10).max(1000),
});

export const responsibilitySchema = z.enum([
  'contratante',
  'contratada',
  'compartilhado',
  'nao_aplicavel',
]);

export const contractSchema = z.object({
  customer_id: z.string().uuid(),
  unit_id: z.string().uuid().optional().or(z.literal('')),
  quote_id: z.string().uuid().optional().or(z.literal('')),
  object: z.string().trim().min(4).max(500),
  scope: z.string().trim().max(8000).optional().or(z.literal('')),
  starts_on: z.string().optional().or(z.literal('')),
  ends_on: z.string().optional().or(z.literal('')),
  billing_method: optionalText,
  payment_deadline: optionalText,
  notes: z.string().trim().max(4000).optional().or(z.literal('')),
  food_party: responsibilitySchema,
  lodging_party: responsibilitySchema,
  fuel_party: responsibilitySchema,
  transport_party: responsibilitySchema,
  helper_party: responsibilitySchema,
  rigging_party: responsibilitySchema,
  enabled_clauses: z.array(z.string().uuid()),
  clause_overrides: z.record(z.string(), z.string()).optional(),
});
