"use client";

import { ChevronDown, Info } from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";
import Banner from "@/components/Banner";
import { IconComponent } from "@/components/Icon";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Heading1 } from "@/components/ui/typography";
import { ApiClientError, api } from "@/lib/api";
import { formatMonthYear, formatShortDate } from "@/lib/dates";
import { cn, formatPrice } from "@/lib/utils";
import type { CommissionMonth, IndividualRental, PayoutStatus, PayoutsData } from "@/types/api";

const MIN_PAYOUT = 50_000;

const statusStyles: Record<PayoutStatus, { bg: string; icon: string }> = {
  paid: { bg: "bg-success-bg text-success", icon: "CircleCheck" },
  approved: { bg: "bg-primary/10 text-primary", icon: "Clock" },
  pending: { bg: "bg-yellow-100 text-yellow-700", icon: "Clock" },
  rejected: { bg: "bg-red-100 text-red-700", icon: "XCircle" },
};

const statusLabels: Record<PayoutStatus, string> = {
  paid: "Paid",
  approved: "Approved — Awaiting Payment",
  pending: "Pending",
  rejected: "Rejected",
};

function formatIsoDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function PayoutPage() {
  const [data, setData] = useState<PayoutsData | null>(null);
  const [months, setMonths] = useState<CommissionMonth[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [payouts, commissionMonths] = await Promise.all([api.getPayouts(), api.getPayoutMonths()]);
      setData(payouts);
      setMonths(commissionMonths);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payout data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleSubmitSelected(monthIds: string[]): Promise<boolean> {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await api.requestPayout(monthIds);
      await fetchData();
      return true;
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to submit payout request");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isLoading && error) {
    return (
      <Banner level="error" message={error} items={["Please try again or contact support if the issue persists."]} />
    );
  }

  return (
    <div>
      <section>
        <div className="space-y-2">
          <Heading1 className="text-2xl">Request Payout</Heading1>
          <p className="text-muted-foreground">
            Select confirmed commission months to request payout. Only months with all deliveries returned and closed
            are available for payout.
          </p>
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-2 rounded-lg bg-linear-to-b md:bg-linear-to-r from-secondary to-[#f54900] p-8">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-[#00ff00]" aria-hidden />
            <span className="text-secondary-muted">Available for Payout</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-6 w-40 bg-white/20 rounded" />
          ) : (
            <p className="text-white">{data ? formatPrice(data.availableBalance) : "-"}</p>
          )}
          <p className="text-secondary-muted text-sm">
            {data ? `${data.confirmedMonths} confirmed ${data.confirmedMonths === 1 ? "month" : "months"}` : "—"} •
            Minimum payout: {formatPrice(MIN_PAYOUT)}
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border-2 border-[#ff9800] bg-card p-8">
          <div className="flex items-center gap-3">
            <span className="size-2 rounded-full bg-[#ff9800]" aria-hidden />
            <span className="text-muted-foreground">Pending Confirmation</span>
          </div>
          {isLoading ? (
            <div className="animate-pulse h-6 w-40 bg-muted rounded" />
          ) : (
            <p>{data ? formatPrice(data.pendingAmount) : "—"}</p>
          )}
          <p className="text-muted-foreground text-sm">Awaiting all deliveries to be returned and closed</p>
        </div>
      </section>

      <SelectCommissionMonths
        months={months}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={handleSubmitSelected}
        className="mt-8"
      />

      <section className="mt-8">
        <div className="flex flex-col gap-6 rounded-lg border border-[#e5e7eb] bg-card p-6">
          <p className="text-card-foreground">Payout History</p>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          ) : data && data.history.length === 0 ? (
            <p className="text-muted-foreground text-sm">No payout history yet.</p>
          ) : data ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max whitespace-nowrap">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 pl-4 text-left text-base font-bold text-muted-foreground">Request Date</th>
                    <th className="pb-3 pl-4 text-left text-base font-bold text-muted-foreground">Amount</th>
                    <th className="pb-3 pl-4 text-left text-base font-bold text-muted-foreground">Status</th>
                    <th className="pb-3 pl-4 text-left text-base font-bold text-muted-foreground">Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.history.map((row) => {
                    const style = statusStyles[row.status];
                    return (
                      <tr key={row.id} className="border-b border-border/40">
                        <td className="py-4 pl-4 text-card-foreground">{formatIsoDate(row.requestDate)}</td>
                        <td className="py-4 pl-4 text-card-foreground">{formatPrice(row.amount)}</td>
                        <td className="py-4 pl-4">
                          <span
                            className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm", style.bg)}
                          >
                            <IconComponent icon={style.icon} className="size-4" />
                            {statusLabels[row.status]}
                          </span>
                        </td>
                        <td className="py-4 pl-4 text-muted-foreground">
                          {row.paidDate ? formatIsoDate(row.paidDate) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col gap-3 rounded-lg border border-[#bedbff] bg-linear-to-br from-[#eff6ff] to-[#dbeafe] p-6 text-[#1c398e]">
          <div className="flex items-center gap-2">
            <Info className="size-5" />
            <p className="font-bold">Bank Account</p>
          </div>
          <p className="text-sm">
            You can view and update your registered bank account details in the sidebar. Make sure your payment
            information is accurate before requesting a payout.
          </p>
          <p className="text-sm font-medium text-primary">{'← See "Bank Account" in sidebar'}</p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-[#e5e7eb] bg-card p-6">
          <p className="text-card-foreground">Need Help?</p>
          <p className="text-sm text-muted-foreground">
            If you have questions about your payout, commission calculations, or need assistance with your account,
            please contact our support team.
          </p>
          <a href="mailto:affiliates@bluecarrental.is" className="text-sm text-secondary">
            Contact Support →
          </a>
        </div>
      </section>
    </div>
  );
}

function SelectCommissionMonths({
  months,
  isLoading,
  isSubmitting,
  submitError,
  onSubmit,
  className,
}: {
  months: CommissionMonth[];
  isLoading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onSubmit: (monthIds: string[]) => Promise<boolean>;
  className?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const selectedMonths = months.filter((m) => selected.has(m.id));
  const selectedTotal = selectedMonths.reduce((sum, m) => sum + m.commission, 0);

  const toggle = (m: CommissionMonth) => {
    if (m.status !== "confirmed") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(m.id)) next.delete(m.id);
      else next.add(m.id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openConfirm = () => {
    if (selected.size === 0 || selectedTotal < MIN_PAYOUT) return;
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const success = await onSubmit(selectedMonths.map((m) => m.id));
    if (success) {
      setSelected(new Set());
      setIsConfirmOpen(false);
    }
  };

  const canSubmit = selected.size > 0 && selectedTotal >= MIN_PAYOUT && !isSubmitting;
  const buttonLabel =
    selected.size === 0
      ? "Select Months to Continue"
      : selectedTotal < MIN_PAYOUT
        ? `Minimum payout: ${formatPrice(MIN_PAYOUT)}`
        : isSubmitting
          ? "Submitting..."
          : `Request payout of ${formatPrice(selectedTotal)}`;

  return (
    <section className={cn("rounded-lg border border-[#e5e7eb] bg-card p-6", className)}>
      <h2 className="text-card-foreground">Select Commission Months</h2>

      <div className="mt-3 pb-4 border-b border-light-gray flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-[#364153]">
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#00ff00]" aria-hidden />
          Confirmed — All deliveries closed
        </span>
        <span className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#ff9800]" aria-hidden />
          Pending — Deliveries still ongoing
        </span>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-max text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-light-gray text-[#4a5565] font-bold">
              <th className="w-10 py-3" />
              <th className="text-left py-3 pr-4 w-16">Select</th>
              <th className="text-left py-3 pr-4">Month</th>
              <th className="text-left py-3 pr-4">Status</th>
              <th className="text-right py-3 pr-4">Deliveries</th>
              <th className="text-right py-3 pl-4">Commission</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#f3f4f6]">
                    <td className="py-4 pl-2 pr-2 w-10" />
                    <td className="py-4 pr-4">
                      <div className="animate-pulse size-[18px] bg-muted rounded-[3px]" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="animate-pulse h-4 w-24 bg-muted rounded" />
                    </td>
                    <td className="py-4 pr-4">
                      <div className="animate-pulse h-4 w-20 bg-muted rounded" />
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <div className="animate-pulse h-4 w-12 bg-muted rounded ml-auto" />
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <div className="animate-pulse h-4 w-20 bg-muted rounded ml-auto" />
                    </td>
                  </tr>
                ))
              : months.map((m) => {
                  const isConfirmed = m.status === "confirmed";
                  const isSelected = selected.has(m.id);
                  const isExpanded = expanded.has(m.id);
                  const monthLabel = formatMonthYear(m.monthStart);
                  return (
                    <Fragment key={m.id}>
                      <tr className={cn("border-b border-[#f3f4f6]", !isConfirmed && "opacity-60")}>
                        <td className="py-4 pl-2 pr-2 w-10">
                          {/* TEMPORARY (debugging): pending months are expandable too (see below). */}
                          {m.rentals && m.rentals.length > 0 && (
                            <button
                              type="button"
                              aria-label={isExpanded ? `Collapse ${monthLabel}` : `Expand ${monthLabel}`}
                              aria-expanded={isExpanded}
                              onClick={() => toggleExpand(m.id)}
                              className="flex items-center justify-center size-6 rounded text-muted-foreground hover:bg-muted"
                            >
                              <ChevronDown className={cn("size-4 transition-transform", isExpanded && "rotate-180")} />
                            </button>
                          )}
                        </td>
                        <td className="py-4 pr-4">
                          <Checkbox
                            aria-label={`Select ${monthLabel}`}
                            disabled={!isConfirmed}
                            checked={isSelected}
                            onCheckedChange={() => toggle(m)}
                          />
                        </td>
                        <td className="py-4 pr-4 text-card-foreground">{monthLabel}</td>
                        <td className="py-4 pr-4 text-[#364153] capitalize">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn("size-2 rounded-full", isConfirmed ? "bg-[#00ff00]" : "bg-[#ff9800]")}
                              aria-hidden
                            />
                            {m.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4 text-right text-card-foreground">
                          {m.deliveriesClosed}/{m.deliveriesTotal}
                        </td>
                        <td className="py-4 pl-4 text-right font-medium text-card-foreground">
                          {formatPrice(m.commission)}
                        </td>
                      </tr>
                      {m.rentals && (
                        <tr className={cn(isExpanded && "border-b border-[#f3f4f6]")}>
                          <td colSpan={6} className="bg-[#f9fafb] p-0">
                            <div
                              className={cn(
                                "grid transition-[grid-template-rows] duration-300 ease-in-out",
                                isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                              )}
                            >
                              <div className="overflow-hidden">
                                <div className="px-8 py-5">
                                  {isConfirmed ? (
                                    <IndividualRentalsTable
                                      month={monthLabel}
                                      totalCommission={m.commission}
                                      rentals={m.rentals}
                                    />
                                  ) : (
                                    /* TEMPORARY (debugging): minimal pending view — reservation refs only. */
                                    <PendingReservationsDebug rentals={m.rentals} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
          </tbody>
        </table>
      </div>

      {submitError && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {submitError}
        </div>
      )}

      <div className="mt-5">
        <Banner
          level="info"
          message="Important Information:"
          items={[
            "Only confirmed months with all deliveries closed can be selected",
            "Payout requests are processed twice per month (1st and 15th)",
            "All amounts are exclusive of VAT",
            "Funds will be transferred to your registered bank account",
          ]}
        />
      </div>

      <button
        type="button"
        onClick={openConfirm}
        disabled={!canSubmit}
        className={cn(
          "mt-5 w-full h-12 rounded-lg bg-secondary text-white transition-opacity",
          !canSubmit && "opacity-50 cursor-not-allowed",
        )}
      >
        {buttonLabel}
      </button>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm payout request</DialogTitle>
            <DialogDescription>
              You're about to request a payout for the following commission months. This cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-[#e5e7eb] bg-[#f9fafb]">
            <ul className="divide-y divide-[#f3f4f6]">
              {selectedMonths.map((m) => (
                <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-card-foreground">{formatMonthYear(m.monthStart)}</span>
                  <span className="font-medium text-card-foreground">{formatPrice(m.commission)}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t-2 border-[#ffd966] bg-[#fffbf0] px-4 py-3">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-base font-bold text-secondary">{formatPrice(selectedTotal)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Funds will be transferred to your registered bank account. Payouts are processed twice per month (1st and
            15th).
          </p>

          <DialogFooter className="mt-2">
            <button
              type="button"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-lg bg-[#f3f4f6] text-[#364153] text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 h-10 rounded-lg bg-secondary text-white text-sm font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : `Confirm & request ${formatPrice(selectedTotal)}`}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

// TEMPORARY (debugging): minimal expand panel for pending months — shows each
// reservation's booking code / GUID and a "pending" marker, nothing else.
// Remove this component and the pending-expand wiring above once debugging is done.
function PendingReservationsDebug({ rentals }: { rentals: IndividualRental[] }) {
  return (
    <div className="whitespace-normal">
      <p className="text-sm font-bold text-foreground">Reservations (debug)</p>
      <p className="mt-1 text-xs text-muted-foreground">{rentals.length} reservations</p>

      <div className="mt-3 overflow-hidden rounded-lg border border-[#E5E7EB] bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-light-gray bg-[#f3f4f6] text-[#4a5565] font-bold">
              <th className="text-left px-3 py-2.5">Booking Code</th>
              <th className="text-left px-3 py-2.5">GUID</th>
              <th className="text-left px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((r) => (
              <tr key={r.guid} className="border-b border-[#f3f4f6] last:border-b-0">
                <td className="px-3 py-2.5 text-card-foreground">{r.bookingCode ?? "—"}</td>
                <td className="px-3 py-2.5 text-card-foreground break-all">{r.guid}</td>
                <td className={cn("px-3 py-2.5", r.finished ? "text-[#00a63e]" : "text-[#ff9800]")}>
                  {r.finished ? "closed" : "pending"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IndividualRentalsTable({
  month,
  totalCommission,
  rentals,
}: {
  month: string;
  totalCommission: number;
  rentals: IndividualRental[];
}) {
  return (
    <div className="whitespace-normal">
      <p className="text-sm font-bold text-foreground">Individual Rentals — {month}</p>
      <p className="mt-1 text-xs text-muted-foreground">{rentals.length} completed rentals</p>

      <div className="mt-3 overflow-hidden rounded-lg border border-[#E5E7EB] bg-card">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-light-gray bg-[#f3f4f6] text-[#4a5565] font-bold">
              <th className="text-left px-3 py-2.5">Rental ID</th>
              <th className="text-left px-3 py-2.5">Rental Dates</th>
              <th className="text-left px-3 py-2.5">Car Model</th>
              <th className="text-right px-3 py-2.5">Rental Revenue</th>
              <th className="text-right px-3 py-2.5 w-14">Rate</th>
              <th className="text-right px-3 py-2.5">Commission</th>
            </tr>
          </thead>
          <tbody>
            {rentals.map((r) => (
              <tr key={r.id} className="border-b border-[#f3f4f6] last:border-b-0">
                <td className="px-3 py-2.5 text-card-foreground">{r.id}</td>
                <td className="px-3 py-2.5 text-card-foreground">
                  {formatShortDate(r.startDate)} → {formatShortDate(r.endDate)}
                </td>
                <td className="px-3 py-2.5 text-card-foreground">{r.carModel}</td>
                <td className="px-3 py-2.5 text-right text-card-foreground">{formatPrice(r.revenue)}</td>
                <td className="px-3 py-2.5 text-right text-muted-foreground">{r.ratePercent}%</td>
                <td className="px-3 py-2.5 text-right font-medium text-secondary">{formatPrice(r.commission)}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#ffd966] bg-[#fffbf0]">
              <td colSpan={4} />
              <td className="px-3 py-3 text-right text-xs font-bold text-foreground whitespace-nowrap">
                Total for {month}:
              </td>
              <td className="px-3 py-3 text-right text-sm font-bold text-secondary">{formatPrice(totalCommission)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
