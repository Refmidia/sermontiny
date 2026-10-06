import type { LeadStatus } from '@/types/database';

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Novo',
  in_progress: 'Em andamento',
  proposal_sent: 'Proposta enviada',
  converted: 'Convertido',
  lost: 'Perdido',
  archived: 'Arquivado',
};

export const LEAD_STATUS_OPTIONS: LeadStatus[] = [
  'new',
  'in_progress',
  'proposal_sent',
  'converted',
  'lost',
  'archived',
];

export const LEAD_FILTER_CHIPS: Array<{ value: '' | LeadStatus; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'new', label: 'Novos' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'proposal_sent', label: 'Proposta enviada' },
  { value: 'converted', label: 'Convertidos' },
  { value: 'lost', label: 'Perdidos' },
];

export function leadStatusSelectClass(status: LeadStatus) {
  switch (status) {
    case 'new':
      return 'border-info/30 bg-info-soft text-info';
    case 'in_progress':
      return 'border-[#E4C56A]/40 bg-warning-soft text-[#8a6a12]';
    case 'proposal_sent':
      return 'border-[#7C5CBF]/30 bg-[#F3EEFF] text-[#5B3FA0]';
    case 'converted':
      return 'border-success/30 bg-success-soft text-success';
    case 'lost':
      return 'border-danger/30 bg-danger-soft text-danger';
    default:
      return 'border-border bg-paper-strong text-muted';
  }
}

export function leadSourceLabel(source: string) {
  switch (source) {
    case 'contact_form':
      return 'Via formulário do site';
    case 'admin':
      return 'Cadastro no painel';
    case 'whatsapp':
      return 'Via WhatsApp';
    case 'email':
      return 'Via e-mail';
    default:
      return source || 'Origem não informada';
  }
}

export function leadInterest(lead: {
  subject?: string | null;
  company?: string | null;
  equipmentName?: string | null;
}) {
  return lead.equipmentName || lead.subject || lead.company || 'Sem interesse informado';
}
