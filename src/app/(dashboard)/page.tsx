"use client";

import { useCallback, useEffect, useState } from "react";
import Banner from "@/components/Banner";
import BookingTypesDistribution from "@/components/BookingTypesDistribution";
import { IconComponent } from "@/components/Icon";
import PeriodFilter from "@/components/PeriodFilter";
import StatsGrid from "@/components/StatsGrid";
import Table, { type Column } from "@/components/Table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getDefaultPeriod, periodToDateRange } from "@/lib/dates";
import { formatPrice } from "@/lib/utils";
import type { DashboardSummary } from "@/types/api";
import type { StatCard } from "@/types/data";

interface TopCarRow {
  rank: number;
  model: string;
}

const topCarsColumns: Column<TopCarRow>[] = [
  {
    id: "rank",
    header: "Rank",
    render: (row) => (
      <span className="inline-flex items-center justify-center size-8 rounded-full bg-secondary-muted text-secondary">
        {row.rank}
      </span>
    ),
  },
  { id: "model", header: "Car Model", accessor: "model" },
];

function changeSubtext(changePercent: number): { subtext: string; subtextColor: "green" | "red" } {
  const sign = changePercent >= 0 ? "+" : "";
  return {
    subtext: `${sign}${changePercent.toFixed(1)}% from last month`,
    subtextColor: changePercent >= 0 ? "green" : "red",
  };
}

function buildBookingStats(data: DashboardSummary): StatCard[] {
  const bookingsChange = changeSubtext(data.totalBookings.changePercent);
  const revenueChange = changeSubtext(data.totalRevenue.changePercent);
  const commissionChange = changeSubtext(data.expectedCommission.changePercent);
  const clicksChange = changeSubtext(data.totalClicks.changePercent);

  return [
    {
      label: "Total Bookings",
      value: data.totalBookings.value.toLocaleString(),
      subtext: bookingsChange.subtext,
      subtextColor: bookingsChange.subtextColor,
    },
    {
      label: "Total Revenue",
      value: formatPrice(data.totalRevenue.value),
      subtext: revenueChange.subtext,
      subtextColor: revenueChange.subtextColor,
    },
    {
      label: "Expected Commission",
      value: formatPrice(data.expectedCommission.value),
      valueSuffix: "Excl. VAT",
      subtext: commissionChange.subtext,
      subtextColor: commissionChange.subtextColor,
      info: "Your projected commission based on confirmed bookings in the selected period. Final amounts are confirmed once all deliveries are closed.",
    },
    {
      label: "Total Clicks",
      value: data.totalClicks.value.toLocaleString(),
      subtext: clicksChange.subtext,
      subtextColor: clicksChange.subtextColor,
    },
  ];
}

function buildDeliveryStats(data: DashboardSummary): StatCard[] {
  const bookingsChange = changeSubtext(data.totalBookings.changePercent);
  const revenueChange = changeSubtext(data.totalRevenue.changePercent);
  const commissionChange = changeSubtext(data.expectedCommission.changePercent);

  return [
    {
      label: "Total Deliveries",
      value: data.totalBookings.value.toLocaleString(),
      subtext: bookingsChange.subtext,
      subtextColor: bookingsChange.subtextColor,
    },
    {
      label: "Total Revenue",
      value: formatPrice(data.totalRevenue.value),
      subtext: revenueChange.subtext,
      subtextColor: revenueChange.subtextColor,
    },
    data.allRentalsEnded
      ? {
          label: "Total Commission",
          value: formatPrice(data.expectedCommission.value),
          valueSuffix: "Excl. VAT",
          subtext: commissionChange.subtext,
          subtextColor: commissionChange.subtextColor,
        }
      : {
          label: "Expected Commission",
          value: formatPrice(data.expectedCommission.value),
          valueSuffix: "Excl. VAT",
          subtext: commissionChange.subtext,
          subtextColor: commissionChange.subtextColor,
          info: "Your projected commission based on confirmed bookings in the selected period. Final amounts are confirmed once all deliveries are closed.",
        },
  ];
}

