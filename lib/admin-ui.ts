export const ADMIN_SELECT_CLASS = 'admin-select';

export const SIDEBAR_STORAGE_KEY = 'sermontiny-admin-sidebar';
export const SIDEBAR_WIDTH_EXPANDED = 272;
export const SIDEBAR_WIDTH_COLLAPSED = 80;

export function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'SM';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function percentChange(current: number, previous: number) {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatPercentChange(value: number) {
  const formatted = Math.abs(value).toLocaleString('pt-BR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  });
  return `${value > 0 ? '+' : value < 0 ? '-' : ''}${formatted}%`;
}
