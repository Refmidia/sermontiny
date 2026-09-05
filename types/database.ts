export type PersonType = 'pj' | 'pf';
export type RecordStatus = 'active' | 'inactive';
export type EquipmentStatus = 'available' | 'rented' | 'maintenance' | 'inactive';
export type QuoteStatus =
  | 'draft'
  | 'in_review'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'change_requested'
  | 'rejected'
  | 'expired'
  | 'converted';
export type ContractStatus =
  | 'draft'
  | 'in_review'
  | 'sent'
  | 'awaiting_signature'
  | 'signed'
  | 'active'
  | 'suspended'
  | 'closed'
  | 'cancelled';
export type QuoteItemUnit = 'daily' | 'hour' | 'month' | 'kilometer' | 'unit' | 'fixed';
export type QuoteItemKind = 'equipment' | 'service' | 'additional';
export type WhatsAppProvider = 'wa_me' | 'cloud_api';
export type WhatsAppMessageStatus = 'pending' | 'sent' | 'failed';
export type DocumentKind =
  | 'quote_pdf'
  | 'contract_pdf'
  | 'signed_contract'
  | 'certificate'
  | 'other';
export type ResponsibilityParty = 'contratante' | 'contratada' | 'compartilhado' | 'nao_aplicavel';
export type LeadStatus = 'new' | 'in_progress' | 'converted' | 'archived';
export type AuditAction =
  | 'login'
  | 'create'
  | 'update'
  | 'soft_delete'
  | 'price_change'
  | 'pdf_generate'
  | 'whatsapp_send'
  | 'approve'
  | 'convert_contract';

export type Profile = {
  id: string;
  full_name: string;
  role_id: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Role = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

export type CompanySettings = {
  id: string;
  legal_name: string;
  trade_name: string;
  cnpj: string;
  state_registration: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phones: string[];
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  logo_path: string | null;
  signature_path: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  pix_key: string | null;
  default_payment_terms: string | null;
  default_commercial_terms: string | null;
  default_responsibilities: string | null;
  quote_prefix: string;
  contract_prefix: string;
  quote_next_seq: number;
  contract_next_seq: number;
  numbering_year: number;
  show_public_prices: boolean;
  whatsapp_provider: WhatsAppProvider;
  quote_whatsapp_template: string;
  contract_whatsapp_template: string;
};

export type Customer = {
  id: string;
  person_type: PersonType;
  legal_name: string;
  trade_name: string | null;
  document: string;
  state_registration: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_ddi: string;
  whatsapp_number: string | null;
  zip: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
};

export type CustomerUnit = {
  id: string;
  customer_id: string;
  name: string;
  internal_code: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  manager_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
};

export type CustomerContact = {
  id: string;
  customer_id: string;
  unit_id: string | null;
  name: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_primary: boolean;
};

export type Equipment = {
  id: string;
  name: string;
  slug: string;
  brand: string | null;
  model: string | null;
  capacity_tons: number | null;
  plate: string | null;
  year: number | null;
  asset_number: string | null;
  description: string | null;
  technical_features: string | null;
  photo_path: string | null;
  status: EquipmentStatus;
  available_for_quote: boolean;
  show_on_website: boolean;
  show_availability_public: boolean;
  daily_cents: number;
  monthly_cents: number;
  hourly_cents: number;
  km_cents: number;
  min_hours_per_day: number;
  notes: string | null;
  name_needs_confirmation: boolean;
  sort_order: number;
};

export type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  company: string | null;
  subject: string | null;
  equipment_id: string | null;
  message: string;
  status: LeadStatus;
  source: string;
  created_at: string;
};

export type Quote = {
  id: string;
  number: string;
  customer_id: string;
  unit_id: string | null;
  contact_id: string | null;
  owner_id: string | null;
  current_version_id: string | null;
  status: QuoteStatus;
  title: string;
  created_at: string;
  updated_at: string;
};

