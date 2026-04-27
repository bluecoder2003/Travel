"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  ChatCircle,
  AirplaneTilt,
  Buildings,
  Bus,
  Umbrella,
  Users,
  Plus,
  Gift,
  GearSix,
  Tag,
  Briefcase,
  MapPin,
  Headset,
  UserCircle,
  UserList,
  CreditCard,
  UsersThree,
  Lightning,
  Wallet,
  ShieldCheck,
  SignOut,
  Question,
  Robot,
  Desktop,

  Code,
  CaretRight,
} from "@phosphor-icons/react";

const SERVICE_NAV = [
  { id: "flights",   label: "Flights",   href: "/flights",   Icon: AirplaneTilt },
  { id: "hotels",    label: "Hotels",    href: "/hotels",    Icon: Buildings    },
  { id: "buses",     label: "Buses",     href: "/buses",     Icon: Bus          },
  { id: "holidays",  label: "Holidays",  href: "/holidays",  Icon: Umbrella     },
  { id: "community", label: "Community", href: "/community", Icon: Users        },
];

const UTILITY_NAV = [
  { id: "offers",    label: "Offers",          href: "/offers",    Icon: Tag,      flyout: false },
  { id: "business",  label: "Business Travel",  href: "/business",  Icon: Briefcase, flyout: true  },
  { id: "my-trips",  label: "My Trips",         href: "/my-trips",  Icon: MapPin,   flyout: false },
  { id: "support",   label: "Support",          href: "/support",   Icon: Headset,  flyout: false },
];

const BUSINESS_MENU = [
  {
    label: "AgentBox",
    tag: "NEW",
    desc: "For travel agents\nOne-stop travel solution offering the best deals to our travel agency partners",
    href: "/business/agentbox",
    Icon: Robot,
  },
  {
    label: "OutOfOffice",
    tag: "NEW",
    desc: "For startups, corporates and SMEs\nManage corporate business travel, smartly",
    href: "/business/outofoffice",
    Icon: Desktop,
  },
  {
    label: "MICE",
    tag: "NEW",
    desc: "For corporate events\nAn end-to-end management solution for all your corporate events",
    href: "/business/mice",
    Icon: UsersThree,
  },
  {
    label: "API",
    tag: "NEW",
    desc: "For developers\nUnlock seamless integration and scale with our powerful, reliable APIs",
    href: "/business/api",
    Icon: Code,
  },
];

const ACCOUNT_MENU = [
  { label: "My Profile",        Icon: UserList,    href: "/account/profile"    },
  { label: "My Trips",          Icon: MapPin,      href: "/my-trips"           },
  { label: "Saved Cards",       Icon: CreditCard,  href: "/account/cards"      },
  { label: "Saved Travellers",  Icon: UsersThree,  href: "/account/travellers" },
  { label: "Hi-Five",           Icon: Lightning,   href: "/account/hifive"     },
  { label: "Wallet",            Icon: Wallet,      href: "/account/wallet"     },
  { label: "Settings",          Icon: GearSix,     href: "/account/settings"   },
  { label: "Privacy Rights",    Icon: ShieldCheck, href: "/account/privacy"    },
  { label: "Help",              Icon: Question,    href: "/help"               },
];

export type SidebarActive =
  | "flights" | "hotels" | "buses" | "holidays" | "community"
  | "offers" | "business" | "my-trips" | "support"
  | "ai-planner";

