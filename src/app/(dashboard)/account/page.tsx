"use client";

import { Bell, Landmark, Mail, User } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Heading1 } from "@/components/ui/typography";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { BankAccount } from "@/types/api";

const notificationPreferences: { key: string; label: string; description: string; defaultEnabled: boolean }[] = [
  {
    key: "payout-approved",
    label: "Payout Approved",
    description: "Get notified when your payout request is approved",
    defaultEnabled: true,
  },
  {
    key: "commission-milestones",
    label: "Commission Milestones",
    description: "Celebrate when you reach commission milestones",
    defaultEnabled: true,
  },
  {
    key: "new-marketing-material",
    label: "New Marketing Material",
    description: "Be notified when new marketing materials are available",
    defaultEnabled: true,
  },
  {
    key: "monthly-reports",
    label: "Monthly Reports",
    description: "Receive monthly performance and earnings reports",
    defaultEnabled: true,
  },
  {
    key: "system-updates",
    label: "System Updates",
    description: "Important system announcements and feature updates",
    defaultEnabled: true,
  },
];

export default function AccountPage() {
  const { affiliate } = useAuth();
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
  const [bankLoading, setBankLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .getBankAccount()
      .then((account) => {
        if (active) setBankAccount(account);
      })
      .catch(() => {
        /* leave as null — the card shows the not-configured note */
      })
      .finally(() => {
        if (active) setBankLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <section>
        <div className="space-y-2">
          <Heading1 className="text-2xl">Your Account</Heading1>
          <p className="text-muted-foreground">
            Manage your profile information, commission tier, bank details, and notification preferences.
          </p>
        </div>
      </section>

      <section className="mt-8 rounded-[10px] border border-[#e5e7eb] bg-card p-6">
        <p className="text-card-foreground">Profile Information</p>

        <div className="mt-5 flex flex-col gap-5 md:flex-row md:gap-6">
          <ProfileField
            icon={<User className="size-5 text-muted-foreground" />}
            label="Full Name"
            value={affiliate?.name ?? "—"}
          />
          <ProfileField
            icon={<Mail className="size-5 text-muted-foreground" />}
            label="Email Address"
            value={affiliate?.email ?? "—"}
          />
        </div>
      </section>

      <section className="mt-6 rounded-[10px] bg-linear-to-t from-primary to-[#101828] p-6 text-white">
        <p className="text-xs font-medium">Commission Tier</p>
        <p className="mt-1 text-lg">Standard ({affiliate?.commissionPercent ?? "—"} %)</p>
        <p className="mt-2 text-sm">
          Earn {affiliate?.commissionPercent ?? "—"} % commission on all confirmed rentals. Contact support to discuss
          upgrading to a higher tier.
        </p>
      </section>

      <section className="mt-6 rounded-[10px] border border-[#e5e7eb] bg-card p-6">
        <div className="flex items-center gap-2">
          <Landmark className="size-5 text-[#0a0a0a]" />
          <p className="text-card-foreground">Bank Account Details</p>
        </div>

        {bankLoading ? (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="animate-pulse h-3 w-24 bg-muted rounded" />
                <div className="animate-pulse h-4 w-40 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <BankField label="Account Holder" value={bankAccount?.holderName || "—"} />
            <BankField label="Bank Name" value={bankAccount?.bankName || "—"} />
            <BankField label="Account Number" value={bankAccount?.iban || "—"} mono />
            <BankField label="SWIFT / BIC" value={bankAccount?.swift || "—"} mono />
          </div>
        )}

        <p className="mt-5 rounded-lg border border-[#bedbff] bg-[#eff6ff] px-3 py-3 text-xs text-[#1c398e]">
          {bankAccount
            ? "To update your bank details, visit the Request Payout page and use the Bank Account section in the sidebar."
            : "No bank account on file yet. Add your details on the Request Payout page using the Bank Account section in the sidebar."}
        </p>
      </section>

      {/*
      <section className="mt-6 rounded-[10px] border border-[#e5e7eb] bg-card p-6">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-[#0a0a0a]" />
          <p className="text-card-foreground">Notification Preferences</p>
        </div>

        <div className="mt-5 flex flex-col">
          {notificationPreferences.map((pref, i) => (
            <div
              key={pref.key}
              className={cn(
                "flex items-center justify-between gap-4 py-3",
                i < notificationPreferences.length - 1 && "border-b border-[#f3f4f6]",
              )}
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-[#101828]">{pref.label}</p>
                <p className="text-xs text-muted-foreground">{pref.description}</p>
              </div>
              <Checkbox defaultChecked={pref.defaultEnabled} aria-label={`Toggle ${pref.label}`} />
            </div>
          ))}
        </div>
      </section>
      */}
    </div>
  );
}

function BankField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-sm text-[#101828]", mono && "font-mono")}>{value}</p>
    </div>
  );
}

function ProfileField({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-1 items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6]">{icon}</div>
      <div className="flex flex-col gap-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm text-[#101828]">{value}</p>
      </div>
    </div>
  );
}
