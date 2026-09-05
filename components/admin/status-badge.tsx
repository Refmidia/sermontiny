import { Badge } from '@/components/ui/badge';
import {
  CONTRACT_STATUS_LABELS,
  QUOTE_STATUS_LABELS,
  type ContractStatus,
  type EquipmentStatus,
  type LeadStatus,
  type QuoteStatus,
  type RecordStatus,
} from '@/types/database';

type BadgeTone = 'success' | 'warning' | 'danger' | 'muted' | 'default' | 'gold';

const TONE_CLASS: Record<BadgeTone, string> = {
  success: 'border-transparent bg-success-soft text-success',
  warning: 'border-transparent bg-warning-soft text-warning',
  danger: 'border-transparent bg-danger-soft text-danger',
  muted: 'border-transparent bg-paper-strong text-muted',
  default: 'border-transparent bg-info-soft text-info',
  gold: 'border-transparent bg-[#f8efd4] text-[#8a6a12]',
};

export function StatusBadge({
  label,
  tone = 'muted',
}: {
  label: string;
  tone?: BadgeTone;
}) {
  return <Badge className={TONE_CLASS[tone]}>{label}</Badge>;
}

export function quoteStatusTone(status: QuoteStatus): BadgeTone {
  switch (status) {
    case 'approved':
    case 'converted':
      return 'success';
    case 'in_review':
    case 'change_requested':
      return 'warning';
    case 'sent':
    case 'viewed':
      return 'default';
    case 'rejected':
      return 'danger';
    default:
      return 'muted';
  }
}

export function contractStatusTone(status: ContractStatus): BadgeTone {
  switch (status) {
    case 'active':
    case 'signed':
      return 'success';
    case 'awaiting_signature':
    case 'in_review':
    case 'sent':
      return 'warning';
    case 'cancelled':
    case 'suspended':
      return 'danger';
    default:
      return 'muted';
  }
}

export function leadStatusTone(status: LeadStatus): BadgeTone {
  switch (status) {
    case 'converted':
      return 'success';
    case 'in_progress':
      return 'warning';
    case 'new':
      return 'default';
    default:
      return 'muted';
  }
}

export function equipmentStatusTone(status: EquipmentStatus): BadgeTone {
  switch (status) {
    case 'available':
      return 'success';
    case 'rented':
      return 'default';
    case 'maintenance':
      return 'warning';
    default:
      return 'muted';
  }
}

const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  available: 'Disponível',
  rented: 'Locado',
  maintenance: 'Manutenção',
  inactive: 'Inativo',
};

const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Novo',
  in_progress: 'Em andamento',
  converted: 'Convertido',
  archived: 'Arquivado',
};

export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return <StatusBadge label={QUOTE_STATUS_LABELS[status]} tone={quoteStatusTone(status)} />;
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  return <StatusBadge label={CONTRACT_STATUS_LABELS[status]} tone={contractStatusTone(status)} />;
}

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <StatusBadge label={LEAD_STATUS_LABELS[status]} tone={leadStatusTone(status)} />;
}

export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  return <StatusBadge label={EQUIPMENT_STATUS_LABELS[status]} tone={equipmentStatusTone(status)} />;
}

export function RecordStatusBadge({ status }: { status: RecordStatus }) {
  return (
    <StatusBadge
      label={status === 'active' ? 'Ativo' : 'Inativo'}
      tone={status === 'active' ? 'success' : 'muted'}
    />
  );
}

export { EQUIPMENT_STATUS_LABELS, LEAD_STATUS_LABELS };
