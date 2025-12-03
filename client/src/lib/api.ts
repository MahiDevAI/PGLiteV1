import { queryClient } from "./queryClient";

const API_BASE = "/api";

export interface Order {
  id: number;
  orderId: string;
  amount: number;
  customerName: string | null;
  customerMobile: string | null;
  receiverUpiId: string;
  status: string;
  qrPath: string | null;
  qrPageUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  pendingAt: string | null;
  completedAt: string | null;
  expiredAt: string | null;
}

export interface Transaction {
  id: number;
  orderId: string;
  payerName: string;
  notificationJson: Record<string, unknown>;
  isLatePayment: boolean;
  createdAt: string;
}

export interface Settings {
  staticApiKey: string;
  listenerToken: string;
  allowedDomains: string[];
  merchantUpiId: string;
  merchantName: string;
}

export interface DashboardStats {
  totalRevenue: number;
  activeOrders: number;
  completedOrders: number;
  totalOrders: number;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }

  return response.json();
}

// Orders API
export const ordersApi = {
  getAll: () => fetchApi<Order[]>("/orders"),
  
  getOne: (orderId: string) => fetchApi<Order>(`/orders/${orderId}`),
  
  create: async (data: { amount: number; customerName?: string; customerMobile?: string }) => {
    const result = await fetchApi<{
      orderId: string;
      qrImageUrl: string;
      qrPageUrl: string;
      status: string;
      amount: number;
      createdAt: string;
    }>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    return result;
  },
};

// Transactions API
export const transactionsApi = {
  getAll: () => fetchApi<Transaction[]>("/transactions"),
};

// Settings API
export const settingsApi = {
  get: () => fetchApi<Settings>("/settings"),
  
  regenerateApiKey: async () => {
    const result = await fetchApi<{ staticApiKey: string }>("/settings/regenerate-api-key", {
      method: "POST",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    return result;
  },
  
  regenerateListenerToken: async () => {
    const result = await fetchApi<{ listenerToken: string }>("/settings/regenerate-listener-token", {
      method: "POST",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    return result;
  },
  
  addDomain: async (domain: string) => {
    const result = await fetchApi<{ allowedDomains: string[] }>("/settings/domains", {
      method: "POST",
      body: JSON.stringify({ domain }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    return result;
  },
  
  removeDomain: async (domain: string) => {
    const result = await fetchApi<{ allowedDomains: string[] }>("/settings/domains", {
      method: "DELETE",
      body: JSON.stringify({ domain }),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    return result;
  },
  
  update: async (data: { merchantUpiId?: string; merchantName?: string }) => {
    const result = await fetchApi<Settings>("/settings", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    return result;
  },
};

// Dashboard API
export const dashboardApi = {
  getStats: () => fetchApi<DashboardStats>("/dashboard/stats"),
};

// Notifications API (for simulating payments)
export const notificationsApi = {
  send: async (notification: Record<string, string>) => {
    return fetchApi<{ status: string; message: string; orderId?: string }>("/notifications", {
      method: "POST",
      body: JSON.stringify(notification),
    });
  },
};

// Unmapped Notifications API
export interface UnmappedNotification {
  id: number;
  notificationJson: Record<string, unknown>;
  receivedAt: string;
}

export const unmappedNotificationsApi = {
  getAll: () => fetchApi<UnmappedNotification[]>("/unmapped-notifications"),
};