export type QuoteVersion = {
  id: string;
  quote_id: string;
  version_number: number;
  issued_at: string;
  valid_until: string | null;
  title: string;
  description: string | null;
  scope: string | null;
  activity_code: string | null;
  start_date: string | null;
  end_date: string | null;
  payment_terms: string | null;
  payment_deadline: string | null;
  internal_notes: string | null;
  customer_notes: string | null;
  status: QuoteStatus;
  subtotal_cents: number;
  discount_cents: number;
  surcharge_cents: number;
  tax_cents: number;
  total_cents: number;
  total_extenso: string;
  locked: boolean;
};

export type QuoteItem = {
  id: string;
  quote_version_id: string;
  equipment_id: string | null;
  kind: QuoteItemKind;
  additional_code: string | null;
  description: string;
  unit: QuoteItemUnit;
  quantity: number;
  unit_price_cents: number;
  discount_cents: number;
  surcharge_cents: number;
  subtotal_cents: number;
  sort_order: number;
  monthly_recommendation: boolean;
};

export type Contract = {
  id: string;
  number: string;
  quote_id: string | null;
  quote_version_id: string | null;
  customer_id: string;
  unit_id: string | null;
  object: string;
  scope: string | null;
  starts_on: string | null;
  ends_on: string | null;
  signed_at: string | null;
  billing_method: string | null;
  payment_deadline: string | null;
  total_cents: number;
  food_party: ResponsibilityParty | null;
  lodging_party: ResponsibilityParty | null;
  fuel_party: ResponsibilityParty | null;
  transport_party: ResponsibilityParty | null;
  helper_party: ResponsibilityParty | null;
  rigging_party: ResponsibilityParty | null;
  notes: string | null;
  status: ContractStatus;
  current_version_id: string | null;
};

export type ClauseLibraryItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  is_active: boolean;
  requires_responsibility: boolean;
  sort_order: number;
};

export type DocumentRecord = {
  id: string;
  kind: DocumentKind;
  storage_path: string;
  file_name: string;
  access_token: string | null;
  token_expires_at: string | null;
  is_immutable: boolean;
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Rascunho',
  in_review: 'Em revisão',
  sent: 'Enviado',
  viewed: 'Visualizado',
  approved: 'Aprovado',
  change_requested: 'Alteração solicitada',
  rejected: 'Reprovado',
  expired: 'Expirado',
  converted: 'Convertido em contrato',
};

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'Rascunho',
  in_review: 'Em revisão',
  sent: 'Enviado',
  awaiting_signature: 'Aguardando assinatura',
  signed: 'Assinado',
  active: 'Ativo',
  suspended: 'Suspenso',
  closed: 'Encerrado',
  cancelled: 'Cancelado',
};

export const UNIT_LABELS: Record<QuoteItemUnit, string> = {
  daily: 'Diária',
  hour: 'Hora',
  month: 'Mês',
  kilometer: 'Quilômetro',
  unit: 'Unidade',
  fixed: 'Valor fechado',
};

export const ADDITIONAL_ITEMS = [
  { code: 'mobilizacao', label: 'Mobilização', unit: 'kilometer' as const },
  { code: 'desmobilizacao', label: 'Desmobilização', unit: 'kilometer' as const },
  { code: 'prancha', label: 'Caminhão-prancha', unit: 'kilometer' as const },
  { code: 'rigging', label: 'Plano de rigging', unit: 'fixed' as const },
  { code: 'treinamento', label: 'Treinamento adicional', unit: 'unit' as const },
  { code: 'pedagios', label: 'Pedágios', unit: 'fixed' as const },
  { code: 'hospedagem', label: 'Hospedagem', unit: 'daily' as const },
  { code: 'alimentacao', label: 'Alimentação', unit: 'daily' as const },
  { code: 'he50', label: 'Hora extra de 50%', unit: 'hour' as const },
  { code: 'he100', label: 'Hora extra de 100%', unit: 'hour' as const },
  { code: 'outros', label: 'Outros custos', unit: 'fixed' as const },
] as const;

export const RESPONSIBILITY_LABELS: Record<ResponsibilityParty, string> = {
  contratante: 'Contratante',
  contratada: 'Contratada',
  compartilhado: 'Compartilhado',
  nao_aplicavel: 'Não aplicável',
};
