import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Mock Data Types
export type OrderStatus = 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED';

export interface Order {
  id: string;
  amount: number;
  customerName?: string;
  status: OrderStatus;
  createdAt: string;
  expiresAt: string;
  upiId: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  payerName: string;
  amount: number;
  timestamp: string;
  isLate: boolean;
}

// Mock Database
class MockDB {
  private orders: Order[] = [];
  private transactions: Transaction[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    // Seed some data
    this.createOrder(500, "Alice User");
    this.createOrder(150, "Bob User");
    
    // Mark one as completed
    const completedOrder = this.orders[1];
    if (completedOrder) {
      this.completeOrder(completedOrder.id, "Bob User", 150);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  getOrders() {
    return [...this.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrder(id: string) {
    return this.orders.find(o => o.id === id);
  }

  getTransactions() {
    return [...this.transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  createOrder(amount: number, customerName?: string) {
    const id = Math.floor(1000000000 + Math.random() * 9000000000).toString(); // 10 digit ID
    const now = new Date();
    const expires = new Date(now.getTime() + 2 * 60000); // 2 mins

    const newOrder: Order = {
      id,
      amount,
      customerName,
      status: 'PENDING',
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      upiId: 'merchant@upi'
    };

    this.orders.push(newOrder);
    this.notify();
    return newOrder;
  }

  completeOrder(orderId: string, payerName: string, amount: number) {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return;

    const isLate = new Date() > new Date(order.expiresAt);
    
    order.status = 'COMPLETED'; // In real SRS, late might be handled differently, but for now mark complete
    
    this.transactions.push({
      id: Math.random().toString(36).substr(2, 9),
      orderId,
      payerName,
      amount,
      timestamp: new Date().toISOString(),
      isLate
    });

    this.notify();
  }

  expireOrder(orderId: string) {
    const order = this.orders.find(o => o.id === orderId);
    if (order && order.status === 'PENDING') {
      order.status = 'EXPIRED';
      this.notify();
    }
  }
}

export const db = new MockDB();
