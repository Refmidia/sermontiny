/** Valores monetários em centavos (inteiro), sem ponto flutuante. */

export type Cents = number;

export function toCents(reais: number | string): Cents {
  if (typeof reais === 'string') {
    const normalized = reais
      .trim()
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    if (!normalized || Number.isNaN(Number(normalized))) {
      throw new Error('Valor monetário inválido.');
    }
    return Math.round(Number(normalized) * 100);
  }
  if (!Number.isFinite(reais)) {
    throw new Error('Valor monetário inválido.');
  }
  return Math.round(reais * 100);
}

export function fromCents(cents: Cents): number {
  return cents / 100;
}

export function addCents(...values: Cents[]): Cents {
  return values.reduce((acc, value) => acc + value, 0);
}

export function subtractCents(left: Cents, right: Cents): Cents {
  return left - right;
}

export function multiplyCents(cents: Cents, quantity: number): Cents {
  if (!Number.isFinite(quantity)) {
    throw new Error('Quantidade inválida.');
  }
  return Math.round(cents * quantity);
}

export function formatBRL(cents: Cents): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(fromCents(cents));
}

export function formatBRLNumber(cents: Cents): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromCents(cents));
}

export type QuoteItemInput = {
  quantity: number;
  unitPriceCents: Cents;
  discountCents: Cents;
  surchargeCents: Cents;
};

export type QuoteTotals = {
  itemsSubtotalCents: Cents;
  discountCents: Cents;
  surchargeCents: Cents;
  taxCents: Cents;
  totalCents: Cents;
};

export function calculateItemSubtotal(item: QuoteItemInput): Cents {
  const raw = multiplyCents(item.unitPriceCents, item.quantity);
  return raw - item.discountCents + item.surchargeCents;
}

export function calculateQuoteTotals(
  items: QuoteItemInput[],
  extraDiscountCents = 0,
  extraSurchargeCents = 0,
  taxCents = 0,
): QuoteTotals {
  const itemTotals = items.map((item) => ({
    subtotal: calculateItemSubtotal(item),
    discount: item.discountCents,
    surcharge: item.surchargeCents,
  }));

  const itemsSubtotalCents = itemTotals.reduce((acc, item) => acc + item.subtotal, 0);
  const discountCents =
    extraDiscountCents + itemTotals.reduce((acc, item) => acc + item.discount, 0);
  const surchargeCents =
    extraSurchargeCents + itemTotals.reduce((acc, item) => acc + item.surcharge, 0);
  const totalCents = itemsSubtotalCents - extraDiscountCents + extraSurchargeCents + taxCents;

  return {
    itemsSubtotalCents,
    discountCents,
    surchargeCents,
    taxCents,
    totalCents,
  };
}

export function shouldRecommendMonthlyRate(
  dailyCents: Cents,
  monthlyCents: Cents,
  days: number,
): boolean {
  if (dailyCents <= 0 || monthlyCents <= 0 || days <= 0) return false;
  return multiplyCents(dailyCents, days) > monthlyCents;
}

export function parseBRLInput(value: string): Cents {
  const cleaned = value.replace(/[^\d,.-]/g, '').trim();
  if (!cleaned) return 0;
  return toCents(cleaned);
}
