"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import Banner from "@/components/Banner";
import ErrorBanner from "@/components/ErrorBanner";
import PeriodFilter from "@/components/PeriodFilter";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, toUserFacingError, type UserFacingError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatShortDate, getDefaultPeriod, periodToDateRange } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import type { DashboardSummary, EngagementData, SubIdPerformanceRow } from "@/types/api";

const clicksConfig = {
  clicks: {
    label: "Clicks",
    color: "var(--color-primary)",
  },
} satisfies ChartConfig;

const bookingsConfig = {
  bookings: {
    label: "Bookings",
    color: "var(--color-secondary)",
  },
} satisfies ChartConfig;

type SortKey = keyof SubIdPerformanceRow;
type SortDirection = "asc" | "desc";

function computeAxis(data: { value: number }[]): { domain: [number, number]; ticks: number[] } {
  if (data.length === 0) return { domain: [0, 10], ticks: [0, 5, 10] };
  const max = Math.max(...data.map((d) => d.value));
  const ceiling = Math.max(Math.ceil((max * 1.2) / 5) * 5, 10);
  const step = ceiling / 4;
  return {
    domain: [0, ceiling],
    ticks: [0, step, step * 2, step * 3, ceiling].map(Math.round),
  };
}

export default function PerformancePage() {
  const [period, setPeriod] = useState(getDefaultPeriod());
  const [engagement, setEngagement] = useState<EngagementData | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [subIdRows, setSubIdRows] = useState<SubIdPerformanceRow[] | null>(null);
  const [error, setError] = useState<UserFacingError | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const fetchData = useCallback(async (p: string) => {
    setIsFetching(true);
    setError(null);
    try {
      const range = periodToDateRange(p);
      const [engagementRes, dashboardRes, subIdsRes] = await Promise.all([
        api.getEngagement(range),
        api.getDashboard(range),
        api.getSubIdPerformance(range),
      ]);
      setEngagement(engagementRes);
      setDashboard(dashboardRes);
      setSubIdRows(subIdsRes);
    } catch (err) {
      setError(toUserFacingError(err, "We couldn't load your performance data. Please try again in a few minutes."));
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [period, fetchData]);

  const isInitialLoad = !engagement && !error;

  const chartData = engagement?.clicksPerDay.map((d) => ({ date: formatShortDate(d.date), clicks: d.value }));
  const bookingsData = engagement?.bookingsPerDay.map((d) => ({ date: formatShortDate(d.date), bookings: d.value }));

  const clicksAxis = engagement ? computeAxis(engagement.clicksPerDay) : null;
  const bookingsAxis = engagement ? computeAxis(engagement.bookingsPerDay) : null;

  return (
    <Fragment>
      {error && !engagement && (
        <div className="mb-6">
          <ErrorBanner error={error} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <h1 className="uppercase tracking-[-0.31px] font-heading text-2xl">Performance</h1>

        <PeriodFilter value={period} onValueChange={setPeriod} inputClassName="h-9 sm:ml-auto" />
      </div>

      <PerformanceStats data={dashboard} loading={isInitialLoad} />

      <section>
        {/* Desktop engagement charts */}
        <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {isInitialLoad ? (
            <>
              <ChartSkeleton title="Daily Click Traffic" subtitle="Daily click traffic from affiliate links" />
              <ChartSkeleton title="Daily Bookings" subtitle="New bookings generated through your affiliate links" />
            </>
          ) : chartData && bookingsData && clicksAxis && bookingsAxis ? (
            <>
              <div className="bg-white border border-light-gray rounded-2xl p-6">
                <p className="mb-1.25">Daily Click Traffic</p>
                <p className="text-[#6A7282] text-sm mb-5.25">Daily click traffic from affiliate links</p>
                <ChartContainer config={clicksConfig} className="lg:max-h-64 xl:max-h-80 w-full">
                  <LineChart data={chartData}>
                    <CartesianGrid vertical={false} stroke="var(--color-light-gray)" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#999", fontSize: 11 }}
                      padding={{ left: 0, right: 0 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#999", fontSize: 11 }}
                      domain={clicksAxis.domain}
                      ticks={clicksAxis.ticks}
                      width={32}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </div>
              <div className="bg-white border border-light-gray rounded-2xl p-6">
                <p className="mb-1.25">Daily Bookings</p>
                <p className="text-[#6A7282] text-sm mb-5.25">New bookings generated through your affiliate links</p>
                <ChartContainer config={bookingsConfig} className="lg:max-h-64 xl:max-h-80 w-full">
                  <BarChart data={bookingsData}>
                    <CartesianGrid vertical={false} stroke="var(--color-light-gray)" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#999", fontSize: 11 }}
                      padding={{ left: 0, right: 0 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#999", fontSize: 11 }}
                      domain={bookingsAxis.domain}
                      ticks={bookingsAxis.ticks}
                      width={32}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            </>
          ) : null}
        </div>

        {/* Mobile engagement tabs */}
        <Tabs defaultValue="clicks-per-day" className="w-full block sm:hidden">
          <div className="flex flex-col-reverse sm:flex-row gap-2 mb-4 sm:mb-8">
            <TabsList className="w-full">
              <TabsTrigger value="clicks-per-day">Daily Click Traffic</TabsTrigger>
              <TabsTrigger value="bookings-created">Daily Bookings</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="clicks-per-day">
            {isInitialLoad ? (
              <ChartSkeleton title="Daily Click Traffic" subtitle="Daily click traffic from affiliate links" />
            ) : chartData && clicksAxis ? (
              <div className="bg-white border border-light-gray rounded-2xl p-6">
                <p className="mb-1.25">Daily Click Traffic</p>
                <p className="text-[#6A7282] text-sm mb-5.25">Daily click traffic from affiliate links</p>
                <ChartContainer config={clicksConfig} className="lg:max-h-64 xl:max-h-80 w-full">
                  <LineChart data={chartData}>
                    <CartesianGrid vertical={false} stroke="var(--color-light-gray)" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#999", fontSize: 11 }}
                      padding={{ left: 0, right: 0 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#999", fontSize: 11 }}
                      domain={clicksAxis.domain}
                      ticks={clicksAxis.ticks}
                      width={32}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="clicks" stroke="var(--color-clicks)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </div>
            ) : null}
          </TabsContent>
          <TabsContent value="bookings-created">
            {isInitialLoad ? (
              <ChartSkeleton title="Daily Bookings" subtitle="New bookings generated through your affiliate links" />
            ) : bookingsData && bookingsAxis ? (
              <div className="bg-white border border-light-gray rounded-2xl p-6">
                <p className="mb-1.25">Daily Bookings</p>
                <p className="text-[#6A7282] text-sm mb-5.25">New bookings generated through your affiliate links</p>
                <ChartContainer config={bookingsConfig} className="lg:max-h-64 xl:max-h-80 w-full">
                  <BarChart data={bookingsData}>
                    <CartesianGrid vertical={false} stroke="var(--color-light-gray)" />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#999", fontSize: 11 }}
                      padding={{ left: 0, right: 0 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "#999", fontSize: 11 }}
                      domain={bookingsAxis.domain}
                      ticks={bookingsAxis.ticks}
                      width={32}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              </div>
            ) : null}
          </TabsContent>
        </Tabs>
      </section>

      {/* Hidden when loading failed: the default-link row would otherwise show a made-up 0. */}
      {(subIdRows || isInitialLoad || isFetching) && (
        <LinkPerformance
          rows={subIdRows ?? []}
          totals={dashboard}
          loading={isInitialLoad || (isFetching && !subIdRows)}
          className="mt-6 sm:mt-10 mb-10"
        />
      )}

      <Banner level="info" message="Number of bookings and revenue may change due to cancellations." />
    </Fragment>
  );
}

const performanceCardLabels = ["Total Clicks", "Total Bookings", "Total Revenue", "Avg Conversion Rate"];

function PerformanceStats({ data, loading }: { data: DashboardSummary | null; loading: boolean }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-10">
        {performanceCardLabels.map((label) => (
          <div key={label} className="bg-card border border-light-gray rounded-2xl p-6 flex flex-col gap-2">
            <p className="text-sm text-[#6a7282]">{label}</p>
            <div className="animate-pulse h-10 w-32 bg-muted rounded" />
            <div className="animate-pulse h-4 w-28 bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards: { label: string; value: string; change: number }[] = [
    {
      label: "Total Clicks",
      value: data.totalClicks.value.toLocaleString(),
      change: data.totalClicks.changePercent,
    },
    {
      label: "Total Bookings",
      value: data.totalBookings.value.toLocaleString(),
      change: data.totalBookings.changePercent,
    },
    {
      label: "Total Revenue",
      value: formatPrice(data.totalRevenue.value),
      change: data.totalRevenue.changePercent,
    },
    {
      label: "Avg Conversion Rate",
      value: `${data.totalClicks.conversionPercent.toFixed(2)}%`,
      change: data.totalClicks.conversionChangePercent,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mb-10">
      {cards.map((card) => {
        const positive = card.change >= 0;
        return (
          <div key={card.label} className="bg-card border border-light-gray rounded-2xl p-6 flex flex-col gap-2">
            <p className="text-sm text-[#6a7282]">{card.label}</p>
            <p className="text-[32px] leading-[48px] font-medium">{card.value}</p>
            <p className={cn("text-xs", positive ? "text-[#16a34a]" : "text-[#dc2626]")}>
              {positive ? "+" : ""}
              {card.change.toFixed(1)}% vs last month
            </p>
          </div>
        );
      })}
    </div>
  );
}

const isUntagged = (row: SubIdPerformanceRow) => !row.subId && !row.source && !row.medium && !row.campaign;

const sumOrNull = (values: (number | null)[]) =>
  values.some((v) => v === null) ? null : values.reduce<number>((a, v) => a + (v ?? 0), 0);

/**
 * Splits the per-sub-ID rows into the untagged default link and the tagged variants.
 * If BlueDesk returns untagged traffic as a row with every tag empty, that row is the
 * default link. Otherwise the default link's numbers are the period totals minus the
 * tagged rows; a metric the tagged rows don't report yet (null) stays null.
 */
function splitDefaultLink(rows: SubIdPerformanceRow[], totals: DashboardSummary | null) {
  const tagged = rows.filter((r) => !isUntagged(r));
  const untagged = rows.find(isUntagged);
  if (untagged) return { defaultRow: untagged, tagged };

  const remainder = (total: number | undefined, taggedSum: number | null) =>
    total === undefined || taggedSum === null ? null : Math.max(0, total - taggedSum);
  const clicks = remainder(totals?.totalClicks.value, sumOrNull(tagged.map((r) => r.clicks))) ?? 0;
  const bookings = remainder(totals?.totalBookings.value, sumOrNull(tagged.map((r) => r.bookings)));
  const revenue = remainder(totals?.totalRevenue.value, sumOrNull(tagged.map((r) => r.revenue)));
  const defaultRow: SubIdPerformanceRow = {
    subId: "",
    source: "",
    medium: "",
    campaign: "",
    clicks,
    bookings,
    conversionPercent: bookings === null ? null : clicks > 0 ? (bookings / clicks) * 100 : 0,
    revenue,
  };
  return { defaultRow, tagged };
}

function LinkPerformance({
  rows,
  totals,
  loading,
  className,
}: {
  rows: SubIdPerformanceRow[];
  totals: DashboardSummary | null;
  loading: boolean;
  className?: string;
}) {
  const { affiliate } = useAuth();
  const { defaultRow, tagged } = useMemo(() => splitDefaultLink(rows, totals), [rows, totals]);
  const [sortKey, setSortKey] = useState<SortKey>("clicks");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection(typeof defaultRow[key] === "number" ? "desc" : "asc");
    }
  };

  const sortedRows = useMemo(() => {
    const copy = [...tagged];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      // Nulls (not-yet-available metrics) always sort to the bottom.
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sortDirection === "asc" ? av - bv : bv - av;
      }
      return sortDirection === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return copy;
  }, [tagged, sortKey, sortDirection]);

  const columns: { key: SortKey; label: string; align: "left" | "right" }[] = [
    { key: "subId", label: "Sub-ID", align: "left" },
    { key: "source", label: "Source", align: "left" },
    { key: "medium", label: "Medium", align: "left" },
    { key: "campaign", label: "Campaign", align: "left" },
    { key: "clicks", label: "Clicks", align: "right" },
    { key: "bookings", label: "Bookings", align: "right" },
    { key: "conversionPercent", label: "Conversion", align: "right" },
    { key: "revenue", label: "Revenue", align: "right" },
  ];

  const exampleLink = useMemo(() => {
    const fallback = "bluecarrental.is/?affiliate=your_id&sub_id=blog_post_1";
    if (!affiliate?.affiliateLink) return fallback;
    try {
      const url = new URL(affiliate.affiliateLink);
      url.searchParams.set("sub_id", "blog_post_1");
      return url.toString().replace(/^https?:\/\//, "");
    } catch {
      return fallback;
    }
  }, [affiliate?.affiliateLink]);

  return (
    <section className={cn("bg-card border border-light-gray rounded-2xl p-6", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-medium">Link performance</h2>
        <p className="text-sm text-[#6a7282]">
          Your default affiliate link, plus every tagged version of it (sub-ID, source, medium, campaign)
        </p>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-max text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-light-gray text-[#6a7282] font-medium">
              {columns.map((col) => {
                const isActive = sortKey === col.key;
                const Arrow = isActive ? (sortDirection === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th key={col.key} className={cn("py-2", col.align === "left" ? "text-left pr-4" : "text-right px-4")}>
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:text-foreground",
                        col.align === "right" && "flex-row-reverse",
                        isActive && "text-foreground",
                      )}
                    >
                      {col.label}
                      <Arrow className={cn("size-3.5", !isActive && "opacity-50")} />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading
              ? [0, 1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-b border-light-gray last:border-b-0">
                    {columns.map((col) => (
                      <td key={col.key} className={cn("py-4", col.align === "left" ? "pr-4" : "px-4")}>
                        <div
                          className={cn(
                            "animate-pulse h-4 bg-muted rounded",
                            col.align === "right" ? "ml-auto w-12" : "w-24",
                          )}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              : [defaultRow, ...sortedRows].map((row, i) => (
                  <tr
                    key={i === 0 ? "default-link" : `${row.subId}|${row.source}|${row.medium}|${row.campaign}`}
                    className="border-b border-light-gray last:border-b-0"
                    title={i === 0 ? (affiliate?.affiliateLink ?? undefined) : undefined}
                  >
                    <td className="py-4 pr-4 font-medium">{row.subId}</td>
                    <td className="py-4 pr-4">{row.source}</td>
                    <td className="py-4 pr-4">{row.medium}</td>
                    <td className="py-4 pr-4">{row.campaign}</td>
                    <td className="py-4 px-4 text-right">{row.clicks.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right">
                      {row.bookings === null ? "—" : row.bookings.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {row.conversionPercent === null ? "—" : `${row.conversionPercent.toFixed(2)}%`}
                    </td>
                    <td className="py-4 pl-4 text-right font-medium">
                      {row.revenue === null ? "—" : formatPrice(row.revenue)}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 rounded-lg bg-light-gray/20 px-4 py-4">
        <p className="text-sm font-medium">💡 How to tag your links</p>
        <p className="mt-2 text-xs text-[#6a7282]">
          Use the Link Customizer to add a sub-ID, source, medium or campaign to your affiliate link, e.g.{" "}
          <code className="font-mono break-all">{exampleLink}</code>. Each combination gets its own row here, so you can
          see which channels drive the best results. Clicks on your untagged link show in the first row.
        </p>
      </div>
    </section>
  );
}

function ChartSkeleton({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="bg-white border border-light-gray rounded-2xl p-6">
      <p className="mb-1.25">{title}</p>
      {subtitle && <p className="text-[#6A7282] text-sm mb-5.25">{subtitle}</p>}
      <div className="flex aspect-video lg:max-h-64 xl:max-h-80 w-full">
        <div className="animate-pulse w-full h-full bg-background rounded-lg" />
      </div>
    </div>
  );
}
