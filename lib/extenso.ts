import { fromCents, type Cents } from '@/lib/money';

const UNITS = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const TEENS = [
  'dez',
  'onze',
  'doze',
  'treze',
  'quatorze',
  'quinze',
  'dezesseis',
  'dezessete',
  'dezoito',
  'dezenove',
];
const TENS = [
  '',
  '',
  'vinte',
  'trinta',
  'quarenta',
  'cinquenta',
  'sessenta',
  'setenta',
  'oitenta',
  'noventa',
];
const HUNDREDS = [
  '',
  'cento',
  'duzentos',
  'trezentos',
  'quatrocentos',
  'quinhentos',
  'seiscentos',
  'setecentos',
  'oitocentos',
  'novecentos',
];

function groupToWords(value: number): string {
  if (value === 0) return '';
  if (value === 100) return 'cem';

  const hundreds = Math.floor(value / 100);
  const remainder = value % 100;
  const tens = Math.floor(remainder / 10);
  const units = remainder % 10;
  const parts: string[] = [];

  if (hundreds > 0) parts.push(HUNDREDS[hundreds] ?? '');

  if (remainder >= 10 && remainder <= 19) {
    parts.push(TEENS[remainder - 10] ?? '');
  } else {
    if (tens > 0) parts.push(TENS[tens] ?? '');
    if (units > 0) parts.push(UNITS[units] ?? '');
  }

  return parts.filter(Boolean).join(' e ');
}

const SCALES: Array<{ singular: string; plural: string }> = [
  { singular: '', plural: '' },
  { singular: 'mil', plural: 'mil' },
  { singular: 'milhão', plural: 'milhões' },
  { singular: 'bilhão', plural: 'bilhões' },
  { singular: 'trilhão', plural: 'trilhões' },
];

export function integerToWords(value: number): string {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Inteiro inválido para extenso.');
  }
  if (value === 0) return 'zero';

  const groups: number[] = [];
  let remaining = value;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: Array<{ words: string; value: number }> = [];
  for (let i = groups.length - 1; i >= 0; i -= 1) {
    const group = groups[i] ?? 0;
    if (group === 0) continue;
    const scale = SCALES[i];
    if (!scale) throw new Error('Valor acima do limite suportado para extenso.');

    let words = groupToWords(group);
    if (i === 1 && group === 1) {
      words = 'mil';
    } else if (scale.singular) {
      words = `${words} ${group === 1 ? scale.singular : scale.plural}`;
    }
    parts.push({ words, value: group * 1000 ** i });
  }

  if (parts.length === 1) return parts[0]?.words ?? '';

  return parts.reduce((acc, part, index) => {
    if (index === 0) return part.words;
    const previousValue = parts[index]?.value ?? 0;
    const connector = previousValue < 100 ? ' e ' : ' ';
    return `${acc}${connector}${part.words}`;
  }, '');
}

function currencyNoun(value: number, singular: string, plural: string): string {
  return value === 1 ? singular : plural;
}

function needsDeReais(reais: number): boolean {
  return reais > 0 && reais % 1_000_000 === 0;
}

export function centsToExtenso(cents: Cents): string {
  if (!Number.isInteger(cents) || cents < 0) {
    throw new Error('Valor em centavos inválido.');
  }

  const reais = Math.floor(fromCents(cents));
  const centavos = cents % 100;

  if (reais === 0 && centavos === 0) return 'zero reais';

  const parts: string[] = [];

  if (reais > 0) {
    const words = integerToWords(reais);
    const connector = needsDeReais(reais) ? ' de ' : ' ';
    parts.push(`${words}${connector}${currencyNoun(reais, 'real', 'reais')}`);
  }

  if (centavos > 0) {
    parts.push(`${integerToWords(centavos)} ${currencyNoun(centavos, 'centavo', 'centavos')}`);
  }

  return parts.join(' e ');
}

export function reaisToExtenso(reais: number): string {
  return centsToExtenso(Math.round(reais * 100));
}
