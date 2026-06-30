"use client";

import { usePathname } from "next/navigation";
import { withDevHost } from "@/lib/affiliate-link";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import BankAccount from "./BankAccount";
import CopyButton from "./CopyButton";
import { IconComponent } from "./Icon";
import LinkCustomizer from "./LinkCustomizer";

const navigation: {
  name: string;
  href: string;
  icon: string;
  action?: string;
}[] = [
  { name: "Dashboard", href: "/", icon: "Car" },
  { name: "Performance", href: "/performance", icon: "ChartColumn" },
  { name: "Marketing material", href: "/marketing-material", icon: "LongArrowRight" },
  // { name: "Academy", href: "/academy", icon: "GraduationCap" },
  { name: "Request payout", href: "/payout", icon: "Info" },
  { name: "Help & Information", href: "/faq", icon: "CircleHelp" },
  { name: "Log out", href: "#", icon: "LogOut", action: "logout" },
];

export default function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const { affiliate, logout } = useAuth();
  const isPayout = pathname.startsWith("/payout");
  // ⚠️ TEMPORARY — points the affiliate link at dev3 until go-live (see withDevHost).
  const referralLink = affiliate?.affiliateLink ? withDevHost(affiliate.affiliateLink) : null;

  return (
    <aside className={cn("space-y-[26px]", className)}>
      <div className="border border-light-gray rounded-2xl px-3 py-8">
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="space-y-1">
            {navigation.map((item) => {
              const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.name}>
                  <a
                    href={item.href}
                    onClick={
                      item.action === "logout"
                        ? (e) => {
                            e.preventDefault();
                            logout();
                          }
                        : undefined
                    }
                    className={cn(
                      current &&
                        "h-15 flex items-center bg-light-gray/50 rounded-r-xl before:content-[''] before:absolute before:inset-y-0 before:left-0 before:h-full before:w-2 before:bg-secondary",
                      "hover:bg-light-gray/50 group flex gap-x-3.5 py-3 pl-14 pr-6 font-medium rounded-r-xl relative",
                    )}
                  >
                    <IconComponent icon={item.icon} className="shrink-0" size="lg" />
                    {item.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="border border-light-gray rounded-2xl px-6 py-4">
        <p className="text-2xl font-medium mb-1">Your affiliate link</p>
        {referralLink && (
          <div className="flex items-center gap-2">
            <a href={referralLink} target="_blank" rel="noopener noreferrer" className="text-sm break-all">
              {referralLink.replace(/^https?:\/\//, "")}
            </a>
            <CopyButton value={referralLink} />
          </div>
        )}
      </div>

      {isPayout ? <BankAccount /> : affiliate?.affiliateLink && <LinkCustomizer baseLink={affiliate.affiliateLink} />}
    </aside>
  );
}
