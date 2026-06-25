export type UserRole = 'admin' | 'sales';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name?: string;
  email?: string;
}

export interface Product {
  id: string;
  productName: string;
  productCode: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  unit: string;
  description: string;
  createdAt: string;
}

export interface Shop {
  id: string;
  shopName: string;
  ownerName: string;
  phoneNumber: string;
  address: string;
  creditLimit: number;
  outstandingBalance: number;
  notes: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  shopId: string;
  subtotal: number;
  discount: number;
  grandTotal: number;
  profit: number;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  rate: number;
  total: number;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer';

export interface Payment {
  id: string;
  shopId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes: string;
  paymentDate: string;
}

export type TransactionType = 'sale' | 'payment';

export interface LedgerEntry {
  id: string;
  shopId: string;
  transactionType: TransactionType;
  referenceNumber: string;
  debit: number;
  credit: number;
  balance: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  rate: number;
  purchasePrice: number;
  stockQuantity: number;
  unit: string;
}

export interface DashboardStats {
  totalShops: number;
  totalProducts: number;
  salesToday: number;
  salesMonth: number;
  salesYear: number;
  profitToday: number;
  profitMonth: number;
  profitYear: number;
  outstandingBalance: number;
  paymentsCollected: number;
}

export interface NotificationItem {
  id: string;
  type: 'low_stock' | 'outstanding' | 'payment_due';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ReportFilter {
  period: 'daily' | 'monthly' | 'yearly' | 'custom';
  startDate?: string;
  endDate?: string;
  shopId?: string;
}

export interface SaleWithDetails extends Sale {
  shopName: string;
  items: (SaleItem & { productName: string })[];
}

export interface PaymentWithShop extends Payment {
  shopName: string;
}
