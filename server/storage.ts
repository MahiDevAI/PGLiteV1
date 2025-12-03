import { 
  type Order, type InsertOrder,
  type Transaction, type InsertTransaction,
  type UnmappedNotification, type InsertUnmappedNotification,
  type Settings, type InsertSettings,
  orders, transactions, unmappedNotifications, settings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface IStorage {
  // Orders
  getOrders(): Promise<Order[]>;
  getOrderByOrderId(orderId: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(orderId: string, status: string, timestamp?: Date): Promise<Order | undefined>;

  // Transactions
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;

  // Unmapped Notifications
  getUnmappedNotifications(): Promise<UnmappedNotification[]>;
  createUnmappedNotification(notification: InsertUnmappedNotification): Promise<UnmappedNotification>;

  // Settings
  getSettings(): Promise<Settings | undefined>;
  initializeSettings(): Promise<Settings>;
  updateSettings(updates: Partial<InsertSettings>): Promise<Settings | undefined>;
  regenerateApiKey(): Promise<string>;
  regenerateListenerToken(): Promise<string>;
  addAllowedDomain(domain: string): Promise<Settings | undefined>;
  removeAllowedDomain(domain: string): Promise<Settings | undefined>;

  // Dashboard Stats
  getDashboardStats(): Promise<{
    totalRevenue: number;
    activeOrders: number;
    completedOrders: number;
    totalOrders: number;
  }>;
}

function generateOrderId(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

export class DatabaseStorage implements IStorage {
  // Orders
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderByOrderId(orderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderId, orderId));
    return order;
  }

  async createOrder(orderData: InsertOrder): Promise<Order> {
    const orderId = generateOrderId();
    const qrPageUrl = `/pay/${orderId}`;
    const qrPath = `/uploads/qr/${orderId}.png`;

    const [order] = await db.insert(orders).values({
      ...orderData,
      orderId,
      qrPath,
      qrPageUrl,
      status: "PENDING",
      pendingAt: new Date(),
    }).returning();

    return order;
  }

  async updateOrderStatus(orderId: string, status: string, timestamp?: Date): Promise<Order | undefined> {
    const updateData: Record<string, unknown> = { status };
    
    if (status === "COMPLETED") {
      updateData.completedAt = timestamp || new Date();
    } else if (status === "EXPIRED") {
      updateData.expiredAt = timestamp || new Date();
    }

    const [order] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.orderId, orderId))
      .returning();
    
    return order;
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [txn] = await db.insert(transactions).values(transaction).returning();
    return txn;
  }

  // Unmapped Notifications
  async getUnmappedNotifications(): Promise<UnmappedNotification[]> {
    return await db.select().from(unmappedNotifications).orderBy(desc(unmappedNotifications.receivedAt));
  }

  async createUnmappedNotification(notification: InsertUnmappedNotification): Promise<UnmappedNotification> {
    const [unmapped] = await db.insert(unmappedNotifications).values(notification).returning();
    return unmapped;
  }

  // Settings
  async getSettings(): Promise<Settings | undefined> {
    const [setting] = await db.select().from(settings);
    return setting;
  }

  async initializeSettings(): Promise<Settings> {
    const existing = await this.getSettings();
    if (existing) return existing;

    const [setting] = await db.insert(settings).values({
      staticApiKey: `pk_live_${generateToken().substring(0, 24)}`,
      listenerToken: `lst_${generateToken().substring(0, 24)}`,
      allowedDomains: [],
      merchantUpiId: "merchant@upi",
      merchantName: "ChargePay Merchant",
    }).returning();

    return setting;
  }

  async updateSettings(updates: Partial<InsertSettings>): Promise<Settings | undefined> {
    const existing = await this.getSettings();
    if (!existing) return undefined;

    const [setting] = await db.update(settings)
      .set(updates)
      .where(eq(settings.id, existing.id))
      .returning();

    return setting;
  }

  async regenerateApiKey(): Promise<string> {
    const newKey = `pk_live_${generateToken().substring(0, 24)}`;
    await this.updateSettings({ staticApiKey: newKey });
    return newKey;
  }

  async regenerateListenerToken(): Promise<string> {
    const newToken = `lst_${generateToken().substring(0, 24)}`;
    await this.updateSettings({ listenerToken: newToken });
    return newToken;
  }

  async addAllowedDomain(domain: string): Promise<Settings | undefined> {
    const existing = await this.getSettings();
    if (!existing) return undefined;

    const domains = [...(existing.allowedDomains || [])];
    if (!domains.includes(domain)) {
      domains.push(domain);
    }

    return await this.updateSettings({ allowedDomains: domains });
  }

  async removeAllowedDomain(domain: string): Promise<Settings | undefined> {
    const existing = await this.getSettings();
    if (!existing) return undefined;

    const domains = (existing.allowedDomains || []).filter(d => d !== domain);
    return await this.updateSettings({ allowedDomains: domains });
  }

  // Dashboard Stats
  async getDashboardStats(): Promise<{
    totalRevenue: number;
    activeOrders: number;
    completedOrders: number;
    totalOrders: number;
  }> {
    const allOrders = await this.getOrders();
    const completed = allOrders.filter(o => o.status === "COMPLETED");
    const pending = allOrders.filter(o => o.status === "PENDING");

    const totalRevenue = completed.reduce((sum, o) => sum + o.amount, 0);

    return {
      totalRevenue,
      activeOrders: pending.length,
      completedOrders: completed.length,
      totalOrders: allOrders.length,
    };
  }
}

export const storage = new DatabaseStorage();
