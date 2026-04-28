"use client";

import { useEffect, useRef, useState } from "react";
import {
  List as MenuIcon,
  CaretRight, CaretLeft, CaretDown,
  CalendarBlank,
  ArrowsDownUp,
  User,
  AirplaneTakeoff,
  Airplane,
  ArrowRight,
  X,
  PaperPlaneTilt,
  MapPin,
  Sparkle,
} from "@phosphor-icons/react";
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
import { AppSidebar } from "@/components/appsidebar";


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
      <CardContent className="flex items-center justify-between gap-2 px-3 sm:px-5 pt-4 sm:pt-5 pb-3 sm:pb-4 flex-wrap">
        <div className="flex items-center gap-4 sm:gap-6">
          {[
            { val: "oneway", label: "One way" },
            { val: "roundtrip", label: "Round trip" },
          ].map((t) => (
            <Label
              key={t.val}
              className="flex items-center gap-2 cursor-pointer text-[14px] sm:text-[15px] text-[#333] font-medium"
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

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            className="gap-1.5 text-[14px] text-[#333] font-medium hover:text-[#1a1a1a] h-auto px-2 py-1"
          >
            <User size={15} />
            1 Adult, Economy
            <CaretDown size={12} />
          </Button>
          <Button
            variant="outline"
            className="rounded-full border-[#d8dde6] text-[12px] font-semibold text-[#1a1a1a] hover:bg-[#fafbfd] h-auto px-3.5 py-1.5"
          >
            Track flights
          </Button>
        </div>
      </CardContent>

      <Separator />

      {/* ── Row 2: From / Swap / To ── */}
      <div className="flex items-stretch">
        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 hover:bg-[#fafbfd] cursor-pointer transition-colors">
          <span className="text-[#bcc5d3] shrink-0">
            <AirplaneTakeoff size={20} />
          </span>
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="Where from?"
            className="border-0 shadow-none focus-visible:ring-0 h-auto p-0 text-[15px] sm:text-[18px] font-semibold text-[#1a1a1a] placeholder:text-[#bcc5d3] min-w-0"
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
            <ArrowsDownUp size={18} />
          </Button>
        </div>
        <Separator orientation="vertical" className="self-stretch" />

        <div className="flex-1 min-w-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 hover:bg-[#fafbfd] cursor-pointer transition-colors">
          <span className="text-[#bcc5d3] shrink-0">
            <Airplane size={20} />
          </span>
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Where to?"
            className="border-0 shadow-none focus-visible:ring-0 h-auto p-0 text-[15px] sm:text-[18px] font-semibold text-[#1a1a1a] placeholder:text-[#bcc5d3] min-w-0"
          />
        </div>
      </div>

      <Separator />

      {/* ── Row 3: Departure / Return ── */}
      <div className="flex">
        <div className="flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 hover:bg-[#fafbfd] cursor-pointer transition-colors">
          <span className="text-[#bcc5d3] shrink-0"><CalendarBlank size={15} /></span>
          <div>
            <span className="text-[15px] sm:text-[18px] font-semibold text-[#1a1a1a]">{departLabel}</span>
            <p className="text-[11px] text-[#999] mt-0.5">Departure</p>
          </div>
        </div>
        <Separator orientation="vertical" className="self-stretch" />
        <div
          className={cn(
            "flex-1 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 transition-colors",
            tripType === "roundtrip" ? "hover:bg-[#fafbfd] cursor-pointer" : "cursor-default",
          )}
        >
          <span className="text-[#bcc5d3] shrink-0"><CalendarBlank size={15} /></span>
          <div>
            <span className={cn("text-[15px] sm:text-[18px] font-semibold", tripType === "roundtrip" ? "text-[#1a1a1a]" : "text-[#bcc5d3]")}>
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
      <div className="hidden sm:flex">
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
            <p className="text-[11px] text-[#888] mt-0.5">GST Invoice Assurance</p>
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
      <CardContent className="flex items-center justify-between gap-3 px-3 sm:px-5 py-3 sm:py-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <Switch
            checked={nonstop}
            onCheckedChange={setNonstop}
            className="data-checked:bg-[#1a1a1a]"
            size="default"
          />
          <Label className="text-[13px] sm:text-[14px] text-[#444] font-medium cursor-pointer" onClick={() => setNonstop(!nonstop)}>
            Non-stop flights only
          </Label>
        </div>

        <Button
          className="bg-ct-orange hover:bg-ct-orange-dark text-white font-bold text-[14px] sm:text-[16px] px-6 sm:px-14 py-2.5 sm:py-3 h-auto rounded-[8px] shadow-sm w-full sm:w-auto"
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
    { code: "CTFKAXIS", title: "Flat 12% off", sub: "on Flights with Flipkart", sub2: "Axis Bank Credit Cards" },
    { code: "CTHDFC", title: "Up to 15% off", sub: "on Flights with HDFC", sub2: "Bank Credit Cards" },
    { code: "CTSBIPL", title: "Flat 10% off", sub: "on Flights with SBI", sub2: "Bank Credit Cards" },
    { code: "CTICICI", title: "Up to 8% off", sub: "on Flights with ICICI", sub2: "Bank Credit Cards" },
  ];
  const s = slides[slide];

  return (
    <div className="w-full lg:w-[248px] shrink-0 flex flex-col gap-3">
      {/* Main promo card — gradient with carousel */}
      <Card className="gap-0 p-0 rounded-[12px] ring-0 shadow-[0_4px_16px_rgba(0,0,0,0.10)] overflow-hidden border-0">
        <div
          className="relative h-[150px] px-4 pt-3 pb-3 flex flex-col justify-between"
          style={{ background: "linear-gradient(135deg, #c8a4f5 0%, #8b6fcc 50%, #6d4fb8 100%)" }}
        >
          <Badge className="self-start text-[9.5px] font-bold bg-white/95 text-[#1a1a1a] h-auto px-2 py-[3px] rounded-[3px] tracking-wide shadow-sm">
            {s.code}
          </Badge>

          <div className="text-white">
            <p className="text-[20px] font-extrabold leading-tight drop-shadow-sm">{s.title}</p>
            <p className="text-[10.5px] font-medium text-white/90 mt-0.5">{s.sub}</p>
            <p className="text-[10.5px] font-medium text-white/90 leading-tight">{s.sub2}</p>
          </div>

          {/* Decorative card illustration */}
          <div className="absolute right-3 bottom-7 flex items-center">
            <div className="w-10 h-7 rounded-[3px] bg-linear-to-br from-[#FF8A65] to-[#FF5252] shadow-md rotate-[-8deg] -mr-3" />
            <div className="w-10 h-7 rounded-[3px] bg-linear-to-br from-[#FFD740] to-[#FFA000] shadow-md rotate-[6deg]" />
          </div>

          {/* Left arrow on card */}
          <button
            onClick={() => setSlide((slide - 1 + slides.length) % slides.length)}
            aria-label="Previous offer"
            className="absolute left-2 bottom-2 w-5 h-5 rounded-full bg-white/30 hover:bg-white/50 backdrop-blur-sm flex items-center justify-center text-white"
          >
            <CaretLeft size={11} weight="bold" />
          </button>

          {/* Carousel dots */}
          <div className="absolute right-3 bottom-2 flex items-center gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={cn("rounded-full transition-all", i === slide ? "w-3 h-1 bg-white" : "w-1 h-1 bg-white/50")}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* More offers section header */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[14px] font-semibold text-[#1a1a1a]">More offers</span>
        <Button variant="link" className="text-[12px] h-auto p-0 text-ct-blue font-medium">View all</Button>
      </div>

      {/* More offers card */}
      <Card className="gap-0 p-0 rounded-[12px] ring-0 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#eef0f4]">
        <CardContent className="px-4 py-4">
          <p className="text-[14px] font-bold text-[#1a1a1a] leading-tight">Live Flight Tracking!</p>
          <p className="text-[11.5px] text-[#666] mt-1 leading-snug">Book with Cleartrip and track your flight in real-time.</p>
          <p className="text-[12px] font-semibold text-[#1a1a1a] mt-2.5">Check Now</p>
          <Button variant="link" className="text-[11.5px] h-auto p-0 text-ct-blue mt-2 font-medium">Know more</Button>
        </CardContent>
        <Separator />
        <div className="flex items-center justify-between px-3.5 py-2.5">
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full text-[#aab4c4] hover:bg-[#f5f7fa]">
            <CaretLeft size={13} />
          </Button>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn("rounded-full", i === 0 ? "w-3 h-1.5 bg-[#aab4c4]" : "w-1.5 h-1.5 bg-[#dde3ee]")} />
            ))}
          </div>
          <Button variant="ghost" size="icon" className="w-6 h-6 rounded-full text-[#aab4c4] hover:bg-[#f5f7fa]">
            <CaretRight size={13} />
          </Button>
        </div>
      </Card>
    </div>
  );
}

