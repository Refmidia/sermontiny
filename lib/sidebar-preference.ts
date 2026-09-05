import { SIDEBAR_STORAGE_KEY } from '@/lib/admin-ui';

let collapsed = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function readStoredPreference() {
  const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (stored === 'collapsed') return true;
  if (stored === 'expanded') return false;
  return window.innerWidth < 1280;
}

if (typeof window !== 'undefined') {
  collapsed = readStoredPreference();
}

export function getSidebarCollapsed() {
  return collapsed;
}

export function getSidebarCollapsedServer() {
  return false;
}

export function subscribeSidebarCollapsed(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setSidebarCollapsed(value: boolean) {
  collapsed = value;
  window.localStorage.setItem(SIDEBAR_STORAGE_KEY, value ? 'collapsed' : 'expanded');
  notify();
}

export function toggleSidebarCollapsed() {
  setSidebarCollapsed(!collapsed);
}
