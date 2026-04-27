"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/AppSidebar";

/* ─── Tiny icon helpers (page-local only) ────────────────── */
const Ic = {
  ChevRight: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  ChevLeft: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevDown: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Swap: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/>
    </svg>
  ),
  Check: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  User: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
};

/* ─── Flight Search Card ─────────────────────────────────── */
function FlightSearch() {
  const [tripType, setTripType] = useState<"oneway" | "roundtrip">("oneway");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [nonstop, setNonstop] = useState(false);
  const [bizFare, setBizFare] = useState(true);

  const swap = () => { const t = from; setFrom(to); setTo(t); };

  const departLabel = new Date("2026-04-28").toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  return (
    <Card className="gap-0 p-0 rounded-[12px] shadow-[0_2px_16px_rgba(0,0,0,0.10)] ring-0">

      {/* ── Row 1: trip type + passengers ── */}
      <CardContent className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-6">
          {[
            { val: "oneway", label: "One way" },
            { val: "roundtrip", label: "Round trip" },
          ].map((t) => (
            <Label
              key={t.val}
              className="flex items-center gap-2 cursor-pointer text-[15px] text-[#333] font-medium"
              onClick={() => setTripType(t.val as "oneway" | "roundtrip")}
            >
              <div
                className={cn(
                  "w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                  tripType === t.val ? "border-[#1a1a1a]" : "border-[#bbb]",
                )}
              >
                {tripType === t.val && (
                  <div className="w-[10px] h-[10px] rounded-full bg-[#1a1a1a]" />
                )}
              </div>
              {t.label}
            </Label>
          ))}
        </div>

        <Button
          variant="ghost"
          className="gap-1.5 text-[14px] text-[#333] font-medium hover:text-[#1a1a1a] h-auto px-2 py-1"
        >
          <Ic.User />
          1 Adult, Economy
          <Ic.ChevDown />
        </Button>
      </CardContent>

      <Separator />

      {/* ── Row 2: From / Swap / To ── */}
      <div className="flex items-stretch">
        <div className="flex-1 min-w-0 flex items-center gap-3 px-5 py-4 hover:bg-[#fafbfd] cursor-pointer transition-colors">
          <span className="text-[#bcc5d3] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2h-3"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Where from?"
            className="border-0 shadow-none focus-visible:ring-0 h-auto p-0 text-[18px] font-semibold text-[#1a1a1a] placeholder:text-[#bcc5d3]"
          />
        </div>

        <Separator orientation="vertical" className="self-stretch" />
        <div className="flex items-center px-2">
          <Button
            variant="outline"
            size="icon"
            onClick={swap}
            className="w-9 h-9 rounded-full text-[#8896ab] hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
          >
            <Ic.Swap />
          </Button>
        </div>
        <Separator orientation="vertical" className="self-stretch" />

        <div className="flex-1 min-w-0 flex items-center gap-3 px-5 py-4 hover:bg-[#fafbfd] cursor-pointer transition-colors">
          <span className="text-[#bcc5d3] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
          </span>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Where to?"
            className="border-0 shadow-none focus-visible:ring-0 h-auto p-0 text-[18px] font-semibold text-[#1a1a1a] placeholder:text-[#bcc5d3]"
          />
        </div>
      </div>

      <Separator />

      {/* ── Row 3: Departure / Return ── */}
      <div className="flex">
        <div className="flex-1 flex items-center gap-3 px-5 py-4 hover:bg-[#fafbfd] cursor-pointer transition-colors">
          <span className="text-[#bcc5d3] shrink-0"><Ic.Calendar /></span>
          <div>
            <span className="text-[18px] font-semibold text-[#1a1a1a]">{departLabel}</span>
            <p className="text-[11px] text-[#999] mt-0.5">Departure</p>
          </div>
        </div>
        <Separator orientation="vertical" className="self-stretch" />
        <div
          className={cn(
            "flex-1 flex items-center gap-3 px-5 py-4 transition-colors",
            tripType === "roundtrip" ? "hover:bg-[#fafbfd] cursor-pointer" : "cursor-default",
          )}
        >
          <span className="text-[#bcc5d3] shrink-0"><Ic.Calendar /></span>
          <div>
            <span className={cn("text-[18px] font-semibold", tripType === "roundtrip" ? "text-[#1a1a1a]" : "text-[#bcc5d3]")}>
              Return
            </span>
            <p className={cn("text-[11px] mt-0.5", tripType === "roundtrip" ? "text-[#999]" : "text-[#bcc5d3]")}>
              {tripType === "roundtrip" ? "Return date" : "Tap to add a return date"}
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Row 4: Fare type grid ── */}
      <div className="flex">
        {/* Business Fares */}
        <button
          onClick={() => setBizFare(!bizFare)}
          className="flex-1 flex items-start gap-2.5 px-4 py-3 hover:bg-[#fafbfd] transition-colors text-left"
        >
          <Checkbox
            checked={bizFare}
            className="mt-0.5 shrink-0 data-checked:bg-ct-blue data-checked:border-ct-blue"
            onCheckedChange={(v) => setBizFare(!!v)}
          />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight">Business Fares by Cleartrip</p>
            <p className="text-[11px] text-[#888] mt-0.5">Unlock 10% extra savings</p>
          </div>
          <Badge className="shrink-0 bg-ct-orange text-white text-[7.5px] font-extrabold px-1.5 h-auto py-0.5 rounded uppercase tracking-wide mt-0.5">
            SAVE MORE
          </Badge>
        </button>

        <Separator orientation="vertical" className="self-stretch" />

        {/* Other fare types */}
        {[
          { label: "Student", sub: "Extra baggage, discounts" },
          { label: "Senior citizen", sub: "Up to ₹600 off" },
          { label: "Armed forces", sub: "Up to ₹600 off" },
        ].map((ft, i, arr) => (
          <div key={ft.label} className="flex flex-1">
            <button className="flex-1 flex flex-col items-start px-4 py-3 hover:bg-[#fafbfd] transition-colors text-left">
              <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight">{ft.label}</p>
              <p className="text-[11px] text-[#888] mt-0.5">{ft.sub}</p>
            </button>
            {i < arr.length - 1 && <Separator orientation="vertical" className="self-stretch" />}
          </div>
        ))}
      </div>

      <Separator />

      {/* ── Row 5: Non-stop + Search ── */}
      <CardContent className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Switch
            checked={nonstop}
            onCheckedChange={setNonstop}
            className="data-checked:bg-[#1a1a1a]"
            size="default"
          />
          <Label className="text-[14px] text-[#444] font-medium cursor-pointer" onClick={() => setNonstop(!nonstop)}>
            Non-stop flights only
          </Label>
        </div>

        <Button
          className="bg-ct-orange hover:bg-ct-orange-dark text-white font-bold text-[16px] px-14 py-3 h-auto rounded-[8px] shadow-sm"
        >
          Search flights
        </Button>
      </CardContent>
    </Card>
  );
}

