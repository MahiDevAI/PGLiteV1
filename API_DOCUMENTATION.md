# ChargePay API Documentation

## Overview

ChargePay is a UPI QR-based payment gateway. This document describes the API endpoints for integration.

---

## Authentication

### API Key Authentication
For order creation and management:
```
Authorization: Bearer <STATIC_API_KEY>
```

### Listener Token Authentication
For the Android notification listener app:
```
Authorization: Bearer <LISTENER_TOKEN>
```

### Domain Whitelisting
Alternatively, requests from whitelisted domains are allowed without API key.

---

## Mobile Listener API (For Android App)

### POST /api/notifications

**Purpose:** Receive payment notifications from the Android listener app.

**Authentication:** Bearer token (Listener Token from Settings)

**Request:**
```json
{
  "android.title": "John Doe paid you ₹100.00",
  "android.text": "1234567890",
  "android.bigText": "1234567890"
}
```

**Response Success (Payment Matched):**
```json
{
  "status": "completed",
  "message": "Payment processed successfully",
  "orderId": "1234567890"
}
```

**Response (Late Payment):**
```json
{
  "status": "expired",
  "message": "Payment received but order expired",
  "orderId": "1234567890"
}
```

**Response (Unmapped):**
```json
{
  "status": "unmapped",
  "message": "No order_id found in notification"
}
```

**How it works:**
1. Android app monitors UPI payment notifications
2. Extracts notification text containing 10-digit order ID
3. Posts to this endpoint with listener token
4. Server matches order ID and updates status

---

## Order Management API

### POST /api/orders

**Purpose:** Create a new payment order with QR code.

**Authentication:** API Key or Whitelisted Domain

**Request:**
```json
{
  "amount": 100,
  "customerName": "John Doe",
  "customerMobile": "9876543210",
  "metadata": { "invoiceId": "INV-001" }
}
```

**Response:**
```json
{
  "orderId": "1234567890",
  "qrImageUrl": "/uploads/qr/1234567890.png",
  "qrPageUrl": "/pay/1234567890",
  "status": "PENDING",
  "amount": 100,
  "createdAt": "2025-12-03T06:54:43.935Z"
}
```

### GET /api/orders

**Purpose:** List all orders.

**Response:** Array of order objects.

### GET /api/orders/:orderId

**Purpose:** Get single order details.

---

## Transactions API

### GET /api/transactions

**Purpose:** List all completed transactions.

**Response:**
```json
[
  {
    "id": 1,
    "orderId": "1234567890",
    "payerName": "John Doe",
    "notificationJson": { ... },
    "isLatePayment": false,
    "createdAt": "2025-12-03T06:55:16.240Z"
  }
]
```

---

## Unmapped Notifications API

### GET /api/unmapped-notifications

**Purpose:** List notifications that couldn't be matched to any order.

---

## Settings API

### GET /api/settings

**Purpose:** Get current system settings (tokens are partially masked).

### POST /api/settings/regenerate-api-key

**Purpose:** Generate new static API key.

### POST /api/settings/regenerate-listener-token

**Purpose:** Generate new listener token for Android app.

### POST /api/settings/domains

**Purpose:** Add domain to whitelist.
```json
{ "domain": "https://example.com" }
```

### DELETE /api/settings/domains

**Purpose:** Remove domain from whitelist.
```json
{ "domain": "https://example.com" }
```

---

## Dashboard API

### GET /api/dashboard/stats

**Purpose:** Get dashboard statistics.

**Response:**
```json
{
  "totalRevenue": 1000,
  "activeOrders": 5,
  "completedOrders": 50,
  "totalOrders": 60
}
```

---

## Order Lifecycle

| Status | Description |
|--------|-------------|
| PENDING | Order created, waiting for payment (2 min timeout) |
| COMPLETED | Payment received within timeout |
| EXPIRED | Payment received after timeout (late payment) |

---

## Integration Guide for Android Listener

1. Get the **Listener Token** from Settings page
2. Monitor UPI app notifications on device
3. Extract notification title and text
4. POST to `/api/notifications` with the token
5. The 10-digit order ID in notification text is used to match orders

**Example Android Code:**
```kotlin
val notification = mapOf(
    "android.title" to "John Doe paid you ₹100.00",
    "android.text" to "1234567890",
    "android.bigText" to "1234567890"
)

val request = Request.Builder()
    .url("https://your-domain.com/api/notifications")
    .addHeader("Authorization", "Bearer $listenerToken")
    .post(notification.toJson().toRequestBody())
    .build()
```
