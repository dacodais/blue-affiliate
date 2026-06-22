import type { Metadata } from "next";
import { Host_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import { cn } from "@/lib/utils";
import "./globals.css";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

const blueDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/BlueDisplay-Regular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-blue",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blue Affiliate",
  // Private, invite-only portal — keep it out of search engines entirely.
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("bg-background", "font-sans", hostGrotesk.variable, blueDisplay.variable)}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