export function AppSidebar({
  active,
  onToggleChats,
  showChats,
}: {
  active?: SidebarActive;
  onToggleChats?: () => void;
  showChats?: boolean;
}) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(false);
  const [businessY, setBusinessY] = useState(0);

  return (
    <>
      <aside className="w-[240px] shrink-0 flex flex-col bg-white border-r border-[#e5e7eb] h-full">

        {/* Logo */}
        <div className="flex justify-start items-center px-2 py-3 border-b border-[#f0f0f0] shrink-0 flex">
          <a href="/">
            <Image
              src="/logo.png"
              alt="Cleartrip"
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
            />
          </a>
          <p className="text-[10px] text-[#bbb] italic">
            A <span className="font-semibold not-italic text-[#999]">Flipkart</span> Company
          </p>
        </div>

        {/* New trip + optional chat toggle */}
        <div className="px-4 pt-3 pb-2 shrink-0 flex gap-2">
          <a
            href="/"
            className="flex-1 flex items-center justify-center gap-2 border border-[#e5e7eb] rounded-full py-2 text-[13px] font-semibold text-[#1a1a1a] hover:bg-[#fafafa] transition-colors"
          >
            <Plus size={14} weight="bold" />
            New trip
          </a>
          {onToggleChats && (
            <button
              onClick={onToggleChats}
              title="Toggle chats"
              className={cn(
                "w-9 h-9 flex items-center justify-center rounded-full border transition-colors shrink-0",
                showChats
                  ? "border-[#FF4F17] bg-[#f0f0f0] text-[#1a1a1a]"
                  : "border-[#e5e7eb] text-[#888] hover:bg-[#f5f5f5]",
              )}
            >
              <ChatCircle size={16} weight={showChats ? "fill" : "regular"} />
            </button>
          )}
        </div>

        {/* Nav area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {/* Services */}
          <nav className="px-2 pt-1 shrink-0">
            <p className="text-[10px] font-semibold text-[#bbb] uppercase tracking-wider px-3 mb-0.5">
              Services
            </p>
            {SERVICE_NAV.map(({ id, label, href, Icon }) => (
              <a
                key={id}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors font-medium",
                  active === id
                    ? "bg-[#f0f0f0] text-[#1a1a1a]"
                    : "text-[#555] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]",
                )}
              >
                <Icon size={16} weight={active === id ? "fill" : "regular"} />
                {label}
              </a>
            ))}
          </nav>

          <div className="mx-4 my-1.5 h-px bg-[#f0f0f0] shrink-0" />

          {/* Account / utility */}
          <nav className="px-2 shrink-0">
            <p className="text-[10px] font-semibold text-[#bbb] uppercase tracking-wider px-3 mb-0.5">
              Account
            </p>
            {UTILITY_NAV.map(({ id, label, href, Icon, flyout }) =>
              flyout ? (
                <div
                  key={id}
                  onMouseEnter={(e) => {
                    setBusinessY((e.currentTarget as HTMLElement).getBoundingClientRect().top);
                    setBusinessOpen(true);
                  }}
                  onMouseLeave={() => setBusinessOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors font-medium cursor-pointer",
                    active === id
                      ? "bg-[#f0f0f0] text-[#1a1a1a]"
                      : "text-[#555] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]",
                  )}
                >
                  <Icon size={16} weight={active === id ? "fill" : "regular"} />
                  {label}
                  <CaretRight size={12} className="ml-auto text-[#bbb]" />
                </div>
              ) : (
                <a
                  key={id}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] transition-colors font-medium",
                    active === id
                      ? "bg-[#f0f0f0] text-[#1a1a1a]"
                      : "text-[#555] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]",
                  )}
                >
                  <Icon size={16} weight={active === id ? "fill" : "regular"} />
                  {label}
                </a>
              )
            )}
          </nav>

          <div className="flex-1" />

          {/* Invite friends */}
          <div className="mx-3 mb-2 p-3 bg-[#f5f5f5] border border-[#e5e7eb] rounded-xl shrink-0">
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#FF4F17] flex items-center justify-center shrink-0">
                <Gift size={14} color="white" weight="fill" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-[#1a1a1a]">Invite friends</p>
                <p className="text-[11px] text-[#888] mt-0.5">Get up to ₹1500 off</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Account — bottom, triggers flyout */}
        <div
          className="shrink-0 border-t border-[#f0f0f0] px-2 py-2"
          onMouseEnter={() => setAccountOpen(true)}
          onMouseLeave={() => setAccountOpen(false)}
        >
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-[#1a1a1a] hover:bg-[#f5f5f5] transition-colors">
            <UserCircle size={20} weight="regular" className="text-[#555]" />
            My Account
          </button>
        </div>
      </aside>

      {/* Business flyout — fixed, to the right of sidebar */}
      {businessOpen && (
        <div
          className="fixed left-[248px] w-[480px] bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-[9999] p-4"
          style={{ top: businessY }}
          onMouseEnter={() => setBusinessOpen(true)}
          onMouseLeave={() => setBusinessOpen(false)}
        >
          <p className="text-[12px] font-semibold text-[#888] mb-3 uppercase tracking-wider">Other business services</p>
          <div className="grid grid-cols-2 gap-3">
            {BUSINESS_MENU.map(({ label, desc, href, Icon }) => (
              <a
                key={label}
                href={href}
                className="flex gap-3 p-3 rounded-xl hover:bg-[#fafafa] transition-colors group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#f0f0f0] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={16} className="text-[#555]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#444] transition-colors">{label}</span>
                    <CaretRight size={12} className="text-[#aaa] group-hover:text-[#555] transition-colors shrink-0" />
                  </div>
                  <p className="text-[11px] text-[#888] mt-0.5 leading-relaxed whitespace-pre-line">{desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* My Account flyout — fixed, to the right of sidebar */}
      {accountOpen && (
        <div
          className="fixed bottom-4 left-[248px] w-[220px] bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] z-[9999] pb-1"
          onMouseEnter={() => setAccountOpen(true)}
          onMouseLeave={() => setAccountOpen(false)}
        >
          <div className="px-4 py-3 bg-[#fff8f6] rounded-t-2xl border-b border-[#f0f0f0]">
            <p className="text-[11px] text-[#888]">You are logged in with</p>
            <p className="text-[14px] font-medium text-[#1a1a1a] mt-0.5">+91 99999 99999</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1 bg-white border border-[#f0e0d6] rounded-full px-2 py-1">
                <Lightning size={12} weight="fill" className="text-[#f59e0b]" />
                <span className="text-[11px] font-bold text-[#1a1a1a]">0</span>
              </div>
              <div className="flex items-center gap-1 bg-white border border-[#f0e0d6] rounded-full px-2 py-1">
                <Wallet size={12} className="text-[#888]" />
                <span className="text-[11px] font-bold text-[#1a1a1a]">0</span>
              </div>
            </div>
          </div>
          <div className="py-1">
            {ACCOUNT_MENU.map(({ label, Icon, href }) => (
              <a
                key={label}
                href={href}
                className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#333] hover:bg-[#fafafa] transition-colors"
              >
                <Icon size={16} weight="regular" className="text-[#888]" />
                {label}
              </a>
            ))}
            <a
              href="/logout"
              className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#FF4F17] font-semibold hover:bg-[#fafafa] transition-colors border-t border-[#f0f0f0]"
            >
              <SignOut size={16} weight="regular" className="text-[#FF4F17]" />
              Logout
            </a>
          </div>
        </div>
      )}
    </>
  );
}
