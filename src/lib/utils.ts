import * as prismic from "@prismicio/client";
import { type ClassValue, clsx } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPrice = (price: number, withCurrency: boolean = true) => {
  const formatted = new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);

  return `${formatted} ${withCurrency ? "kr." : ""}`;
};

export const formatDate = (date: dayjs.Dayjs) => {
  return date.format("MMMM D, YYYY");
};

/** Estimated reading time in minutes (~200 wpm) for one or more rich-text fields. Minimum 1. */
export function readingTimeMinutes(richTexts: prismic.RichTextField[]): number {
  const words = richTexts
    .map((rt) => prismic.asText(rt))
    .join(" ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Human-readable byte size, e.g. 1572864 → "1.5 MB". Returns "" for non-positive sizes. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** i;
  return `${i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function downloadCsv(rows: Record<string, string | number>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(","), ...rows.map((row) => headers.map((h) => row[h]).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
