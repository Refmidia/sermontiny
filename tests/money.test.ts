import { describe, expect, it } from 'vitest';
import {
  calculateItemSubtotal,
  calculateQuoteTotals,
  shouldRecommendMonthlyRate,
  toCents,
} from '@/lib/money';

describe('money', () => {
  it('converts reais to cents without floating error', () => {
    expect(toCents(2.8)).toBe(280);
    expect(toCents('2.800,00')).toBe(280000);
    expect(toCents('10,50')).toBe(1050);
  });

  it('calculates item subtotal with discount and surcharge', () => {
    expect(
      calculateItemSubtotal({
        quantity: 3,
        unitPriceCents: 200000,
        discountCents: 10000,
        surchargeCents: 5000,
      }),
    ).toBe(595000);
  });

  it('calculates quote totals in cents', () => {
    const totals = calculateQuoteTotals(
      [
        { quantity: 2, unitPriceCents: 280000, discountCents: 0, surchargeCents: 0 },
        { quantity: 10, unitPriceCents: 1000, discountCents: 0, surchargeCents: 0 },
      ],
      5000,
      2000,
      1000,
    );
    expect(totals.itemsSubtotalCents).toBe(570000);
    expect(totals.totalCents).toBe(568000);
  });

  it('recommends monthly rate when cheaper than daily accumulation', () => {
    expect(shouldRecommendMonthlyRate(280000, 4500000, 20)).toBe(true);
    expect(shouldRecommendMonthlyRate(280000, 4500000, 10)).toBe(false);
  });
});
