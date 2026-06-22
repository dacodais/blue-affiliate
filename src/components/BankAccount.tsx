"use client";

import { CircleX, Pencil, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { ApiClientError, api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { BankAccount as BankAccountType } from "@/types/api";
import { Input } from "./ui/input";

const emptyForm = { holderName: "", bankName: "", iban: "", swift: "" };

export default function BankAccount() {
  const [saved, setSaved] = useState<BankAccountType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    let active = true;
    api
      .getBankAccount()
      .then((account) => {
        if (active) setSaved(account);
      })
      .catch(() => {
        if (active) setError("Couldn't load your bank account.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const startEditing = () => {
    setForm(
      saved
        ? { holderName: saved.holderName, bankName: saved.bankName, iban: saved.iban, swift: saved.swift ?? "" }
        : emptyForm,
    );
    setError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const result = await api.updateBankAccount({
        holderName: form.holderName,
        bankName: form.bankName,
        iban: form.iban,
        swift: form.swift.trim() || null,
      });
      setSaved(result);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't save your bank account. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setIsEditing(false);
  };

  const setField = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  if (isLoading) {
    return (
      <div className="border border-light-gray rounded-2xl p-8 flex flex-col gap-4">
        <h2 className="text-2xl font-medium">Bank Account</h2>
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-[3.75px]">
              <div className="animate-pulse h-3 w-24 bg-muted rounded" />
              <div className="animate-pulse h-4 w-40 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!isEditing) {
    const readOnlyFields: { label: string; value: string; mono?: boolean }[] = [
      { label: "Account Holder", value: saved?.holderName || "—" },
      { label: "Bank", value: saved?.bankName || "—" },
      { label: "Account Number", value: saved?.iban || "—", mono: true },
      { label: "SWIFT / BIC", value: saved?.swift || "—", mono: true },
    ];

    return (
      <div className="border border-light-gray rounded-2xl p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-medium">Bank Account</h2>
          <button
            type="button"
            onClick={startEditing}
            aria-label="Edit bank account"
            className="size-8 rounded flex items-center justify-center text-muted-foreground hover:bg-muted"
          >
            <Pencil className="size-4" />
          </button>
        </div>

        {!saved && (
          <div className="rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-3 py-3 text-[11px] leading-4 text-[#9a3412]">
            No bank account on file yet. Add your details so payouts can be transferred to you.
          </div>
        )}

        <div className="flex flex-col gap-3">
          {readOnlyFields.map((f) => (
            <div key={f.label} className="flex flex-col gap-[3.75px]">
              <p className="text-[11px] font-medium text-[#6a7282]">{f.label}</p>
              <p className={cn("text-sm text-foreground", f.mono && "font-mono")}>{f.value}</p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[#bedbff] bg-[#eff6ff] px-3 py-3 text-[11px] leading-4 text-[#1c398e]">
          Note: Payouts will be transferred to this account. Make sure your details are accurate.
        </div>
      </div>
    );
  }

  const fields: { label: string; placeholder?: string; key: keyof typeof form }[] = [
    { label: "Account Holder Name", key: "holderName" },
    { label: "Bank Name", key: "bankName" },
    { label: "Account Number / IBAN", key: "iban" },
    { label: "SWIFT / BIC (Optional)", placeholder: "NBIIISRE", key: "swift" },
  ];

  return (
    <div className="border border-light-gray rounded-2xl p-8 flex flex-col gap-4">
      <h2 className="text-2xl font-medium">Bank Account</h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">{error}</div>
      )}

      <div className="flex flex-col gap-3">
        {fields.map((f) => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#6a7282]">{f.label}</label>
            <Input
              value={form[f.key]}
              onChange={(e) => setField(f.key)(e.target.value)}
              placeholder={f.placeholder}
              className="h-[39px] rounded-lg border-light-gray text-sm placeholder:text-foreground/50"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 h-10 rounded-lg bg-secondary text-white text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={isSaving}
          className="flex-1 h-10 rounded-lg bg-[#f3f4f6] text-[#364153] text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <CircleX className="size-4" />
          Cancel
        </button>
      </div>
    </div>
  );
}
