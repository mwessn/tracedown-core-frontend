import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let idCounter = 0;

export function generateId(scope: string): string {
  idCounter += 1;
  return `${scope}_${idCounter}_${Date.now().toString(36)}`;
}
