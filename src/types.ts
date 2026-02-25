import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Appointment {
  id: number;
  customer_name: string;
  address: string;
  phone: string;
  date: string;
  service_type?: string;
  status: 'pending' | 'in_progress' | 'completed';
  before_photos: string[];
  after_photos: string[];
  signature?: string;
  price: number;
  payment_method: string;
  installments: number;
}

export interface Financial {
  id: number;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
}

export interface Settings {
  logo?: string;
  theme?: 'light' | 'dark';
}
