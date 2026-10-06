import { Boxes, CheckCircle2, FileText, UserRound, type LucideIcon } from 'lucide-react';
import { formatBRL } from '@/lib/money';
import { UNIT_LABELS } from '@/types/database';
import type { QuoteDocumentModel } from '@/lib/pdf/quote-document';

/** Cores do documento — navy da marca (sem amarelo). */
const C = {
  navy: '#071B35',
  navySoft: '#0D294A',
  steel: '#174A7E',
  ink: '#1A2B3C',
  muted: '#5C6B7A',
  line: '#D8E0EA',
  paper: '#F5F8FB',
  paperSoft: '#EEF3F8',
  white: '#FFFFFF',
} as const;

function SectionTitle({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-full text-white"
        style={{ backgroundColor: C.navy }}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
      <p className="text-[12px] font-bold tracking-[0.08em] uppercase" style={{ color: C.navy }}>
        {children}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div
      className="grid grid-cols-[132px_minmax(0,1fr)] items-baseline gap-x-3 border-b py-2.5 last:border-b-0"
      style={{ borderColor: C.line }}
    >
      <dt className="text-[11px] font-semibold" style={{ color: C.muted }}>
        {label}
      </dt>
      <dd className="text-[13px] font-semibold leading-snug" style={{ color: C.ink }}>
        {value?.trim() || '—'}
      </dd>
    </div>
  );
}

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="min-w-[140px] flex-1 rounded-xl border bg-white px-3.5 py-3"
      style={{ borderColor: C.line, borderLeftWidth: 5, borderLeftColor: C.navy }}
    >
      <p className="text-[9px] font-bold tracking-[0.14em] uppercase" style={{ color: C.muted }}>
        {label}
      </p>
      <p className="mt-1 text-[15px] leading-tight font-bold" style={{ color: C.navy }}>
        {value}
      </p>
    </div>
  );
}

