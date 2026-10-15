import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('fr-GA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
