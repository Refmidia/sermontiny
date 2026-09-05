import { formatBRL } from '@/lib/money';
import { UNIT_LABELS } from '@/types/database';
import type { QuoteDocumentModel } from '@/lib/pdf/quote-document';

export function QuotePrintView({ doc }: { doc: QuoteDocumentModel }) {
  return (
    <article className="mx-auto w-[210mm] max-w-full bg-white px-8 py-8 text-[#10233f] print:px-0 print:py-0">
      <div className="mb-5 h-1.5 bg-gold" />
      <header className="mb-6 flex items-start justify-between gap-6">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/sermontiny/logo-oficial-nav.png" alt="Sermontiny" className="h-12 w-auto" />
          <p className="mt-3 max-w-xs text-xs leading-5 text-muted">
            {doc.settings.legal_name}
            <br />
            CNPJ {doc.settings.cnpj}
            <br />
            {doc.companyAddress}
            {doc.settings.whatsapp || doc.settings.phones[0] ? (
              <>
                <br />
                {doc.settings.whatsapp || doc.settings.phones[0]}
              </>
            ) : null}
            {doc.settings.email ? (
              <>
                <br />
                {doc.settings.email}
              </>
            ) : null}
          </p>
        </div>
        <div className="w-52 bg-navy p-3 text-right text-white">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-gold uppercase">Proposta comercial</p>
          <p className="mt-1 text-lg font-bold">{doc.number}</p>
          <p className="mt-1 text-[11px] text-white/75">Versão {doc.version}</p>
          <p className="text-[11px] text-white/75">Emissão {doc.issuedAt}</p>
          {doc.validUntil && <p className="text-[11px] text-white/75">Validade {doc.validUntil}</p>}
        </div>
      </header>

      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <section className="rounded-md border border-border p-3">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-gold uppercase">Cliente</p>
          <p className="mt-1 font-semibold text-navy">{doc.customerName}</p>
          {doc.customerTradeName && <p className="text-sm text-muted">{doc.customerTradeName}</p>}
          <p className="text-sm text-muted">{doc.customerDocumentLabel}</p>
          {doc.customerAddress && <p className="text-sm text-muted">{doc.customerAddress}</p>}
          {doc.customerEmail && <p className="text-sm text-muted">{doc.customerEmail}</p>}
          {doc.customerPhone && <p className="text-sm text-muted">{doc.customerPhone}</p>}
        </section>
        <section className="rounded-md border border-border p-3">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-gold uppercase">Serviço</p>
          <p className="mt-1 font-semibold text-navy">{doc.title}</p>
          {(doc.startDate || doc.endDate) && (
            <p className="text-sm text-muted">
              Período: {doc.startDate ?? 'a definir'} a {doc.endDate ?? 'a definir'}
            </p>
          )}
          {doc.paymentDeadline && <p className="text-sm text-muted">Prazo de pagamento: {doc.paymentDeadline}</p>}
        </section>
      </div>

      {doc.scope && (
        <section className="mb-5">
          <h2 className="text-sm font-semibold text-navy">Escopo</h2>
          <p className="mt-1 text-sm leading-6 text-navy/80">{doc.scope}</p>
        </section>
      )}

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-navy text-left text-white">
            <th className="px-3 py-2 font-medium">Descrição</th>
            <th className="px-3 py-2 font-medium">Unidade</th>
            <th className="px-3 py-2 text-right font-medium">Qtde</th>
            <th className="px-3 py-2 text-right font-medium">Unitário</th>
            <th className="px-3 py-2 text-right font-medium">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((item, index) => (
            <tr key={`${item.description}-${index}`} className="border-b border-border">
              <td className="px-3 py-2">{item.description}</td>
              <td className="px-3 py-2">{UNIT_LABELS[item.unit]}</td>
              <td className="px-3 py-2 text-right">{String(item.quantity).replace('.', ',')}</td>
              <td className="px-3 py-2 text-right">{formatBRL(item.unit_price_cents)}</td>
              <td className="px-3 py-2 text-right">{formatBRL(item.subtotal_cents)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-5 ml-auto w-full max-w-xs text-sm">
        <div className="flex justify-between py-1">
          <span>Subtotal</span>
          <span>{formatBRL(doc.subtotalCents)}</span>
        </div>
        {doc.discountCents > 0 && (
          <div className="flex justify-between py-1">
            <span>Desconto</span>
            <span>- {formatBRL(doc.discountCents)}</span>
          </div>
        )}
        {doc.surchargeCents > 0 && (
          <div className="flex justify-between py-1">
            <span>Acréscimo</span>
            <span>{formatBRL(doc.surchargeCents)}</span>
          </div>
        )}
        {doc.taxCents > 0 && (
          <div className="flex justify-between py-1">
            <span>Impostos</span>
            <span>{formatBRL(doc.taxCents)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between bg-navy px-3 py-2 font-semibold text-white">
          <span>Total</span>
          <span>{formatBRL(doc.totalCents)}</span>
        </div>
        <p className="mt-2 text-xs text-muted italic">{doc.totalExtenso}</p>
      </div>

      {doc.paymentTerms && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-navy">Condições comerciais</h2>
          <p className="mt-1 text-sm leading-6">{doc.paymentTerms}</p>
        </section>
      )}
      {doc.notes && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-navy">Observações</h2>
          <p className="mt-1 text-sm leading-6">{doc.notes}</p>
        </section>
      )}

      <div className="mt-12 grid gap-10 sm:grid-cols-2">
        <p className="border-t border-navy pt-2 text-center text-xs text-muted">
          {doc.settings.legal_name}
          <br />
          Contratada
        </p>
        <p className="border-t border-navy pt-2 text-center text-xs text-muted">
          {doc.customerName}
          <br />
          Aceite do cliente
        </p>
      </div>
    </article>
  );
}
