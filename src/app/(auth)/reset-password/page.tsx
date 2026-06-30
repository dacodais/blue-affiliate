"use client";

import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiClientError, api } from "@/lib/api";

const BackToLogin = () => (
  <div className="mt-[30px] pt-[25px] border-t border-light-gray text-center text-sm">
    <Link href="/login" className="inline-flex items-center gap-1.5 font-medium text-primary">
      <ArrowLeft className="size-4" />
      Back to sign in
    </Link>
  </div>
);

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="bg-card rounded-2xl shadow-[0_25px_50px_0_rgba(0,0,0,0.25)] p-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[32px] leading-[48px] uppercase text-foreground">Invalid link</h1>
          <p className="text-muted-foreground">
            This password-reset link is missing its token. Request a new one from the sign-in page.
          </p>
        </div>
        <BackToLogin />
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-card rounded-2xl shadow-[0_25px_50px_0_rgba(0,0,0,0.25)] p-10">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-[32px] leading-[48px] uppercase text-foreground">Password reset</h1>
          <p className="text-muted-foreground">Your password has been updated. You can now sign in with it.</p>
        </div>
        <BackToLogin />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-[0_25px_50px_0_rgba(0,0,0,0.25)] p-10">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-[32px] leading-[48px] uppercase text-foreground">Reset password</h1>
        <p className="text-muted-foreground">Choose a new password for your affiliate account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-[30px]">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-card-foreground">
            New Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-12 rounded-lg border-light-gray pr-12 text-[15px] placeholder:text-foreground/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirm" className="text-sm font-medium text-card-foreground">
            Confirm New Password
          </label>
          <Input
            id="confirm"
            type={showPassword ? "text" : "password"}
            placeholder="Re-enter your new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="h-12 rounded-lg border-light-gray text-[15px] placeholder:text-foreground/50"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-[52px] w-full rounded-lg text-base shadow-[0_10px_15px_0_rgba(0,0,0,0.1),0_4px_6px_0_rgba(0,0,0,0.1)]"
        >
          {isSubmitting ? "Resetting..." : "Reset password"}
        </Button>
      </form>

      <BackToLogin />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="w-[440px] max-w-full flex flex-col gap-8">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
      <p className="text-center text-[13px] text-card-foreground">© 2026 Blue Car Rental</p>
    </div>
  );
}
