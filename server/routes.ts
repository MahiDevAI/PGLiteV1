import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema } from "@shared/schema";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

const ORDER_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

// Authorization middleware
async function authorizeRequest(req: Request, res: Response, next: NextFunction) {
  const settings = await storage.getSettings();
  if (!settings) {
    return res.status(500).json({ error: "System not initialized" });
  }

  // Check for API key in Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token === settings.staticApiKey) {
      return next();
    }
  }

  // Check for whitelisted origin
  const origin = req.headers.origin;
  if (origin && settings.allowedDomains.includes(origin)) {
    return next();
  }

  // Allow internal requests (no origin, for dashboard)
  if (!origin && !authHeader) {
    return next();
  }

  return res.status(403).json({ error: "Unauthorized: Invalid API key or domain not whitelisted" });
}

// Listener authorization middleware
async function authorizeListener(req: Request, res: Response, next: NextFunction) {
  const settings = await storage.getSettings();
  if (!settings) {
    return res.status(500).json({ error: "System not initialized" });
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token === settings.listenerToken) {
      return next();
    }
  }

  return res.status(403).json({ error: "Unauthorized: Invalid listener token" });
}

// Build UPI payload string
function buildUpiPayload(upiId: string, merchantName: string, amount: number, orderId: string): string {
  const params = new URLSearchParams({
    pa: upiId,
    pn: merchantName,
    am: amount.toString(),
    tr: orderId,
    tn: orderId,
  });
  return `upi://pay?${params.toString()}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads", "qr");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Initialize settings on startup
  await storage.initializeSettings();

  // Serve QR images
  app.use("/uploads", (req, res, next) => {
    const filePath = path.join(process.cwd(), "uploads", req.path);
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ error: "File not found" });
    }
  });

  // ============ ORDERS API ============

  // Get all orders
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Get single order
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const order = await storage.getOrderByOrderId(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  // Create order (FR-3)
  app.post("/api/orders", authorizeRequest, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(500).json({ error: "System not initialized" });
      }

      // Validate request body
      const parseResult = insertOrderSchema.safeParse({
        ...req.body,
        receiverUpiId: req.body.receiverUpiId || settings.merchantUpiId,
      });

      if (!parseResult.success) {
        return res.status(400).json({ 
          error: "Invalid request body", 
          details: parseResult.error.issues 
        });
      }

      // Create order
      const order = await storage.createOrder(parseResult.data);

      // Generate UPI payload
      const upiPayload = buildUpiPayload(
        order.receiverUpiId,
        settings.merchantName,
        order.amount / 100, // Convert paise to rupees if storing in paise
        order.orderId
      );

      // Generate QR code
      const qrFilePath = path.join(uploadsDir, `${order.orderId}.png`);
      await QRCode.toFile(qrFilePath, upiPayload, {
        width: 512,
        margin: 4,
        errorCorrectionLevel: "M",
      });

      res.status(201).json({
        orderId: order.orderId,
        qrImageUrl: order.qrPath,
        qrPageUrl: order.qrPageUrl,
        status: order.status,
        amount: order.amount,
        createdAt: order.createdAt,
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // ============ NOTIFICATIONS API (FR-11, FR-12, FR-13) ============

  app.post("/api/notifications", authorizeListener, async (req, res) => {
    try {
      const notification = req.body;
      
      // Extract order_id using regex (FR-12)
      const textToSearch = notification["android.bigText"] || notification["android.text"] || "";
      const orderIdMatch = textToSearch.match(/(\d{10})/);
      
      if (!orderIdMatch) {
        // Case C: No order_id found - save to unmapped
        await storage.createUnmappedNotification({ notificationJson: notification });
        return res.json({ status: "unmapped", message: "No order_id found in notification" });
      }

      const orderId = orderIdMatch[1];
      const order = await storage.getOrderByOrderId(orderId);

      if (!order) {
        // Case C: Order not found
        await storage.createUnmappedNotification({ notificationJson: notification });
        return res.json({ status: "unmapped", message: "Order not found" });
      }

      // Check if order has already been processed
      if (order.status === "COMPLETED") {
        return res.json({ status: "duplicate", message: "Order already completed" });
      }

      // Extract payer name from notification title
      const title = notification["android.title"] || "";
      const payerNameMatch = title.match(/^(.+?)\s+paid/i);
      const payerName = payerNameMatch ? payerNameMatch[1] : "Unknown";

      // Check if payment is late (FR-5)
      const orderCreatedAt = new Date(order.createdAt).getTime();
      const now = Date.now();
      const isLate = now - orderCreatedAt > ORDER_TIMEOUT_MS;

      // Create transaction record (FR-14)
      await storage.createTransaction({
        orderId: order.orderId,
        payerName,
        notificationJson: notification,
        isLatePayment: isLate,
      });

      // Update order status
      if (isLate) {
        // Case B: Payment received after timeout
        await storage.updateOrderStatus(orderId, "EXPIRED");
        return res.json({ status: "expired", message: "Payment received but order expired", orderId });
      } else {
        // Case A: Payment received within time
        await storage.updateOrderStatus(orderId, "COMPLETED");
        return res.json({ status: "completed", message: "Payment processed successfully", orderId });
      }
    } catch (error) {
      console.error("Error processing notification:", error);
      res.status(500).json({ error: "Failed to process notification" });
    }
  });

  // ============ TRANSACTIONS API ============

  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // ============ UNMAPPED NOTIFICATIONS API ============

  app.get("/api/unmapped-notifications", async (req, res) => {
    try {
      const unmapped = await storage.getUnmappedNotifications();
      res.json(unmapped);
    } catch (error) {
      console.error("Error fetching unmapped notifications:", error);
      res.status(500).json({ error: "Failed to fetch unmapped notifications" });
    }
  });

  // ============ SETTINGS API ============

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(404).json({ error: "Settings not found" });
      }
      // Don't expose full tokens, only partial
      res.json({
        staticApiKey: settings.staticApiKey.substring(0, 12) + "..." + settings.staticApiKey.slice(-4),
        listenerToken: settings.listenerToken.substring(0, 8) + "..." + settings.listenerToken.slice(-4),
        allowedDomains: settings.allowedDomains,
        merchantUpiId: settings.merchantUpiId,
        merchantName: settings.merchantName,
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings/regenerate-api-key", async (req, res) => {
    try {
      const newKey = await storage.regenerateApiKey();
      res.json({ staticApiKey: newKey });
    } catch (error) {
      console.error("Error regenerating API key:", error);
      res.status(500).json({ error: "Failed to regenerate API key" });
    }
  });

  app.post("/api/settings/regenerate-listener-token", async (req, res) => {
    try {
      const newToken = await storage.regenerateListenerToken();
      res.json({ listenerToken: newToken });
    } catch (error) {
      console.error("Error regenerating listener token:", error);
      res.status(500).json({ error: "Failed to regenerate listener token" });
    }
  });

  app.post("/api/settings/domains", async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }
      const settings = await storage.addAllowedDomain(domain);
      res.json({ allowedDomains: settings?.allowedDomains || [] });
    } catch (error) {
      console.error("Error adding domain:", error);
      res.status(500).json({ error: "Failed to add domain" });
    }
  });

  app.delete("/api/settings/domains", async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain) {
        return res.status(400).json({ error: "Domain is required" });
      }
      const settings = await storage.removeAllowedDomain(domain);
      res.json({ allowedDomains: settings?.allowedDomains || [] });
    } catch (error) {
      console.error("Error removing domain:", error);
      res.status(500).json({ error: "Failed to remove domain" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const { merchantUpiId, merchantName } = req.body;
      const updates: Record<string, string> = {};
      
      if (merchantUpiId) updates.merchantUpiId = merchantUpiId;
      if (merchantName) updates.merchantName = merchantName;

      const settings = await storage.updateSettings(updates);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ============ DASHBOARD STATS API ============

  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  return httpServer;
}
