"use client";

import { useAuth } from "@/lib/auth";

export default function CommissionRateCard() {
  const { affiliate } = useAuth();
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[#bedbff] bg-linear-to-br from-[#eff6ff] to-[#dbeafe] p-5 text-[#1c398e]">
      <p className="text-sm font-bold">Commission Rate</p>
      <p className="text-2xl">{affiliate?.commissionPercent != null ? `${affiliate.commissionPercent}%` : "—"}</p>
      <p className="text-xs">On all confirmed rentals</p>
    </div>
  );
}
