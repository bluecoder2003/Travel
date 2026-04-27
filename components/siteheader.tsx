"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/* ─── Tiny icon helpers ──────────────────────────────────── */
const Ic = {
  Tag: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  Briefcase: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Headphones: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
    </svg>
  ),
  User: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  ChevDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
};

/* ─── Nav tab icons ──────────────────────────────────────── */
const TabIcon = ({ tab }: { tab: string }) => {
  const configs: Record<string, { bg: string; icon: ReactNode }> = {
    flights: {
      bg: "from-[#4a90d9] to-[#1a5fb4]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      ),
    },
    hotels: {
      bg: "from-[#52b85a] to-[#2d8c35]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      ),
    },
    buses: {
      bg: "from-[#f5a623] to-[#d4820a]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
        </svg>
      ),
    },
    holidays: {
      bg: "from-[#a855f7] to-[#7c3aed]",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/>
        </svg>
      ),
    },
  };
  const c = configs[tab] || configs.flights;
  return (
    <div className={`w-10 h-10 rounded-full bg-linear-to-br ${c.bg} flex items-center justify-center shadow-sm shrink-0`}>
      {c.icon}
    </div>
  );
};

/* ─── Types ──────────────────────────────────────────────── */
export type ActiveTab = "flights" | "hotels" | "buses" | "holidays" | "ai-planner";

const NAV_TABS = [
  { id: "flights" as const, label: "Flights", href: "/flights" },
  { id: "hotels" as const, label: "Hotels", href: "/" },
  { id: "buses" as const, label: "Buses", href: "/" },
  { id: "holidays" as const, label: "Holidays", href: "/" },
];

/* ─── SiteHeader ─────────────────────────────────────────── */
export function SiteHeader({ active, hideNav = false }: { active: ActiveTab; hideNav?: boolean }) {
  return (
    <header className="bg-white sticky top-0 z-50">
      {/* ── Top utility bar ── */}
      <div className="border-b border-[#ebebeb]">
        <div className="max-w-[1260px] mx-auto px-5 h-[48px] flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Cleartrip" width={120} height={32} className="h-8 w-auto object-contain" />
            <span className="text-[11px] text-[#999] italic font-normal pl-2 border-l border-ct-border">
              A <span className="font-semibold not-italic">Flipkart</span> Company
            </span>
          </Link>

          {/* Utility links */}
          <div className="flex items-center">
            {[
              { icon: <Ic.Tag />, label: "Offers" },
              { icon: <Ic.Briefcase />, label: "Business", chevron: true },
              { icon: <Ic.MapPin />, label: "My Trips" },
              { icon: <Ic.Headphones />, label: "Support" },
            ].map((item) => (
              <Button
                key={item.label}
                variant="ghost"
                className="h-[48px] gap-1.5 rounded-none text-[13px] text-[#333] hover:text-ct-orange font-medium px-3.5"
              >
                <span className="text-[#666]">{item.icon}</span>
                {item.label}
                {item.chevron && <span className="text-[#999]"><Ic.ChevDown /></span>}
              </Button>
            ))}
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button
              variant="ghost"
              className="h-[48px] gap-1.5 rounded-none text-[13px] text-[#333] hover:text-ct-orange font-medium px-3.5"
            >
              <span className="text-[#666]"><Ic.User /></span>
              My Account
              <span className="text-[#999]"><Ic.ChevDown /></span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Nav tabs ── */}
      {!hideNav && (
        <div className="bg-white border-b border-[#ebebeb]">
          <div className="max-w-[1260px] mx-auto px-5 flex items-center justify-center">
            {NAV_TABS.map((tab) => (
              <a
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2.5 px-8 py-3.5 text-[15px] border-b-2 transition-colors whitespace-nowrap",
                  active === tab.id
                    ? "border-ct-orange text-[#1a1a1a] font-semibold"
                    : "border-transparent text-[#555] hover:text-[#1a1a1a] hover:border-ct-orange",
                )}
              >
                <TabIcon tab={tab.id} />
                {tab.label}
              </a>
            ))}
            {/* AI Planner tab */}
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 px-8 py-[14px] text-[15px] border-b-2 transition-colors whitespace-nowrap",
                active === "ai-planner"
                  ? "border-ct-orange text-ct-orange font-semibold"
                  : "border-transparent text-[#555] font-semibold text-[#1a1a1a] hover:border-ct-orange hover:text-ct-orange",
              )}
            >
              <div className="w-10 h-10 rounded-full bg-[#FF4F17] flex items-center justify-center shadow-sm shrink-0">
                <span className="text-white text-[16px]">✨</span>
              </div>
              AI Planner
              <span className="text-[9px] font-extrabold bg-ct-orange text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">NEW</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
