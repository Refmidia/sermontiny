import { parseBRLInput } from '@/lib/money';
import { slugify } from '@/lib/format';

export function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function parseOptionalNumber(value?: string | null) {
  if (!value?.trim()) return null;
  const normalized = value.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseMoneyField(value?: string | null) {
  if (!value?.trim()) return 0;
  return parseBRLInput(value);
}

export function uniqueSlug(base: string, suffix?: string) {
  const slug = slugify(base);
  return suffix ? `${slug}-${suffix}` : slug;
}