/* ─── Side Panel ─────────────────────────────────────────── */
function SidePanel() {
  const [slide, setSlide] = useState(0);
  const slides = [
    {
      img: "https://picsum.photos/seed/india-flights-warm/560/320",
      eyebrow: "DOMFLASH", badge: "Tatakal Sale",
      tagline: "Daily 12 – 2 PM", headline: "Domestic Flights",
      price: "Starting ₹999", sponsor: "SBI", sponsorFull: "SBI Card", sponsorBg: "#003399",
    },
    {
      img: "https://picsum.photos/seed/international-sky/560/320",
      eyebrow: "INTFLASH", badge: "Weekend Offer",
      tagline: "Sat & Sun only", headline: "International Flights",
      price: "From ₹2,499", sponsor: "HDFC", sponsorFull: "HDFC Bank Card", sponsorBg: "#004c97",
    },
  ];
  const s = slides[slide];

  return (
    <div className="w-[248px] shrink-0 flex flex-col gap-3">
      {/* Main promo card */}
      <Card className="gap-0 p-0 rounded-[12px] ring-0 shadow-[0_4px_16px_rgba(0,0,0,0.10)] overflow-hidden border border-[#e2e8f4]">
        <div className="relative h-[120px]">
          <Image src={s.img} alt={s.headline} fill className="object-cover" sizes="248px" />
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <Badge className="text-[8.5px] font-extrabold bg-[#0a1f6e] text-white h-auto px-2 py-[3px] rounded uppercase tracking-widest">
              {s.eyebrow}
            </Badge>
            <Badge className="text-[8.5px] font-extrabold bg-[#FFD600] text-[#1a1a1a] h-auto px-2 py-[3px] rounded uppercase tracking-widest">
              {s.badge}
            </Badge>
          </div>
        </div>

        <CardContent className="px-3 pt-2.5 pb-2">
          <div className="flex items-center gap-1 mb-1.5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="text-[10px] font-semibold text-[#555]">{s.tagline}</span>
          </div>
          <p className="text-[13px] font-semibold text-[#444] leading-tight">{s.headline}</p>
          <p className="text-[22px] font-extrabold text-[#1a1a1a] leading-tight mt-0.5">{s.price}</p>
        </CardContent>

        <Separator />
        <div className="px-3 py-2 flex items-center gap-2">
          <div
            className="h-5 px-2 rounded flex items-center justify-center text-white text-[9px] font-extrabold shrink-0 tracking-wider"
            style={{ backgroundColor: s.sponsorBg }}
          >
            {s.sponsor}
          </div>
          <p className="text-[10px] text-[#666]">Valid on {s.sponsorFull} &amp; EMI Trans.</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-2.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={cn("rounded-full transition-all duration-200", i === slide ? "w-4 h-1.5 bg-[#1a1a1a]" : "w-1.5 h-1.5 bg-[#ddd]")}
            />
          ))}
        </div>
      </Card>

      {/* More offers card */}
      <Card className="gap-0 p-0 rounded-[12px] ring-0 shadow-[0_4px_16px_rgba(0,0,0,0.10)] border border-[#e2e8f4]">
        <CardContent className="flex items-center justify-between px-3.5 pt-3 pb-2">
          <span className="text-[13px] font-bold text-[#1a1a1a]">More offers</span>
          <Button variant="link" className="text-[11px] h-auto p-0 text-ct-blue">View all</Button>
        </CardContent>
        <Separator />
        <CardContent className="px-3.5 py-3">
          <div className="flex items-start gap-2 mb-2">
            <div className="w-9 h-9 rounded-[8px] bg-ct-blue-light flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a6af4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 4c-1 0-2 .5-2.5 1.5L13 9 4.8 6.2C3.5 5.7 2 6.3 2 7.6c0 .6.3 1.2.8 1.5l5.4 3.4-2.5 3.5c-.5.5-.7 1.2-.5 1.9.3.9 1.2 1.5 2.1 1.3l3.4-.8L12 20l4.2.8c.3.1.5.1.8 0 .7-.3 1.1-1.1.8-1.6z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-bold text-[#1a1a1a] leading-tight">Live Flight Tracking!</p>
              <p className="text-[10.5px] text-[#777] mt-0.5 leading-snug">Track your flight in real-time with Cleartrip.</p>
            </div>
          </div>
          <Button variant="link" className="text-[11px] h-auto p-0 text-ct-blue">Know more →</Button>
        </CardContent>
        <Separator />
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full text-[#aab4c4] hover:border-ct-blue hover:text-ct-blue">
            <Ic.ChevLeft />
          </Button>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn("rounded-full", i === 0 ? "w-3 h-1.5 bg-[#aab4c4]" : "w-1.5 h-1.5 bg-[#dde3ee]")} />
            ))}
          </div>
          <Button variant="outline" size="icon" className="w-6 h-6 rounded-full text-[#aab4c4] hover:border-ct-blue hover:text-ct-blue">
            <Ic.ChevRight />
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Coupon Card System ─────────────────────────────────── */
function NVSBadge() {
  return (
    <div className="flex flex-col items-center overflow-hidden rounded-[4px] shadow-sm shrink-0">
      <div className="bg-[#d94b11] text-white text-[5.5px] font-extrabold uppercase tracking-wider px-1.5 py-[1.5px] w-full text-center leading-tight">NATION</div>
      <div className="bg-ct-orange text-white text-[5.5px] font-extrabold uppercase tracking-wider px-1.5 py-[1.5px] w-full text-center leading-tight">VACATION</div>
      <div className="bg-[#FFD600] text-[#1a1a1a] text-[5.5px] font-extrabold uppercase tracking-wider px-1.5 py-[1.5px] w-full text-center leading-tight">SALE ✦</div>
    </div>
  );
}

