export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCnpj(value: string): string {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

export function formatDocument(value: string, personType: 'pj' | 'pf'): string {
  return personType === 'pj' ? formatCnpj(value) : formatCpf(value);
}

export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, '$1-$2');
}

export function formatPhoneBr(value: string): string {
  const digits = onlyDigits(value).slice(0, 13);
  if (digits.startsWith('55') && digits.length > 11) {
    const rest = digits.slice(2);
    if (rest.length <= 10) {
      return `+55 (${rest.slice(0, 2)}) ${rest.slice(2, 6)}-${rest.slice(6)}`.replace(/[()-]$/, '');
    }
    return `+55 (${rest.slice(0, 2)}) ${rest.slice(2, 7)}-${rest.slice(7)}`;
  }
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{4})(\d)/, '($1) $2-$3');
  }
  return digits.replace(/^(\d{2})(\d{5})(\d)/, '($1) $2-$3');
}

export function toWhatsAppDigits(value: string, defaultDdi = '55'): string {
  const digits = onlyDigits(value);
  if (digits.startsWith(defaultDdi)) return digits;
  if (digits.length <= 11) return `${defaultDdi}${digits}`;
  return digits;
}

export function formatDateBr(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR').format(date);
}

export function formatDateTimeBr(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
