/**
 * ChargePay Configuration
 * 
 * Edit this file to configure your deployment settings.
 * These values can also be overridden via environment variables.
 */

export const config = {
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL || "",
  },

  // Server Configuration
  server: {
    port: parseInt(process.env.PORT || "5000", 10),
    host: process.env.HOST || "0.0.0.0",
  },

  // Merchant Configuration (Default values, can be updated via Settings API)
  merchant: {
    defaultUpiId: process.env.MERCHANT_UPI_ID || "merchant@upi",
    defaultName: process.env.MERCHANT_NAME || "ChargePay Merchant",
  },

  // Order Configuration
  orders: {
    timeoutMinutes: parseInt(process.env.ORDER_TIMEOUT_MINUTES || "2", 10),
  },

  // Domain Whitelist (Initial domains, more can be added via Settings API)
  // Add domains that should be allowed to create orders via API
  initialAllowedDomains: (process.env.ALLOWED_DOMAINS || "")
    .split(",")
    .map(d => d.trim())
    .filter(Boolean),

  // Security
  security: {
    // Set to true in production to require API key for all external requests
    requireApiKey: process.env.REQUIRE_API_KEY === "true",
  },

  // QR Code Generation
  qrCode: {
    width: 512,
    margin: 4,
    errorCorrectionLevel: "M" as const,
  },

  // Public URL for payment pages (used when generating QR page URLs)
  publicUrl: process.env.PUBLIC_URL || process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
    : "http://localhost:5000",
};

export type Config = typeof config;