export default function Home() {
  const { affiliate } = useAuth();
  const [period, setPeriod] = useState(getDefaultPeriod());
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchData = useCallback(async (p: string) => {
    setIsFetching(true);
    setError(null);
    try {
      const range = periodToDateRange(p);
      const result = await api.getDashboard(range);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  if (!data && error) {
    return (
      <Banner level="error" message={error} items={["Please try again or contact support if the issue persists."]} />
    );
  }

  const isInitialLoad = !data;

  return (
    <Tabs defaultValue="booking-data" className="w-full">
      <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2 mb-4 sm:mb-8">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="booking-data">Booking Data</TabsTrigger>
          <TabsTrigger value="delivery-data">Delivery Data</TabsTrigger>
        </TabsList>

        <PeriodFilter value={period} onValueChange={setPeriod} />

        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#eff6ff] border border-[#bedbff] sm:ml-auto">
          <IconComponent icon="Info" className="text-primary shrink-0" />
          <p className="text-sm font-bold text-[#1c398e]">
            Your commission is {affiliate?.commissionPercent != null ? `${affiliate.commissionPercent}%` : "—"}
          </p>
        </div>
      </div>

      <TabsContent value="booking-data">
        <div className="space-y-6">
          <StatsGrid
            stats={data ? buildBookingStats(data) : placeholderBookingStats}
            loading={isInitialLoad || isFetching}
          />

          {data ? (
            <BookingTypesDistribution distribution={data.bookingTypeDistribution} />
          ) : (
            <BookingTypesDistributionSkeleton />
          )}

          {data ? (
            <Table title="Top 5 Cars" icon="Car" columns={topCarsColumns} data={data.topCars} />
          ) : (
            <TopCarsTableSkeleton />
          )}

          <Banner level="info" message="Number of bookings and revenue may change due to cancellations." />
        </div>
      </TabsContent>
      <TabsContent value="delivery-data">
        <div className="space-y-6">
          <StatsGrid
            stats={data ? buildDeliveryStats(data) : placeholderDeliveryStats}
            loading={isInitialLoad || isFetching}
          />

          {data ? (
            <Table title="Top 5 Cars" icon="Car" columns={topCarsColumns} data={data.topCars} />
          ) : (
            <TopCarsTableSkeleton />
          )}

          <Banner
            level="info"
            message="Total Revenue, Total Commission, and Total Bookings are not confirmed values until the month has ended"
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}

const placeholderBookingStats: StatCard[] = [
  { label: "Total Bookings", value: "", subtext: "" },
  { label: "Total Revenue", value: "", subtext: "" },
  { label: "Expected Commission", value: "", subtext: "" },
  { label: "Total Clicks", value: "", subtext: "" },
];

const placeholderDeliveryStats: StatCard[] = [
  { label: "Total Deliveries", value: "", subtext: "" },
  { label: "Total Revenue", value: "", subtext: "" },
  { label: "Expected Commission", value: "", subtext: "" },
];

function BookingTypesDistributionSkeleton() {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-lg px-6 pt-6 pb-6 flex flex-col gap-6 animate-pulse">
      <div className="h-6 w-56 bg-muted rounded" />
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-4 w-16 bg-muted rounded" />
            </div>
            <div className="h-2 bg-muted rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TopCarsTableSkeleton() {
  return (
    <div className="bg-card border border-light-gray rounded-lg px-6 pt-6 pb-px flex flex-col gap-6 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="size-5 bg-muted rounded" />
        <div className="h-6 w-24 bg-muted rounded" />
      </div>
      <div>
        <div className="border-b border-light-gray flex gap-4 px-4 py-3">
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-[#f3f4f6] flex items-center gap-4 px-4 py-4">
            <div className="size-8 bg-muted rounded-full" />
            <div className="h-4 w-40 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
