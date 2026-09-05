import { describe, expect, it } from 'vitest';
import { centsToExtenso } from '@/lib/extenso';
import { toCents } from '@/lib/money';

describe('centsToExtenso', () => {
  it('matches exact numeric values in Brazilian Portuguese', () => {
    expect(centsToExtenso(0)).toBe('zero reais');
    expect(centsToExtenso(100)).toBe('um real');
    expect(centsToExtenso(101)).toBe('um real e um centavo');
    expect(centsToExtenso(200)).toBe('dois reais');
    expect(centsToExtenso(150)).toBe('um real e cinquenta centavos');
    expect(centsToExtenso(10000)).toBe('cem reais');
    expect(centsToExtenso(10100)).toBe('cento e um reais');
    expect(centsToExtenso(toCents(1234.56))).toBe(
      'mil duzentos e trinta e quatro reais e cinquenta e seis centavos',
    );
    expect(centsToExtenso(toCents(2800))).toBe('dois mil oitocentos reais');
    expect(centsToExtenso(toCents(45000))).toBe('quarenta e cinco mil reais');
    expect(centsToExtenso(toCents(1000000))).toBe('um milhão de reais');
    expect(centsToExtenso(toCents(1000001))).toBe('um milhão e um reais');
  });

  it('keeps numeric cents and extenso on the same value', () => {
    const cents = toCents(2800);
    expect(cents).toBe(280000);
    expect(centsToExtenso(cents)).toBe('dois mil oitocentos reais');
    expect(centsToExtenso(cents + 56)).toBe('dois mil oitocentos reais e cinquenta e seis centavos');
  });
});
