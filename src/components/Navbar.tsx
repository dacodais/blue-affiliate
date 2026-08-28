"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { withDevHost } from "@/lib/affiliate-link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatRelativeTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/api";
import BankAccount from "./BankAccount";
import CopyButton from "./CopyButton";
import { IconComponent } from "./Icon";
import LinkCustomizer from "./LinkCustomizer";
import { Sheet, SheetContent, SheetTitle } from "./ui/sheet";

const navigation = [
  { name: "Dashboard", href: "/", icon: "Car" },
  { name: "Performance", href: "/performance", icon: "ChartColumn" },
  { name: "Marketing material", href: "/marketing-material", icon: "LongArrowRight" },
  // { name: "Academy", href: "/academy", icon: "GraduationCap" },
  { name: "Request payout", href: "/payout", icon: "DollarSign" },
  { name: "Log-out", href: "#", icon: "LogOut", action: "logout" as const },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    let active = true;
    api
      .getNotifications()
      .then((list) => {
        if (active) setNotifications(list);
      })
      .catch(() => {
        /* keep the bell quiet on failure rather than surfacing an error */
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
    try {
      await api.markAllNotificationsRead();
    } catch {
      // Re-fetch to resync if the server rejected the change.
      api
        .getNotifications()
        .then(setNotifications)
        .catch(() => {});
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center size-9 rounded-lg bg-white/10 hover:bg-white/15"
      >
        <IconComponent icon="Bell" className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center size-[18px] rounded-full bg-secondary text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-card border border-light-gray rounded-lg shadow-lg overflow-hidden text-left text-foreground z-50 origin-top-right animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-150 ease-out">
          <div className="flex items-center justify-between px-4 py-4 border-b border-light-gray">
            <h2 className="font-heading text-base uppercase text-card-foreground">Notifications</h2>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="text-xs text-secondary hover:underline disabled:text-muted-foreground disabled:no-underline"
            >
              Mark all read
            </button>
          </div>
          <ul className="max-h-[510px] overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                {loaded ? "You're all caught up." : "Loading…"}
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "relative px-4 py-4 border-b border-light-gray/60 last:border-b-0",
                    !n.read && "bg-[#fffbf0]",
                  )}
                >
                  <div className="flex items-start gap-3 pr-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">{n.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-2 text-[11px] text-[#6a7282]">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1 shrink-0 size-2 rounded-full bg-secondary" aria-hidden />}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function NavbarRight() {
  return (
    <ul className="flex items-center gap-3 text-white">
      <li>
        <NotificationBell />
      </li>
      {/*
      <li>
        <button
          type="button"
          className="flex items-center gap-2 h-9 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-lg font-medium"
        >
          <span>Kr</span>
          <IconComponent icon="ChevronDown" size="sm" className="text-white" />
        </button>
      </li>
      */}
      <li>
        <Link
          href="/account"
          className="flex items-center gap-2 h-9 px-3 lg:px-5 rounded-lg bg-white/10 hover:bg-white/15 text-lg font-medium"
        >
          <IconComponent icon="User" className="text-white" />
          <span className="hidden lg:inline">Your account</span>
        </Link>
      </li>
    </ul>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { affiliate, logout } = useAuth();
  const isPayout = pathname.startsWith("/payout");
  // ⚠️ TEMPORARY — points the affiliate link at dev3 until go-live (see withDevHost).
  const referralLink = affiliate?.affiliateLink ? withDevHost(affiliate.affiliateLink) : null;

  return (
    <>
      {/* Desktop navbar */}
      <nav className="hidden lg:flex justify-between items-center bg-primary rounded-2xl px-6 h-[86px]">
        <Link href="/">
          <Image src="/logo.svg" alt="Blue Affiliate" width={100} height={100} />
        </Link>
        <NavbarRight />
      </nav>

      {/* Mobile navbar */}
      <nav className="lg:hidden flex justify-between items-center bg-primary -mx-4 -mt-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => setOpen(true)}>
            <IconComponent icon="Menu" className="text-white size-6" />
          </button>
          <Link href="/">
            <Image src="/logo.svg" alt="Blue Affiliate" width={75} height={14} />
          </Link>
        </div>
        <NavbarRight />
      </nav>

      {/* Mobile sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="data-[side=left]:w-full data-[side=left]:sm:max-w-full border-0 p-0 bg-background"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>

          {/* Sheet header — same as mobile navbar */}
          <div className="flex justify-between items-center bg-primary px-4 py-4">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setOpen(false)}>
                <IconComponent icon="X" className="text-white size-6" />
              </button>
              <Link href="/" onClick={() => setOpen(false)}>
                <Image src="/logo.svg" alt="Blue Affiliate" width={75} height={14} />
              </Link>
            </div>
            <NavbarRight />
          </div>

          {/* Navigation links */}
          <div className="px-5 pt-4 overflow-y-auto flex-1">
            <nav>
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <li key={item.name}>
                      {item.action === "logout" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            logout();
                          }}
                          className={cn(
                            "flex w-full items-center gap-3 h-12 px-4 rounded-lg font-medium",
                            current && "bg-light-gray/50 border-l-4 border-secondary",
                          )}
                        >
                          <IconComponent icon={item.icon} />
                          {item.name}
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 h-12 px-4 rounded-lg font-medium",
                            current && "bg-light-gray/50 border-l-4 border-secondary",
                          )}
                        >
                          <IconComponent icon={item.icon} />
                          {item.name}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Divider + bottom sections */}
            <div className="border-t border-border mt-8 pt-6 space-y-4">
              {/* Affiliate link */}
              <div className="bg-card border border-light-gray/95 rounded-2xl p-6">
                <p className="text-xl font-medium mb-2">Your affiliate link</p>
                {referralLink && (
                  <div className="flex items-center gap-2">
                    <a href={referralLink} target="_blank" rel="noopener noreferrer" className="text-xs">
                      {referralLink.replace(/^https?:\/\//, "")}
                    </a>
                    <CopyButton value={referralLink} />
                  </div>
                )}
              </div>

              {isPayout ? (
                <BankAccount />
              ) : (
                affiliate?.affiliateLink && <LinkCustomizer baseLink={affiliate.affiliateLink} />
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