/* ─── Recent Searches ────────────────────────────────────── */
function RecentSearches() {
  const recents = [
    { from: "Bengaluru", to: "Kolkata", date: "3 May 26" },
  ];
  return (
    <div className="mt-6">
      <h2 className="text-[15px] font-semibold text-[#1a1a1a] mb-3">Recent searches</h2>
      <div className="flex flex-wrap gap-3">
        {recents.map((r, i) => (
          <button
            key={i}
            className="flex items-center gap-3 bg-white rounded-[10px] border border-[#eef0f4] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-4 py-2.5 hover:border-[#d8dde6] hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all min-w-[220px]"
          >
            <div className="flex-1 text-left">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#1a1a1a]">
                <span>{r.from}</span>
                <ArrowRight size={12} weight="bold" className="text-[#888]" />
                <span>{r.to}</span>
              </div>
              <p className="text-[11px] text-[#888] mt-0.5">{r.date}</p>
            </div>
            <CaretRight size={14} className="text-[#bbb]" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Coupon Card System ─────────────────────────────────── */
type CouponCardData = {
  label: string;
  title: string;
  sub: string;
  bg: string;
  textTone: "light" | "dark";
  emoji: string;
  brand?: { name: string; bg: string; fg: string };
};

const couponCards: CouponCardData[] = [
  {
    label: "YOUR NEXT TRIP STARTS HERE",
    title: "Up to 25% off",
    sub: "on Domestic Flights",
    bg: "linear-gradient(135deg, #1f2a44 0%, #3b4a72 50%, #d97a5a 100%)",
    textTone: "light",
    emoji: "✈️",
    brand: { name: "SBI Card", bg: "#003399", fg: "#fff" },
  },
  {
    label: "FLASH SALE · 7–9 PM",
    title: "Up to 50% off",
    sub: "on best airfares",
    bg: "linear-gradient(135deg, #4a5fc7 0%, #7d8ee0 60%, #f6c987 100%)",
    textTone: "light",
    emoji: "⚡",
    brand: { name: "Air India", bg: "#b22222", fg: "#fff" },
  },
  {
    label: "NATION ON VACATION",
    title: "Up to ₹5000 off",
    sub: "on your next flight booking",
    bg: "linear-gradient(135deg, #cfe9ff 0%, #a8d4f5 50%, #82b8e8 100%)",
    textTone: "dark",
    emoji: "🌴",
    brand: { name: "Cleartrip", bg: "#1a1a1a", fg: "#fff" },
  },
  {
    label: "CTFKAXIS",
    title: "Flat 12% off",
    sub: "on Flights with Flipkart Axis Bank Credit Cards",
    bg: "linear-gradient(135deg, #f9c8d5 0%, #d8a4e8 55%, #9c7bd8 100%)",
    textTone: "dark",
    emoji: "💳",
    brand: { name: "Axis Bank", bg: "#820000", fg: "#fff" },
  },
  {
    label: "CTINDIGO",
    title: "Flights starting at ₹1799",
    sub: "Summer Getaway Sale is live",
    bg: "linear-gradient(135deg, #1c2a52 0%, #2e4178 60%, #4d6bb0 100%)",
    textTone: "light",
    emoji: "🛫",
    brand: { name: "IndiGo", bg: "#1a2b8c", fg: "#fff" },
  },
  {
    label: "GIVE PEACE A CHANCE",
    title: "Low fares to celebrate",
    sub: "& encourage peace",
    bg: "linear-gradient(135deg, #bfe0ff 0%, #79b8e8 60%, #4f8fc9 100%)",
    textTone: "light",
    emoji: "🌍",
    brand: { name: "Cleartrip", bg: "#e63946", fg: "#fff" },
  },
  {
    label: "NEWLY LAUNCHED",
    title: "Fly more with FLY91",
    sub: "14 new daily flights added",
    bg: "linear-gradient(135deg, #ffd6a0 0%, #f3a36b 55%, #c47550 100%)",
    textTone: "light",
    emoji: "🌅",
    brand: { name: "FLY91", bg: "#2a4d8f", fg: "#fff" },
  },
  {
    label: "NEW ROUTE LAUNCHED",
    title: "Two flights daily",
    sub: "between Delhi to Hanoi (Vietnam)",
    bg: "linear-gradient(135deg, #ffd1d4 0%, #f7a8a8 55%, #e87878 100%)",
    textTone: "dark",
    emoji: "🛬",
    brand: { name: "Air India", bg: "#b22222", fg: "#fff" },
  },
];

function OfferCardGrid() {
  const rows = [couponCards.slice(0, 4), couponCards.slice(4, 8)];
  return (
    <div className="space-y-3">
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {row.map((card, ci) => {
            const isLight = card.textTone === "light";
            return (
              <div
                key={ci}
                className="relative rounded-[12px] overflow-hidden cursor-pointer group hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.16)] transition-all shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                style={{ height: 148, background: card.bg }}
              >
                {/* Soft glow blob behind illustration */}
                <div
                  className={cn(
                    "absolute -right-6 -top-6 w-28 h-28 rounded-full blur-2xl opacity-50",
                    isLight ? "bg-white/30" : "bg-white/60",
                  )}
                />

                {/* Right-side decorative emoji illustration */}
                {/* <div className="absolute right-2 bottom-2 text-[68px] leading-none select-none drop-shadow-md opacity-90 group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                  {card.emoji}
                </div> */}

                {/* Top label */}
                <div className="absolute top-3 left-3 right-3">
                  <span
                    className={cn(
                      "inline-block text-[8.5px] font-bold uppercase tracking-[0.08em] px-2 py-[3px] rounded-[3px]",
                      isLight ? "bg-white/25 text-white backdrop-blur-sm" : "bg-white/70 text-[#1a1a1a]",
                    )}
                  >
                    {card.label}
                  </span>
                </div>

                {/* Title block */}
                <div className="absolute left-3 right-3 top-[42px]">
                  <p
                    className={cn(
                      "text-[17px] font-extrabold leading-tight tracking-tight",
                      isLight ? "text-white drop-shadow-sm" : "text-[#1a1a1a]",
                    )}
                  >
                    {card.title}
                  </p>
                  <p
                    className={cn(
                      "text-[10.5px] font-medium mt-1 leading-snug line-clamp-2 pr-12",
                      isLight ? "text-white/85" : "text-[#1a1a1a]/70",
                    )}
                  >
                    {card.sub}
                  </p>
                </div>

                {/* Brand chip bottom-left */}
                {card.brand && (
                  <div className="absolute bottom-3 left-3">
                    <Badge
                      className="text-[8.5px] font-extrabold h-auto px-2 py-[3px] rounded-[3px] uppercase tracking-wide shadow-sm"
                      style={{ backgroundColor: card.brand.bg, color: card.brand.fg }}
                    >
                      {card.brand.name}
                    </Badge>
                  </div>
                )}
              </div>
            );
          })}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {destinations.map((d, i) => (
          <div key={i} className="rounded-[10px] overflow-hidden cursor-pointer group hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.14)] transition-all border border-ct-border">
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
                <CaretRight size={13} />
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
      <div className="max-w-[1260px] mx-auto px-3 sm:px-5 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 pb-6 border-b border-ct-border-light">
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
        <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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

/* ─── Plan Trip Modal ────────────────────────────────────── */
type ItineraryStop = { n: number; time: string; place: string; sub: string; top: string; left: string };

const DAY_1_STOPS: ItineraryStop[] = [
  { n: 1, time: "8:00 AM", place: "Ferry Building",  sub: "Waterfront market & breakfast", top: "32%", left: "62%" },
  { n: 2, time: "10:00 AM", place: "Coit Tower",     sub: "Telegraph Hill viewpoint",      top: "28%", left: "55%" },
  { n: 3, time: "12:30 PM", place: "Chinatown",      sub: "Dim sum lunch on Grant Ave",    top: "36%", left: "50%" },
  { n: 4, time: "3:00 PM",  place: "Mission District", sub: "Murals & Dolores Park",       top: "62%", left: "44%" },
];

const DAY_2_STOPS: ItineraryStop[] = [
  { n: 5, time: "9:00 AM",  place: "Golden Gate Park",  sub: "Japanese Tea Garden",  top: "44%", left: "22%" },
  { n: 6, time: "12:00 PM", place: "Haight-Ashbury",    sub: "Vintage cafés & shops", top: "50%", left: "38%" },
  { n: 7, time: "4:00 PM",  place: "Twin Peaks",        sub: "Sunset city panorama",  top: "70%", left: "40%" },
];

function StopRow({ s }: { s: ItineraryStop }) {
  return (
    <div className="flex gap-3 py-2.5">
      <div className="shrink-0 w-7 h-7 rounded-full bg-ct-blue text-gray-600 text-[11px] font-extrabold flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.15)]">
        {s.n}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10.5px] font-semibold text-[#888]">{s.time}</p>
        <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight truncate">{s.place}</p>
        <p className="text-[11px] text-[#666] truncate">{s.sub}</p>
      </div>
    </div>
  );
}

function PlanTripModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const allStops = [...DAY_1_STOPS, ...DAY_2_STOPS];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[820px] max-h-[92vh] overflow-hidden bg-white rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-[8px] border border-ct-border bg-white flex items-center justify-center text-[#666] hover:bg-[#f5f7fa] hover:text-[#1a1a1a] transition-colors z-20"
        >
          <X size={14} weight="bold" />
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <Badge className="bg-[#e8f1ff] text-ct-blue text-[10px] font-bold tracking-wide px-2.5 py-1 h-auto rounded-full mb-3 hover:bg-[#e8f1ff]">
            <Sparkle size={10} weight="fill" className="mr-1" />
            NEW
          </Badge>
          <h2 className="text-[24px] sm:text-[26px] font-extrabold text-[#1a1a1a] leading-tight tracking-tight">
            Plan it perfectly with Cleartrip
          </h2>
          <p className="text-ct-sm text-[#666] mt-1.5">
            Waterfront to Twin Peaks — a 2-day route through San Francisco.
          </p>
        </div>

        {/* Body: map + scrollable itinerary */}
        <div className="flex flex-col md:flex-row gap-4 px-6 pb-2 min-h-0 flex-1">
          {/* Map column */}
          <div className="relative flex-1 min-w-0 rounded-[12px] overflow-hidden border border-ct-border bg-[#eef3f8] h-[300px] md:h-auto md:min-h-[420px]">
            <iframe
              title="Trip map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-122.5200%2C37.7100%2C-122.3850%2C37.8150&layer=mapnik"
              className="absolute inset-0 w-full h-full border-0"
              loading="lazy"
            />
            {/* Pin overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {allStops.map((s) => (
                <div
                  key={s.n}
                  className="absolute -translate-x-1/2 -translate-y-full"
                  style={{ top: s.top, left: s.left }}
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-ct-orange border-[3px] border-white shadow-[0_3px_8px_rgba(0,0,0,0.25)] flex items-center justify-center text-[12px] font-extrabold text-white">
                      {s.n}
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
                  </div>
                </div>
              ))}
            </div>
            {/* Map title chip */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-[8px] px-3 py-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.12)] flex items-center gap-1.5">
              <MapPin size={12} weight="fill" className="text-ct-orange" />
              <span className="text-[11px] font-semibold text-[#1a1a1a]">San Francisco</span>
            </div>
          </div>

          {/* Itinerary column (scrollable) */}
          <div
            className="md:w-[280px] shrink-0 rounded-[12px] border border-ct-border bg-white overflow-y-auto max-h-[300px] md:max-h-none"
            style={{ scrollbarWidth: "thin" }}
          >
            <div className="px-4 pt-4 pb-2 sticky top-0 bg-white border-b border-ct-border-light z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ct-blue">Day 1</p>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">Waterfront & Mission</p>
            </div>
            <div className="px-4 divide-y divide-ct-border-light">
              {DAY_1_STOPS.map((s) => <StopRow key={s.n} s={s} />)}
            </div>

            <div className="px-4 pt-4 pb-2 sticky top-0 bg-white border-y border-ct-border-light z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ct-blue">Day 2</p>
              <p className="text-[13px] font-semibold text-[#1a1a1a]">Parks & Peaks</p>
            </div>
            <div className="px-4 pb-3 divide-y divide-ct-border-light">
              {DAY_2_STOPS.map((s) => <StopRow key={s.n} s={s} />)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-ct-border-light shrink-0">
          <p className="text-[11px] text-[#888]">7 stops · 2 days · Customisable</p>
          <Button
            onClick={onClose}
            className="bg-ct-orange hover:bg-ct-orange-dark text-white font-bold px-5 py-2.5 h-auto rounded-[8px] shadow-sm gap-1.5"
          >
            <PaperPlaneTilt size={14} weight="fill" className="text-white" />
            Plan a trip
            {/* <ArrowRight size={14} weight="bold" /> */}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function Home() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      if (triggeredRef.current) return;
      if (el.scrollTop > 480) {
        triggeredRef.current = true;
        setPlanModalOpen(true);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="h-screen flex overflow-hidden bg-white relative">
      <AppSidebar
        active="flights"
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {planModalOpen && <PlanTripModal onClose={() => setPlanModalOpen(false)} />}

      {/* Main scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-[#f8f9fa] w-full" style={{ scrollbarWidth: "thin" }}>
        {/* Mobile top bar with hamburger */}
        <div className="lg:hidden flex items-center gap-2 px-3 py-2.5 bg-white border-b border-[#ebebeb] sticky top-0 z-30">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-[#e5e7eb] text-[#555] hover:bg-[#f5f5f5]"
          >
            <MenuIcon size={16} />
          </button>
          <span className="text-[14px] font-semibold text-[#1a1a1a]">Flights</span>
        </div>

        {/* Hero section */}
        <div className="pb-6 lg:pb-8">
          <div className="max-w-[1060px] mx-auto px-3 sm:px-5 pt-4 lg:pt-10">
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-5">
              <div className="flex-1 min-w-0">
                <div className="mb-3">
                  <h1 className="text-[20px] sm:text-[22px] lg:text-[24px] font-extrabold text-[#1a1a1a] leading-tight tracking-tight">
                    Book Domestic & International Flight Tickets
                  </h1>
                  <p className="text-[12.5px] sm:text-[13px] text-[#666] mt-1">
                    Enjoy hassle free flight ticket bookings at lowest airfare
                  </p>
                </div>
                <FlightSearch />
                <RecentSearches />
              </div>
              <SidePanel />
            </div>
          </div>
        </div>

        <div className="max-w-[1060px] mx-auto px-3 sm:px-5 py-5">
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