type CouponCardData = {
  code: string;
  img: string;
  title: string;
  sub: string;
  nvs?: boolean;
  flashSale?: boolean;
  flashTime?: string;
  banks?: { name: string; bg: string; fg: string }[];
};

const couponCards: CouponCardData[] = [
  { code: "BRICK", img: "https://picsum.photos/seed/city-india-warm/600/340", title: "Up to 25% off", sub: "on Domestic Flights", banks: [{ name: "sbi card", bg: "#003399", fg: "#fff" }, { name: "Axis", bg: "#820000", fg: "#fff" }] },
  { code: "UPGRADE FOR LESS", img: "https://picsum.photos/seed/flash-travel-sky/600/340", title: "Up to 50% off", sub: "on best airfares", flashSale: true, flashTime: "Daily 7 – 9 PM", banks: [{ name: "Paytm", bg: "#00b9f1", fg: "#fff" }, { name: "Air India", bg: "#b22222", fg: "#fff" }] },
  { code: "CTMNV", img: "https://picsum.photos/seed/travel-green-hills/600/340", title: "Up to ₹5000 off", sub: "on your next flight booking", nvs: true },
  { code: "CTPAAEE | CTKSBC", img: "https://picsum.photos/seed/airplane-blue-wide/600/340", title: "Up to 7% off", sub: "on unlimited bookings", nvs: true, banks: [{ name: "Axis Bank", bg: "#820000", fg: "#fff" }, { name: "PayPal", bg: "#003087", fg: "#fff" }] },
  { code: "CTMSPL", img: "https://picsum.photos/seed/sky-blue-flight/600/340", title: "Up to ₹10,000 off", sub: "on Domestic Airline Flights", banks: [{ name: "IndiGo", bg: "#1a2b8c", fg: "#fff" }] },
  { code: "FAMILYTRIP", img: "https://picsum.photos/seed/family-beach-fun/600/340", title: "Flat 15% off", sub: "for 2 or more travellers", nvs: true },
  { code: "INTDOTD", img: "https://picsum.photos/seed/japan-mountain-snow/600/340", title: "Flat 15% off", sub: "on Japan, China & Primepoints" },
  { code: "CTAABHL", img: "https://picsum.photos/seed/business-class-flight/600/340", title: "Up to ₹10,000 off", sub: "on Air India Business & Premium Economy Seat", nvs: true },
];

