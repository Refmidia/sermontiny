'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Clock3, Plus, RotateCcw, Wallet } from 'lucide-react';
import { createQuotePayment, listQuotePayments, type QuotePaymentRow } from '@/app/actions/quote-payments';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTimeBr } from '@/lib/format';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';

const PAYMENT_KINDS = ['Sinal', 'Parcial', 'Quitação', 'Outro'];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function splitNow(date = new Date()) {
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

function combineDateTime(date: string, time: string) {
  if (!date) return '';
  return `${date}T${time || '00:00'}`;
}

export function QuotePaymentsDialog({
  open,
  onOpenChange,
  quoteId,
  quoteNumber,
  customerName,
  totalCents,
  canWrite,
  onReceivedChange,
  initialReceivedCents = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  quoteNumber: string;
  customerName: string;
  totalCents: number;
  canWrite: boolean;
  onReceivedChange?: (receivedCents: number) => void;
  initialReceivedCents?: number;
}) {
  const initial = splitNow();
  const [payments, setPayments] = useState<QuotePaymentRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [kind, setKind] = useState('Sinal');
  const [paidDate, setPaidDate] = useState(initial.date);
  const [paidTime, setPaidTime] = useState(initial.time);
  const [notes, setNotes] = useState('');
  const [pending, startTransition] = useTransition();

  const receivedCents = useMemo(() => {
    if (!loaded) return initialReceivedCents;
    return payments.reduce((sum, payment) => sum + (payment.amount_cents || 0), 0);
  }, [payments, initialReceivedCents, loaded]);
  const balanceCents = Math.max(0, totalCents - receivedCents);
  const progress = totalCents > 0 ? Math.min(100, Math.round((receivedCents / totalCents) * 100)) : 0;

  useEffect(() => {
    if (!open) return;
    const now = splitNow();
    setPaidDate(now.date);
    setPaidTime(now.time);
    let cancelled = false;
    setLoading(true);
    setLoaded(false);
    void listQuotePayments(quoteId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      setLoaded(true);
      if (result.error) {
        toast.error(result.error);
        setPayments([]);
        return;
      }
      setPayments(result.payments);
      const totalReceived = result.payments.reduce((sum, payment) => sum + (payment.amount_cents || 0), 0);
      onReceivedChange?.(totalReceived);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- evita loop ao atualizar o pai
  }, [open, quoteId]);

  function useNow() {
    const now = splitNow();
    setPaidDate(now.date);
    setPaidTime(now.time);
  }

  function savePayment() {
    startTransition(async () => {
      const paidAt = combineDateTime(paidDate, paidTime);
      if (!paidDate) {
        toast.error('Informe a data do pagamento.');
        return;
      }
      const result = await createQuotePayment({
        quoteId,
        amount,
        kind,
        paidAt,
        notes,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.payment) {
        setPayments((current) => {
          const next = [result.payment!, ...current];
          const totalReceived = next.reduce((sum, payment) => sum + (payment.amount_cents || 0), 0);
          onReceivedChange?.(totalReceived);
          return next;
        });
      }
      setAmount('');
      setNotes('');
      useNow();
      toast.success('Pagamento registrado.');
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-border bg-white p-0 sm:max-w-2xl">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <DialogHeader className="mb-0 pr-8">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
                <Wallet className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-navy">Recebimentos</DialogTitle>
                <DialogDescription className="mt-0.5 truncate">
                  {quoteNumber}
                  {customerName ? ` · ${customerName}` : ''}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="max-h-[min(70vh,640px)] space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <section className="rounded-xl border border-border bg-paper p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryStat label="Orçamento" value={formatBRL(totalCents)} />
              <SummaryStat label="Recebido" value={formatBRL(receivedCents)} emphasize />
              <SummaryStat label="Saldo" value={formatBRL(balanceCents)} muted={balanceCents === 0} />
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-muted">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={cn('h-full rounded-full transition-all', progress >= 100 ? 'bg-success' : 'bg-navy')}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </section>

          {canWrite ? (
            <section className="rounded-xl border border-border bg-white p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy/10 text-navy">
                  <Plus className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-semibold text-navy">Registrar pagamento</h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                  Valor (R$)
                  <Input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="0,00"
                    className="h-10 font-semibold text-navy"
                  />
                </label>
                <label className="grid gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                  Tipo
                  <select
                    value={kind}
                    onChange={(event) => setKind(event.target.value)}
                    className="admin-select h-10"
                  >
                    {PAYMENT_KINDS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:col-span-2 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="grid gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                    Data
                    <Input
                      type="date"
                      value={paidDate}
                      onChange={(event) => setPaidDate(event.target.value)}
                      className="h-10"
                    />
                  </label>
                  <label className="grid gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase">
                    Hora
                    <Input
                      type="time"
                      value={paidTime}
                      onChange={(event) => setPaidTime(event.target.value)}
                      className="h-10"
                    />
                  </label>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" className="h-10 w-full sm:w-auto" onClick={useNow}>
                      <RotateCcw className="h-4 w-4" />
                      Agora
                    </Button>
                  </div>
                </div>
                <label className="grid gap-1.5 text-[11px] font-semibold tracking-wide text-muted uppercase sm:col-span-2">
                  Observação (opcional)
                  <Textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Pix, comprovante, banco..."
                    rows={2}
                    className="min-h-[72px] resize-none"
                  />
                </label>
              </div>

              <div className="mt-4 flex justify-end">
                <Button type="button" className="h-10 min-w-[120px]" disabled={pending} onClick={savePayment}>
                  {pending ? 'Salvando...' : 'Salvar pagamento'}
                </Button>
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted" />
                <h3 className="text-sm font-semibold text-navy">Histórico</h3>
              </div>
              {!loading && payments.length > 0 ? (
                <span className="text-[12px] font-medium text-muted">
                  {payments.length} {payments.length === 1 ? 'lançamento' : 'lançamentos'}
                </span>
              ) : null}
            </div>

            {loading ? (
              <p className="rounded-xl border border-border bg-paper px-4 py-8 text-center text-sm text-muted">
                Carregando recebimentos...
              </p>
            ) : payments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-paper px-4 py-8 text-center text-sm text-muted">
                Nenhum pagamento registrado ainda.
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border">
                {payments.map((payment) => (
                  <li key={payment.id} className="flex items-start justify-between gap-3 bg-white px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] font-semibold text-navy">
                          {payment.kind}
                        </span>
                        <span className="text-[12px] text-muted">{formatDateTimeBr(payment.paid_at)}</span>
                      </div>
                      <p className="mt-1 truncate text-[13px] text-muted">{payment.notes || 'Sem observação'}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-navy">{formatBRL(payment.amount_cents)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex justify-end border-t border-border px-5 py-3 sm:px-6">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fechar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({
  label,
  value,
  emphasize,
  muted,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
  muted?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-semibold tracking-tight sm:text-xl',
          emphasize ? 'text-success' : muted ? 'text-muted' : 'text-navy',
        )}
      >
        {value}
      </p>
    </div>
  );
}