export function QuotePrintView({ doc }: { doc: QuoteDocumentModel }) {
  const brand = doc.settings.trade_name || 'Sermontiny';
  const phones = [doc.settings.whatsapp, ...(doc.settings.phones ?? [])].filter(Boolean) as string[];
  const addressParts = [
    doc.settings.street && doc.settings.number
      ? `${doc.settings.street}, nº ${doc.settings.number}`
      : doc.companyAddress,
    [doc.settings.district, doc.settings.city && doc.settings.state ? `${doc.settings.city} - ${doc.settings.state}` : doc.settings.city]
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean);

  return (
    <article
      className="quote-print-sheet mx-auto w-[210mm] max-w-full overflow-hidden bg-white print:w-full print:max-w-none print:shadow-none"
      style={{ color: C.ink, boxShadow: '0 12px 32px rgba(7, 27, 53, 0.08)' }}
    >
      <div className="px-8 pt-8 pb-6 sm:px-10 sm:pt-9">
        {/* Cabeçalho estilo Minas Calhas */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/sermontiny/logo-oficial-nav.webp"
              alt={brand}
              className="h-16 w-auto max-w-[220px] object-contain object-left"
            />
            <p className="mt-2 text-[10px] font-medium tracking-[0.04em]" style={{ color: C.muted }}>
              Montagens industriais · Locações
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-start text-[11.5px] leading-[1.55]" style={{ color: C.muted }}>
            <div className="min-w-[150px] flex-1 border-l px-4" style={{ borderColor: C.line }}>
              {addressParts.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="min-w-[150px] flex-1 border-l px-4" style={{ borderColor: C.line }}>
              {phones.length ? phones.map((phone) => <p key={phone}>{phone}</p>) : <p>Telefone não informado</p>}
              {doc.settings.email ? <p className="mt-1.5 break-all">{doc.settings.email}</p> : null}
            </div>
            <div className="min-w-[150px] flex-1 border-l px-4" style={{ borderColor: C.line }}>
              <p>CNPJ {doc.settings.cnpj}</p>
              <p className="mt-0.5">IE {doc.settings.state_registration || '—'}</p>
            </div>
          </div>
        </header>

        <div className="mt-6 h-[3px] rounded-full" style={{ backgroundColor: C.navy }} />

        {/* Título + metadados */}
        <div className="mt-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[36px] leading-none font-extrabold tracking-tight" style={{ color: C.navy }}>
              Orçamento
            </h1>
            <p className="mt-2 text-sm" style={{ color: C.muted }}>
              Proposta comercial {brand}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <MetaCard label="Nº do orçamento" value={doc.number} />
            <MetaCard label="Data da emissão" value={doc.issuedAt} />
            <MetaCard label="Hora de emissão" value={doc.issuedTime || '—'} />
          </div>
        </div>

        {/* Cliente + documento */}
        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <section className="rounded-xl border p-5" style={{ borderColor: C.line, backgroundColor: C.paper }}>
            <SectionTitle icon={UserRound}>Dados do cliente</SectionTitle>
            <dl>
              <Field label="Nome / Razão social" value={doc.customerName} />
              <Field label="CPF / CNPJ" value={doc.customerDocumentLabel} />
              <Field label="Endereço" value={doc.customerAddress} />
              <Field label="Telefone" value={doc.customerPhone} />
              <Field label="E-mail" value={doc.customerEmail} />
              {doc.unitName ? <Field label="Unidade" value={doc.unitName} /> : null}
            </dl>
          </section>

          <section className="rounded-xl border p-5" style={{ borderColor: C.line, backgroundColor: C.paper }}>
            <SectionTitle icon={FileText}>Dados do documento</SectionTitle>
            <dl>
              <Field label="Data de emissão" value={doc.issuedAt} />
              <Field label="Título" value={doc.title} />
              <Field label="Versão" value={`V${doc.version}`} />
              <Field label="Condição de pagamento" value={doc.paymentDeadline || doc.paymentTerms || 'A combinar'} />
              <Field label="Validade da proposta" value={doc.validUntil || 'A combinar'} />
              <Field
                label="Período"
                value={
                  doc.startDate || doc.endDate
                    ? `${doc.startDate ?? 'a definir'} a ${doc.endDate ?? 'a definir'}`
                    : '—'
                }
              />
            </dl>
          </section>
        </div>

        {doc.scope ? (
          <section className="mt-6 rounded-xl border px-5 py-4" style={{ borderColor: C.line, backgroundColor: C.paper }}>
            <SectionTitle icon={Boxes}>Escopo</SectionTitle>
            <p className="text-sm leading-7" style={{ color: C.ink }}>
              {doc.scope}
            </p>
          </section>
        ) : null}

        {/* Itens */}
        <section className="mt-7">
          <SectionTitle icon={Boxes}>Itens do orçamento</SectionTitle>
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: C.line }}>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="text-left text-[11px] tracking-wide text-white uppercase" style={{ backgroundColor: C.navy }}>
                  <th className="px-3.5 py-3 font-semibold">Código</th>
                  <th className="px-3.5 py-3 font-semibold">Descrição</th>
                  <th className="px-3.5 py-3 font-semibold">Unid.</th>
                  <th className="px-3.5 py-3 text-right font-semibold">Qtde</th>
                  <th className="px-3.5 py-3 text-right font-semibold">Valor unitário</th>
                  <th className="px-3.5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((item, index) => (
                  <tr
                    key={`${item.description}-${index}`}
                    className="border-t bg-white"
                    style={{ borderColor: C.line }}
                  >
                    <td className="px-3.5 py-3" style={{ color: C.muted }}>
                      {String(index + 1).padStart(3, '0')}
                    </td>
                    <td className="px-3.5 py-3 font-semibold" style={{ color: C.ink }}>
                      {item.description}
                    </td>
                    <td className="px-3.5 py-3" style={{ color: C.muted }}>
                      {UNIT_LABELS[item.unit]}
                    </td>
                    <td className="px-3.5 py-3 text-right">{String(item.quantity).replace('.', ',')}</td>
                    <td className="px-3.5 py-3 text-right">{formatBRL(item.unit_price_cents)}</td>
                    <td className="px-3.5 py-3 text-right font-bold">{formatBRL(item.subtotal_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Observações */}
        <section className="mt-7">
          <SectionTitle icon={FileText}>Observações</SectionTitle>
          <div
            className="min-h-24 rounded-xl border px-5 py-4 text-sm leading-7"
            style={{ borderColor: C.line, backgroundColor: C.paperSoft, color: C.ink }}
          >
            {doc.notes || '—'}
          </div>
        </section>

        {/* Resumo financeiro */}
        <section className="mt-7">
          <SectionTitle icon={Boxes}>Resumo financeiro</SectionTitle>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-xl border" style={{ borderColor: C.line }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] text-white uppercase" style={{ backgroundColor: C.navy }}>
                    <th className="px-3.5 py-2.5 font-semibold">Parcela</th>
                    <th className="px-3.5 py-2.5 text-right font-semibold">Valor</th>
                    <th className="px-3.5 py-2.5 text-right font-semibold">Vencimento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t bg-white" style={{ borderColor: C.line }}>
                    <td className="px-3.5 py-3">1/1</td>
                    <td className="px-3.5 py-3 text-right font-semibold">{formatBRL(doc.totalCents)}</td>
                    <td className="px-3.5 py-3 text-right">{doc.validUntil || 'A combinar'}</td>
                  </tr>
                </tbody>
              </table>
              <div
                className="flex items-center justify-between px-3.5 py-3 text-sm font-extrabold text-white"
                style={{ backgroundColor: C.steel }}
              >
                <span>TOTAL DOS ITENS</span>
                <span>{formatBRL(doc.subtotalCents)}</span>
              </div>
              {(doc.discountCents > 0 || doc.surchargeCents > 0 || doc.taxCents > 0) && (
                <div className="space-y-1.5 border-t bg-white px-3.5 py-3 text-[12px]" style={{ borderColor: C.line, color: C.muted }}>
                  {doc.discountCents > 0 ? (
                    <div className="flex justify-between">
                      <span>Desconto</span>
                      <span>- {formatBRL(doc.discountCents)}</span>
                    </div>
                  ) : null}
                  {doc.surchargeCents > 0 ? (
                    <div className="flex justify-between">
                      <span>Acréscimo</span>
                      <span>{formatBRL(doc.surchargeCents)}</span>
                    </div>
                  ) : null}
                  {doc.taxCents > 0 ? (
                    <div className="flex justify-between">
                      <span>Impostos</span>
                      <span>{formatBRL(doc.taxCents)}</span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div
                className="rounded-xl border-2 px-5 py-5 text-white"
                style={{ borderColor: C.steel, backgroundColor: C.navy }}
              >
                <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-white/70">Total à vista</p>
                <p className="mt-1.5 text-[34px] leading-none font-extrabold tracking-tight">{formatBRL(doc.totalCents)}</p>
                <p className="mt-2.5 text-xs text-white/65 italic">{doc.totalExtenso}</p>
              </div>

              {doc.pixQrSrc ? (
                <div className="overflow-hidden rounded-xl border bg-white" style={{ borderColor: C.line }}>
                  <div
                    className="flex items-center justify-between gap-3 border-b px-4 py-3"
                    style={{ borderColor: C.line, backgroundColor: C.paperSoft }}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/images/sermontiny/logo-oficial-nav.webp" alt="" className="h-7 w-auto" />
                      <p className="text-[12px] font-extrabold tracking-wide uppercase" style={{ color: C.navy }}>
                        Pagamento via PIX
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      {doc.pixKeyLabel ? (
                        <div className="rounded-lg px-3.5 py-2.5" style={{ backgroundColor: C.navy }}>
                          <p className="text-[10px] font-bold tracking-[0.12em] text-white/70 uppercase">Chave PIX</p>
                          <p className="mt-0.5 text-[15px] font-extrabold tracking-wide text-white">{doc.pixKeyLabel}</p>
                        </div>
                      ) : null}
                      <p className="mt-3.5 text-xs" style={{ color: C.muted }}>
                        Escaneie o QR Code no aplicativo do seu banco.
                      </p>
                      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold" style={{ color: C.ink }}>
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" style={{ color: C.steel }} />
                          Pagamento instantâneo
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle2 className="size-3.5" style={{ color: C.steel }} />
                          Seguro e confiável
                        </span>
                      </div>
                    </div>
                    <div className="justify-self-center rounded-xl border bg-white p-2.5" style={{ borderColor: C.line }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={doc.pixQrSrc} alt="QR Code Pix" className="size-36" />
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {doc.paymentTerms ? (
          <section className="mt-7 text-sm leading-7" style={{ color: C.muted }}>
            <p className="font-bold" style={{ color: C.navy }}>
              Condições comerciais
            </p>
            <p className="mt-1.5">{doc.paymentTerms}</p>
          </section>
        ) : null}
      </div>

      <div className="mt-4 flex h-3.5 overflow-hidden">
        <div className="w-1/2" style={{ backgroundColor: C.navy }} />
        <div className="w-1/2" style={{ backgroundColor: C.steel }} />
      </div>
    </article>
  );
}
