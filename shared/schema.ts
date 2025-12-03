import { pgTable, text, integer, serial, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  amount: integer("amount").notNull(),
  customerName: text("customer_name"),
  customerMobile: text("customer_mobile"),
  receiverUpiId: text("receiver_upi_id").notNull(),
  status: text("status").notNull().default("PENDING"),
  qrPath: text("qr_path"),
  qrPageUrl: text("qr_page_url"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  pendingAt: timestamp("pending_at"),
  completedAt: timestamp("completed_at"),
  expiredAt: timestamp("expired_at"),
});

export const insertOrderSchema = createInsertSchema(orders, {
  amount: z.number().positive(),
  receiverUpiId: z.string().min(1),
  customerName: z.string().optional(),
  customerMobile: z.string().optional(),
  metadata: z.record(z.any()).optional(),
}).omit({
  id: true,
  orderId: true,
  status: true,
  qrPath: true,
  qrPageUrl: true,
  createdAt: true,
  pendingAt: true,
  completedAt: true,
  expiredAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  orderId: text("order_id").notNull(),
  payerName: text("payer_name").notNull(),
  notificationJson: jsonb("notification_json").notNull(),
  isLatePayment: boolean("is_late_payment").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  orderId: z.string().min(1),
  payerName: z.string().min(1),
  notificationJson: z.record(z.any()),
  isLatePayment: z.boolean(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export const unmappedNotifications = pgTable("unmapped_notifications", {
  id: serial("id").primaryKey(),
  notificationJson: jsonb("notification_json").notNull(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});

export const insertUnmappedNotificationSchema = createInsertSchema(unmappedNotifications, {
  notificationJson: z.record(z.any()),
}).omit({
  id: true,
  receivedAt: true,
});

export type InsertUnmappedNotification = z.infer<typeof insertUnmappedNotificationSchema>;
export type UnmappedNotification = typeof unmappedNotifications.$inferSelect;

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  staticApiKey: text("static_api_key").notNull(),
  listenerToken: text("listener_token").notNull(),
  allowedDomains: text("allowed_domains").array().notNull().default([]),
  merchantUpiId: text("merchant_upi_id").notNull().default("merchant@upi"),
  merchantName: text("merchant_name").notNull().default("ChargePay Merchant"),
});

export const insertSettingsSchema = createInsertSchema(settings, {
  staticApiKey: z.string().min(1),
  listenerToken: z.string().min(1),
  allowedDomains: z.array(z.string()).default([]),
  merchantUpiId: z.string().min(1),
  merchantName: z.string().min(1),
}).omit({
  id: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;