function OfferCardGrid() {
  const rows = [couponCards.slice(0, 4), couponCards.slice(4, 8)];
  return (
    <div className="space-y-3">
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-4 gap-3">
          {row.map((card, ci) => (
            <div
              key={ci}
              className="relative rounded-[10px] overflow-hidden cursor-pointer group hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,0,0.20)] transition-all"
              style={{ height: 148 }}
            >
              <Image src={card.img} alt={card.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 1260px) 25vw, 285px" />
              <div className="absolute inset-0 bg-linear-to-br from-black/50 via-black/25 to-black/5" />
              <div className="absolute inset-0 bg-linear-to-t from-black/65 via-transparent to-transparent" />
              {card.flashSale && <div className="absolute inset-0 bg-linear-to-r from-[#05174a]/60 to-transparent" />}

              {/* Top row */}
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-1">
                <Badge variant="outline" className="bg-white border-[#d0d6e0] shadow-[0_1px_4px_rgba(0,0,0,0.15)] text-[10px] font-semibold text-[#1a1a1a] tracking-wide rounded-full px-2.5 py-[3px] h-auto">
                  {card.code}
                </Badge>
                {card.nvs && <NVSBadge />}
                {card.flashSale && (
                  <Badge className="text-[7px] font-extrabold text-[#1a1a1a] bg-[#FFD600] h-auto px-1.5 py-0.5 rounded uppercase tracking-wide">
                    iFlash Sale ⚡
                  </Badge>
                )}
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                {card.flashTime && (
                  <Badge className="bg-ct-orange text-white text-[8px] font-bold h-auto px-2 py-[2px] rounded-full mb-1 tracking-wide">
                    {card.flashTime}
                  </Badge>
                )}
                <p className="text-[17px] font-extrabold text-white leading-tight drop-shadow">{card.title}</p>
                <p className="text-[10px] text-white/80 font-medium mt-0.5 line-clamp-1">{card.sub}</p>
                {card.banks && card.banks.length > 0 && (
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {card.banks.map((b) => (
                      <Badge
                        key={b.name}
                        className="text-[7.5px] font-bold h-auto px-1.5 py-[2px] rounded-[3px] uppercase tracking-wide"
                        style={{ backgroundColor: b.bg, color: b.fg }}
                      >
                        {b.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Promo Banner ───────────────────────────────────────── */
const airlines = ["IndiGo", "Air India", "Akasa Air", "Vistara", "Malaysia", "SpiceJet", "GoFirst", "Vistara"];

function PromoBanner() {
  return (
    <Card className="gap-0 p-0 rounded-[12px] ring-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-ct-border overflow-hidden">
      <div className="relative h-[155px]">
        <Image src="https://picsum.photos/seed/airplane-wide/1400/500" alt="Flight deals" fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-linear-to-r from-[#001e70]/85 via-[#001e70]/55 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-10">
          <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1">Cleartrip Exclusive</p>
          <h2 className="text-[28px] font-extrabold text-white leading-none">Up to 25% off</h2>
          <p className="text-[14px] font-semibold text-white/80 mt-0.5">on Flights</p>
        </div>
        <div className="absolute right-5 bottom-3 top-3 flex items-center">
          <Button className="bg-ct-orange hover:bg-ct-orange-dark text-white text-[12px] font-bold px-5 py-2 h-auto rounded-[6px]">
            Book Now
          </Button>
        </div>
      </div>
      <div className="bg-white px-8 py-3 flex items-center gap-8 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        {airlines.map((name) => (
          <Button
            key={name}
            variant="ghost"
            className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-[#666] hover:text-[#1a1a1a] h-auto p-0"
          >
            {name}
          </Button>
        ))}
      </div>
    </Card>
  );
}

/* ─── Popular Destinations ───────────────────────────────── */
const destinations = [
  { city: "Goa", count: "605 Properties", img: "https://picsum.photos/seed/goa-beach/440/340" },
  { city: "Delhi", count: "620 Properties", img: "https://picsum.photos/seed/delhi-india/440/340" },
  { city: "Bangalore", count: "550 Properties", img: "https://picsum.photos/seed/bangalore-city/440/340" },
  { city: "Jaipur", count: "310 Properties", img: "https://picsum.photos/seed/jaipur-fort/440/340" },
  { city: "Pattaya", count: "980 Properties", img: "https://picsum.photos/seed/pattaya-sea/440/340" },
];

function PopularDestinations() {
  return (
    <div>
      <h2 className="text-[16px] font-semibold text-[#1a1a1a] mb-3">Popular destinations</h2>
      <div className="flex gap-3">
        {destinations.map((d, i) => (
          <div key={i} className="flex-1 rounded-[10px] overflow-hidden cursor-pointer group hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.14)] transition-all border border-ct-border">
            <div className="relative h-[130px]">
              <Image src={d.img} alt={d.city} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="20vw" />
              <div className="absolute inset-0 bg-linear-to-t from-black/65 to-transparent" />
              <div className="absolute bottom-2.5 left-3">
                <p className="text-[15px] font-bold text-white">{d.city}</p>
                <p className="text-[10px] text-white/70">{d.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Content + FAQ ──────────────────────────────────────── */
const bullets = [
  "Browse across 500+ airlines including IndiGo, Air India, Vistara, Akasa Air, and international carriers",
  "No hidden fees — the price you see is the price you pay",
  "Flexible Booking & Cancellations — Modify or cancel with ease",
  "Best Price Guarantee — best available fares across all airlines",
  "Downloadable Digital Invoice — GST invoices for business travel",
  "24/7 Customer Support — for flight changes, cancellations, and more",
];

const faqs = [
  { q: "How to Book Flight Tickets Online on Cleartrip?", a: "Enter your source city, destination, and travel date, then click Search Flights. Browse results by price, duration, stops, or airline. Select your preferred flight, enter passenger details, and complete payment. Your e-ticket is sent instantly to your email and SMS." },
  { q: "How to Find Cheap Flights on Cleartrip?", a: "Use the Fare Calendar to compare prices across dates. Filter by non-stop flights, preferred airlines, or departure time. Book early morning or late-night flights for lower fares. Check Cleartrip Offers for exclusive discounts with partner banks." },
  { q: "How do I reschedule or cancel my flight?", a: "For most airlines, you can reschedule or cancel via the My Trips section. Fees depend on airline fare rules and how far in advance you're changing. Some promotional fares are non-refundable — check fare details before booking." },
  { q: "What payment options are available?", a: "Cleartrip accepts all major credit/debit cards, net banking from 50+ banks, UPI (Google Pay, PhonePe, Paytm, BHIM), and digital wallets. EMI options available on select cards for bookings above ₹2000." },
  { q: "Does Cleartrip offer special discounts on flight bookings?", a: "Yes. Cleartrip regularly offers bank partner discounts (HDFC, ICICI, SBI, Axis), new user offers, seasonal sale fares, and exclusive international flight deals. Check the Offers section or apply promo codes at checkout." },
];

function ContentSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-4">
      <Card className="rounded-[10px] ring-0 border border-ct-border">
        <CardContent className="p-5">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-2">Book Domestic and International Flight Tickets at Lowest Airfares on Cleartrip</h2>
          <p className="text-[12px] text-[#555] leading-relaxed mb-3">
            Cleartrip makes booking flights simple, secure, and hassle-free. Whether it&apos;s a quick domestic trip or an international getaway, you can instantly compare flights, find the lowest airfares, and book in just a few clicks.
          </p>
          <h3 className="text-[13px] font-semibold text-[#1a1a1a] mb-2">Why Choose Cleartrip for Flight Booking?</h3>
          <ul className="space-y-1.5">
            {bullets.map((bp, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-[#555]">
                <span className="text-[#888] font-bold mt-0.5 shrink-0">•</span>{bp}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="rounded-[10px] ring-0 border border-ct-border gap-0 p-0">
        <CardContent className="px-5 py-4">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">FAQs: Flight Booking on Cleartrip</h2>
        </CardContent>
        <Separator />
        {faqs.map((faq, i) => (
          <div key={i}>
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between px-5 py-3.5 text-left h-auto rounded-none hover:bg-[#fafafa]"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span className="text-[13px] font-medium text-[#1a1a1a] pr-4 whitespace-normal text-left">{faq.q}</span>
              <span className={cn("text-[#aaa] shrink-0 transition-transform duration-200", open === i && "rotate-90")}>
                <Ic.ChevRight />
              </span>
            </Button>
            {open === i && (
              <div className="px-5 pb-4 text-[12px] text-[#555] leading-relaxed bg-[#fafafa] border-t border-[#f0f0f0]">
                {faq.a}
              </div>
            )}
            {i < faqs.length - 1 && <Separator />}
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ─── Footer ─────────────────────────────────────────────── */
const footerCols: Record<string, string[]> = {
  Company: ["About Us", "Jobs", "Support", "Blog", "Cleartrip for Business", "Gift Cards"],
  "Product Offerings": ["International Flights", "Domestic Flights", "Group Bookings", "Student Fares", "Chartered Flights"],
  "Popular Domestic Flights": ["Delhi to Mumbai", "Mumbai to Delhi", "Delhi to Bangalore", "Bangalore to Delhi", "Mumbai to Goa"],
  "Popular International Flights": ["Delhi to Dubai", "Mumbai to Singapore", "Bangalore to London", "Delhi to New York", "Mumbai to Bangkok"],
  "Popular Hotels": ["Hotels in Goa", "Hotels in Delhi", "Hotels in Mumbai", "Hotels in Bangalore", "Hotels in Jaipur"],
};

function Footer() {
  return (
    <footer className="bg-white border-t border-ct-border mt-6">
      <div className="max-w-[1260px] mx-auto px-5 py-8">
        <div className="grid grid-cols-5 gap-6 pb-6 border-b border-ct-border-light">
          {Object.entries(footerCols).map(([heading, links]) => (
            <div key={heading}>
              <p className="text-[10px] font-bold text-[#1a1a1a] uppercase tracking-wider mb-3">{heading}</p>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <Button variant="link" className="text-[11px] text-[#666] hover:text-[#1a1a1a] h-auto p-0">
                      {link}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Cleartrip" width={100} height={28} className="h-7 w-auto object-contain" />
            <span className="text-[9px] text-[#bbb] italic border-l border-ct-border pl-2">A Flipkart Company</span>
          </div>
          <p className="text-[10px] text-[#bbb]">© 2026 Cleartrip Pvt. Ltd. All rights reserved.</p>
          <div className="flex items-center gap-2">
            {["f", "t", "in", "yt"].map((s) => (
              <Button key={s} variant="ghost" size="icon" className="w-6 h-6 rounded-full bg-[#f0f0f0] hover:bg-ct-orange hover:text-white text-[#999] text-[9px] font-bold uppercase">
                {s}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── NVS Hero Badge ─────────────────────────────────────── */
function NVSHeroBadge() {
  return (
    <div className="rounded-[8px] overflow-hidden shadow-md w-[88px] shrink-0">
      <div className="bg-[#0a1f6e] px-2 py-1.5 text-center">
        <p className="text-[7px] font-extrabold text-white uppercase tracking-widest leading-tight">NATION</p>
        <p className="text-[7px] font-extrabold text-white uppercase tracking-widest leading-tight">VACATION</p>
        <p className="text-[9px] font-extrabold text-[#FFD600] uppercase tracking-wider leading-tight">SALE</p>
      </div>
      <Button className="w-full bg-ct-orange hover:bg-ct-orange-dark text-white text-[8px] font-bold py-1 h-auto flex items-center justify-center gap-0.5 rounded-none">
        <svg width="6" height="8" viewBox="0 0 6 8" fill="white"><polygon points="0,0 6,4 0,8"/></svg>
        Live now
      </Button>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <AppSidebar active="flights" />

      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto bg-[#f8f9fa]" style={{ scrollbarWidth: "thin" }}>
        {/* Hero section */}
        <div className="pb-8">
          <div className="max-w-[1060px] mx-auto px-5 pt-6">
            <div className="flex gap-5">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h1 className="text-[30px] font-extrabold text-[#1a1a1a] leading-tight tracking-tight">
                      Biggest discounts on Flights
                    </h1>
                    <p className="text-[14px] text-[#555] mt-1.5">
                      Up to 25% off&nbsp;|&nbsp;Flights from ₹999&nbsp;|&nbsp;Free Visa Rejection Cover
                    </p>
                  </div>
                  <NVSHeroBadge />
                </div>
                <FlightSearch />

                {/* AI Planner entry-point banner */}
                <Link
                  href="/"
                  className="mt-4 flex items-center gap-4 bg-[#0a1f6e] rounded-[12px] px-5 py-4 hover:shadow-lg transition-shadow group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 text-[22px]">✨</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[14px] font-bold text-white">Try AI Trip Planner</p>
                      <span className="text-[9px] font-extrabold bg-[#FF4F17] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">NEW</span>
                    </div>
                    <p className="text-[12px] text-white/70">Describe your trip in plain English — AI plans flights, hotel & activities in one go</p>
                  </div>
                  <div className="text-white/60 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                  </div>
                </Link>
              </div>
              <SidePanel />
            </div>
          </div>
        </div>

        <div className="max-w-[1060px] mx-auto px-5 py-5">
          <div className="mb-5"><OfferCardGrid /></div>
          <div className="mb-5"><PromoBanner /></div>
          <div className="mb-5"><PopularDestinations /></div>
          <div className="mb-5"><ContentSection /></div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
