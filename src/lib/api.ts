import type {
  BankAccount,
  CommissionMonth,
  DashboardSummary,
  EngagementData,
  LoginResponse,
  Notification,
  PayoutRecord,
  PayoutsData,
  RentalsData,
  SubIdPerformanceRow,
  UpdateBankAccountInput,
} from "@/types/api";

const API_BASE = "/api";

// Paths below deliberately carry NO trailing slash: blue-api mounts each router
// at the bare path (`/affiliate/payouts` etc.), and Next's rewrite answers the
// slashed form with a 308 — costing an extra round trip on every call.

class ApiClientError extends Error {
  code: string;
  /** HTTP status, or 0 when the request never got an answer (offline, DNS, etc.). */
  status: number;
  /** blue-api's requestId — lets support find the request in the server logs. */
  requestId?: string;

  constructor(message: string, code: string, status: number, requestId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

/** What to show an affiliate when a request fails. */
export interface UserFacingError {
  message: string;
  /** Quote this to support; it is blue-api's requestId. */
  reference?: string;
}

export const SUPPORT_EMAIL = "affiliates@bluecarrental.is";

const GENERIC_ERROR = "Something went wrong on our side. Please try again in a few minutes.";

// Server-side failures carry developer-facing messages ("Internal Server Error",
// "The booking system timed out") — affiliates get these instead.
const MESSAGES_BY_CODE: Record<string, string> = {
  UPSTREAM_TIMEOUT: "Our booking system is responding slowly right now. Please try again in a minute.",
  VENDOR_UNAVAILABLE: "We can't reach our booking system right now. Please try again in a few minutes.",
  RATE_LIMIT_EXCEEDED: "Too many requests in a short time. Please wait a moment and try again.",
  NETWORK_ERROR: "We couldn't reach the server. Check your internet connection and try again.",
};

/**
 * Turns any thrown error into something an affiliate can act on.
 *
 * 4xx answers (wrong password, payout below the minimum, …) are written for the
 * user by blue-api, so their message is kept. Everything else — 5xx, timeouts,
 * network failures, bugs — becomes plain language, with `fallback` used for the
 * generic case so a page can say what it was trying to do.
 */
export function toUserFacingError(err: unknown, fallback = GENERIC_ERROR): UserFacingError {
  if (!(err instanceof ApiClientError)) return { message: fallback };
  const reference = err.requestId;
  const known = MESSAGES_BY_CODE[err.code];
  if (known) return { message: known, reference };
  if (err.status >= 400 && err.status < 500) return { message: err.message, reference };
  return { message: fallback, reference };
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("affiliate_token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/v1/affiliate${path}`, {
      ...options,
      headers,
    });
  } catch (err) {
    throw new ApiClientError(err instanceof Error ? err.message : "Network error", "NETWORK_ERROR", 0);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message ?? `Request failed (${res.status})`;
    const code = body?.error?.code ?? "UNKNOWN";
    throw new ApiClientError(message, code, res.status, body?.error?.requestId);
  }

  return res.json() as Promise<T>;
}

async function requestData<T>(path: string, options: RequestInit = {}): Promise<T> {
  const envelope = await request<{ data: T }>(path, options);
  return envelope.data;
}

export interface DateRange {
  from: string;
  to: string;
}

function dateRangeQuery(range: DateRange): string {
  return `?from=${range.from}&to=${range.to}`;
}

export const api = {
  login(email: string, password: string, rememberMe: boolean = false): Promise<LoginResponse> {
    return request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, rememberMe }),
    });
  },

  forgotPassword(email: string): Promise<{ message: string }> {
    return request<{ message: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(token: string, password: string): Promise<{ message: string }> {
    return request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
  },

  getDashboard(range: DateRange, basis?: "created" | "starts"): Promise<DashboardSummary> {
    const query = `${dateRangeQuery(range)}${basis ? `&basis=${basis}` : ""}`;
    return requestData<DashboardSummary>(`/dashboard${query}`);
  },

  getEngagement(range: DateRange): Promise<EngagementData> {
    return requestData<EngagementData>(`/performance/engagement${dateRangeQuery(range)}`);
  },

  getRentals(range: DateRange): Promise<RentalsData> {
    return requestData<RentalsData>(`/performance/rentals${dateRangeQuery(range)}`);
  },

  getPayouts(): Promise<PayoutsData> {
    return requestData<PayoutsData>("/payouts");
  },

  /**
   * Standalone commission months. `getPayouts()` already embeds this list, so the
   * Request Payout page must not call both — each one triggers the same 12-month
   * Caren crawl (~3s per page of results) on a cache miss.
   */
  async getPayoutMonths(): Promise<CommissionMonth[]> {
    const { months } = await requestData<{ months: CommissionMonth[] }>("/payouts/months");
    return months;
  },

  requestPayout(monthIds: string[]): Promise<PayoutRecord> {
    return requestData<PayoutRecord>("/payouts/request", {
      method: "POST",
      body: JSON.stringify({ monthIds }),
    });
  },

  getSubIdPerformance(range: DateRange): Promise<SubIdPerformanceRow[]> {
    return requestData<SubIdPerformanceRow[]>(`/performance/sub-ids${dateRangeQuery(range)}`);
  },

  getBankAccount(): Promise<BankAccount | null> {
    return requestData<BankAccount | null>("/bank-account");
  },

  updateBankAccount(input: UpdateBankAccountInput): Promise<BankAccount> {
    return requestData<BankAccount>("/bank-account", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  getNotifications(): Promise<Notification[]> {
    return requestData<Notification[]>("/notifications");
  },

  markAllNotificationsRead(): Promise<{ updated: number }> {
    return requestData<{ updated: number }>("/notifications/mark-all-read", {
      method: "POST",
    });
  },

  markNotificationRead(id: string): Promise<{ success: boolean }> {
    return requestData<{ success: boolean }>(`/notifications/${id}/read`, {
      method: "POST",
    });
  },
};

export { ApiClientError };
