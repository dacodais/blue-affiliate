export interface AffiliateProfile {
  id: string;
  name: string;
  email: string;
  affiliateLink: string;
  commissionPercent: number;
}

export interface LoginResponse {
  token: string;
  affiliate: AffiliateProfile;
}

export interface DashboardSummary {
  totalBookings: { value: number; changePercent: number };
  totalRevenue: { value: number; changePercent: number };
  expectedCommission: { value: number; changePercent: number };
  totalClicks: { value: number; conversionPercent: number; changePercent: number; conversionChangePercent: number };
  bookingTypeDistribution: { standard: number; premium: number; luxury: number };
  topCars: { rank: number; model: string }[];
  allRentalsEnded: boolean;
}

export interface DailyDataPoint {
  date: string;
  value: number;
}

export interface EngagementData {
  clicksPerDay: DailyDataPoint[];
  bookingsPerDay: DailyDataPoint[];
}

export interface RentalsData {
  upcomingByPickupDate: DailyDataPoint[];
  completedByDropoffDate: DailyDataPoint[];
}

export type PayoutStatus = "pending" | "approved" | "paid" | "rejected";

export interface PayoutRecord {
  id: string;
  requestDate: string;
  amount: number;
  status: PayoutStatus;
  paidDate: string | null;
}

export interface PayoutsData {
  availableBalance: number;
  pendingAmount: number;
  confirmedMonths: number;
  history: PayoutRecord[];
}

export type CommissionMonthStatus = "confirmed" | "pending";

export interface IndividualRental {
  id: string;
  startDate: string; // ISO date, e.g. "2026-02-01"
  endDate: string; // ISO date
  carModel: string;
  revenue: number; // integer ISK, excl. VAT
  ratePercent: number;
  commission: number; // integer ISK, excl. VAT
}

export interface CommissionMonth {
  id: string; // stable slug, e.g. "2026-02"
  monthStart: string; // ISO date of the first day, e.g. "2026-02-01"
  status: CommissionMonthStatus;
  deliveriesClosed: number;
  deliveriesTotal: number;
  commission: number; // integer ISK, excl. VAT
  rentals?: IndividualRental[]; // present on confirmed months only
}

export interface BankAccount {
  holderName: string;
  bankName: string;
  iban: string;
  swift: string | null;
}

export interface UpdateBankAccountInput {
  holderName: string;
  bankName: string;
  iban: string;
  swift?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  createdAt: string; // RFC3339 UTC
  read: boolean;
}

export interface SubIdPerformanceRow {
  subId: string;
  source: string;
  medium: string;
  campaign: string;
  clicks: number;
  bookings: number | null; // null until booking attribution ships upstream
  conversionPercent: number | null;
  revenue: number | null;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}
