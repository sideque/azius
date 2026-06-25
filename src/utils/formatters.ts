import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd MMM yyyy, hh:mm a');
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const prefix = 'INV';
  const datePart = format(now, 'yyyyMMdd');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${datePart}-${random}`;
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const prefix = 'RCP';
  const datePart = format(now, 'yyyyMMdd');
  const random = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${datePart}-${random}`;
}

export function toISOString(date?: Date): string {
  return (date ?? new Date()).toISOString();
}

export function getDateRange(period: 'daily' | 'monthly' | 'yearly' | 'custom', start?: string, end?: string) {
  const now = new Date();
  let startDate: Date;
  let endDate: Date = now;

  switch (period) {
    case 'daily':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'custom':
      startDate = start ? parseISO(start) : new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = end ? parseISO(end) : now;
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
}
