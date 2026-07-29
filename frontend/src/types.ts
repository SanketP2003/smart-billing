export type Role = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  gstNumber?: string;
  stateCode?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category?: string;
  price: number;
  stock: number;
  gstRate: number;
  lowStockThreshold: number;
  createdAt: string;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  gstRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  items: InvoiceItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'CANCELLED';
  paymentMethod?: string;
  createdAt: string;
  createdBy: string;
}
