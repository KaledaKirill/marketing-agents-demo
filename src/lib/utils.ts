import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const uid = () => crypto.randomUUID();
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const number = (value: number) => value.toLocaleString('en-US');
export function surveyUrl(slug: string) {
  return `${location.origin}${location.pathname}#/survey/${encodeURIComponent(slug)}`;
}

export async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}
