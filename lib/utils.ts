import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function assertUnreachable(value: never): never {
  throw new Error(`Valor não tratado: ${String(value)}`);
}
