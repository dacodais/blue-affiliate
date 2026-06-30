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

class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
  }
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

  const res = await fetch(`${API_BASE}/v1/affiliate${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = body?.error?.message ?? `Request failed (${res.status})`;
    const code = body?.error?.code ?? "UNKNOWN";
    throw new ApiClientError(message, code, res.status);
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
    return requestData<DashboardSummary>(`/dashboard/${query}`);
  },

  getEngagement(range: DateRange): Promise<EngagementData> {
    return requestData<EngagementData>(`/performance/engagement/${dateRangeQuery(range)}`);
  },

  getRentals(range: DateRange): Promise<RentalsData> {
    return requestData<RentalsData>(`/performance/rentals/${dateRangeQuery(range)}`);
  },

  getPayouts(): Promise<PayoutsData> {
    return requestData<PayoutsData>("/payouts/");
  },

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
    return requestData<SubIdPerformanceRow[]>(`/performance/sub-ids/${dateRangeQuery(range)}`);
  },

  getBankAccount(): Promise<BankAccount | null> {
    return requestData<BankAccount | null>("/bank-account/");
  },

  updateBankAccount(input: UpdateBankAccountInput): Promise<BankAccount> {
    return requestData<BankAccount>("/bank-account/", {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  getNotifications(): Promise<Notification[]> {
    return requestData<Notification[]>("/notifications/");
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
