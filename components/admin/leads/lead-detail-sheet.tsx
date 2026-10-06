'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Mail, MessageSquareText, Phone } from 'lucide-react';
import { updateLeadNotes, updateLeadStatus } from '@/app/actions/leads';
import { LeadStatusSelect } from '@/components/admin/leads/lead-status-select';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { initialsFromName } from '@/lib/admin-ui';
import { formatDateTimeBr, toWhatsAppDigits } from '@/lib/format';
import { leadInterest, leadSourceLabel } from '@/lib/leads/ui';
import type { Lead, LeadStatus } from '@/types/database';

export type LeadDetail = Lead & {
  equipmentName?: string | null;
  assigneeName?: string | null;
  assigneeRole?: string | null;
};

function LeadDetailBody({
  lead,
  canWrite,
  onStatusSaved,
}: {
  lead: LeadDetail;
  canWrite: boolean;
  onStatusSaved: (id: string, status: LeadStatus) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(lead.notes ?? '');
  const [status, setStatus] = useState<LeadStatus>(lead.status);

  function saveStatus(next: LeadStatus) {
    if (!canWrite || next === status) return;
    const previous = status;
    setStatus(next);
    startTransition(async () => {
      const result = await updateLeadStatus(lead.id, next);
      if (result.error) {
        setStatus(previous);
        toast.error(result.error);
        return;
      }
      onStatusSaved(lead.id, next);
      toast.success('Status atualizado com sucesso');
    });
  }

  function saveNotes() {
    if (!canWrite) return;
    startTransition(async () => {
      const result = await updateLeadNotes(lead.id, notes);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success('Observação salva');
    });
  }

  const phone = lead.phone || lead.whatsapp || '';
  const whatsapp = lead.whatsapp || lead.phone || '';

  return (
    <div className="space-y-5 pt-2">
      <div className="flex items-start gap-3 pr-8">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
          {initialsFromName(lead.name)}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-navy">{lead.name}</h2>
          <p className="text-sm text-muted">{lead.company || lead.subject || 'Contato do site'}</p>
        </div>
      </div>

      <section className="grid gap-3 rounded-[12px] border border-border bg-paper px-4 py-3 text-sm">
        <DetailRow label="E-mail" value={lead.email} />
        <DetailRow label="Telefone" value={phone || null} />
        <DetailRow label="Empresa" value={lead.company} />
        <DetailRow
          label="Interesse"
          value={leadInterest({
            subject: lead.subject,
            company: lead.company,
            equipmentName: lead.equipmentName,
          })}
        />
        <DetailRow label="Origem" value={leadSourceLabel(lead.source)} />
        <DetailRow label="Criado em" value={formatDateTimeBr(lead.created_at)} />
        <DetailRow
          label="Responsável"
          value={
            lead.assigneeName
              ? `${lead.assigneeName}${lead.assigneeRole ? ` · ${lead.assigneeRole}` : ''}`
              : 'Não atribuído'
          }
        />
      </section>

      <section className="space-y-2">
        <p className="text-sm font-medium text-navy">Mensagem</p>
        <p className="rounded-[12px] border border-border bg-white px-4 py-3 text-sm leading-6 text-navy/90">
          {lead.message}
        </p>
      </section>

      <section className="space-y-2">
        <p className="text-sm font-medium text-navy">Status</p>
        <LeadStatusSelect value={status} disabled={!canWrite} pending={pending} onChange={saveStatus} />
      </section>

      <section className="space-y-2">
        <p className="text-sm font-medium text-navy">Observações internas</p>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          disabled={!canWrite || pending}
          rows={4}
          placeholder="Anotações da equipe comercial..."
        />
        {canWrite ? (
          <Button type="button" variant="gold" size="sm" disabled={pending} onClick={saveNotes}>
            <MessageSquareText />
            Salvar observação
          </Button>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" disabled={!whatsapp}>
          <a
            href={whatsapp ? `https://wa.me/${toWhatsAppDigits(whatsapp)}` : undefined}
            target="_blank"
            rel="noreferrer"
          >
            <WhatsAppIcon className="text-[#25D366]" />
            WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" disabled={!phone}>
          <a href={phone ? `tel:${phone}` : undefined}>
            <Phone />
            Ligar
          </a>
        </Button>
        <Button asChild variant="outline" size="sm" disabled={!lead.email}>
          <a href={lead.email ? `mailto:${lead.email}` : undefined}>
            <Mail />
            E-mail
          </a>
        </Button>
      </div>
    </div>
  );
}

export function LeadDetailSheet({
  lead,
  open,
  canWrite,
  onOpenChange,
  onStatusSaved,
}: {
  lead: LeadDetail | null;
  open: boolean;
  canWrite: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusSaved: (id: string, status: LeadStatus) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-lg overflow-y-auto sm:w-[480px]">
        {lead ? (
          <LeadDetailBody key={lead.id} lead={lead} canWrite={canWrite} onStatusSaved={onStatusSaved} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[120px_1fr] sm:gap-3">
      <span className="text-[12px] font-medium text-muted">{label}</span>
      <span className="text-navy">{value || '—'}</span>
    </div>
  );
}
