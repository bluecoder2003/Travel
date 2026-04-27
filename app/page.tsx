"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/appsidebar";
import ChipInputBar from "@/components/chipinputbar";
import {
  AirplaneTilt,
  Buildings,
  MagnifyingGlass,
  Plus,
  Globe,
  PaperPlaneTilt,
  ArrowsClockwise,
  ChatCircle,
  X,
  MapPin,
  Umbrella,
  Train,
  Compass,
  ForkKnife,
  Backpack,
  Camera,
  SunHorizon,
  Mountains,
  Waves,
  ShoppingBag,
  MusicNote,
  Church,
  Leaf,
  Tree,
  Footprints,
  Sparkle,
  Bed,
  CaretRight,
  PencilSimple,
  CalendarBlank,
  Users,
  CurrencyInr,
  ArrowRight,
  ListBullets,
  CalendarCheck,
  SkipForward,
  Swap,
} from "@phosphor-icons/react";

const TripMap = dynamic(() => import("@/components/tripmap"), { ssr: false, loading: () => <div className="w-full h-full bg-[#f5f5f0] animate-pulse" /> });

/* ── Types ─────────────────────────────────────────────── */
type Stage = "idle" | "q1" | "q2" | "planning" | "results";
interface QOption { label: string; arrow?: boolean }
interface QDef { id: string; question: string; options: QOption[]; multi?: boolean; placeholder: string; pageOf: number }
interface SummaryPair { q: string; a: string }
interface Msg { id: string; kind: "user-init" | "ai" | "summary" | "planning-done"; text?: string; pairs?: SummaryPair[] }
interface ChipCtx {
  destination: string;
  dateMode: string;
  dates: { start: string; end: string };
  quickPick: string;
  adults: number;
  children: number;
  cabinClass: string;
  budgetPreset: string;
  budgetRange: [number, number];
}

/* ── Vibe questions ─────────────────────────────────────── */
const VIBE_Q: QDef = {
  id: "vibe", pageOf: 3,
  question: "What's the vibe you're going for?",
  options: [
    { label: "Nature & outdoors", arrow: true },
    { label: "Food & culture" },
    { label: "Sightseeing & history" },
    { label: "Mix of everything" },
  ],
  placeholder: "Something else…",
};

const VIBE_FOLLOWUPS: Record<string, QDef> = {
  "Nature & outdoors": {
    id: "vibe-detail", pageOf: 3,
    question: "What kind of nature are you drawn to?",
    options: [
      { label: "Forests & hiking trails" },
      { label: "Rivers, lakes & waterfronts" },
      { label: "Gardens & parks" },
      { label: "Wildlife & bird watching" },
    ],
    placeholder: "Something else…",
  },
  "Food & culture": {
    id: "vibe-detail", pageOf: 3,
    question: "What kind of food experience?",
    options: [
      { label: "Street food & local eats" },
      { label: "Fine dining & chef's table" },
      { label: "Food markets & tours" },
      { label: "Cooking classes" },
    ],
    placeholder: "Something else…",
  },
  "Sightseeing & history": {
    id: "vibe-detail", pageOf: 3,
    question: "What draws you most?",
    options: [
      { label: "Museums & galleries" },
      { label: "Ancient ruins & monuments" },
      { label: "Architecture walks" },
      { label: "Guided heritage tours" },
    ],
    placeholder: "Something else…",
  },
  "Mix of everything": {
    id: "vibe-detail", pageOf: 3,
    question: "How do you like your days?",
    options: [
      { label: "Balanced mix of all" },
      { label: "Let AI decide" },
      { label: "Morning culture, evening leisure" },
      { label: "One new thing each day" },
    ],
    placeholder: "Something else…",
  },
};

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtChipDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${MONTH_SHORT[parseInt(m) - 1]} ${parseInt(d)}`;
}

const AI_ACKS = [
  "I love it! A few quick questions to personalise your trip:",
  "Great choice! One more thing —",
];

const STEPS = [
  { Icon: AirplaneTilt, label: "Flights", text: "Searching 847 flights DEL → GOI · May 15", result: "IndiGo 6E-2241 · ₹4,899/person · Non-stop" },
  { Icon: Buildings, label: "Hotels", text: "Checking 340+ hotels in North Goa · 4 nights", result: "Taj Fort Aguada · 5★ · ₹8,500/night" },
  { Icon: Compass, label: "Activities", text: "Curating activities: beach + culture vibes", result: "14 hand-picked experiences across 5 days" },
  { Icon: AirplaneTilt, label: "Return", text: "Searching return flights GOI → DEL · May 19", result: "IndiGo 6E-2244 · ₹5,299/person · Non-stop" },
  { Icon: CurrencyInr, label: "Budget", text: "Assembling itinerary & running budget check", result: "₹62,896 total · ₹17,104 under budget" },
];

/* ── Static data ────────────────────────────────────────── */
const PROMPT_CARD_SETS = [
  [
    { Icon: Globe, title: "Discover places to visit", sub: "What's the best island in Hawaii for a family vacation? Include a comparison of all the islands." },
    { Icon: Buildings, title: "Hotel suggestions", sub: "Show me the best five-star hotels in Taormina for March, with amenities, ratings and price range." },
    { Icon: AirplaneTilt, title: "Find flights", sub: "Find flights from SFO to Patagonia via Buenos Aires, leaving Mar 30th for 10 days." },
  ],
  [
    { Icon: ForkKnife, title: "Food & dining", sub: "What are the best local restaurants and street food spots to try in Tokyo for a first-time visitor?" },
    { Icon: Train, title: "Rail journeys", sub: "Plan a scenic train trip across Europe starting in Lisbon and ending in Budapest over 2 weeks." },
    { Icon: Umbrella, title: "Beach escapes", sub: "Suggest the best beaches in Southeast Asia for a couple looking for quiet, non-touristy spots." },
  ],
  [
    { Icon: Backpack, title: "Budget travel", sub: "How do I backpack across South America for 30 days on a ₹1,50,000 budget?" },
    { Icon: Camera, title: "Photography trips", sub: "Which destinations in Iceland are best for landscape and aurora photography in winter?" },
    { Icon: Compass, title: "Off the beaten path", sub: "Suggest some lesser-known destinations in India that are worth visiting but rarely covered in travel guides." },
  ],
  [
    { Icon: SunHorizon, title: "Weekend getaways", sub: "What are the best weekend trips from Mumbai that I can do in 2 days without flying?" },
    { Icon: MapPin, title: "City guides", sub: "Give me a 3-day itinerary for Barcelona including art, food and the best neighbourhoods to walk through." },
    { Icon: Globe, title: "Visa & travel tips", sub: "What visa do I need as an Indian passport holder to visit Europe, and what's the easiest way to apply?" },
  ],
];

const TRENDING = [
  { city: "Bali, Indonesia", img: "https://picsum.photos/seed/bali-rice/400/260" },
  { city: "Santorini, Greece", img: "https://picsum.photos/seed/santorini-gr/400/260" },
  { city: "Kyoto, Japan", img: "https://picsum.photos/seed/kyoto-japan/400/260" },
  { city: "Patagonia, Argentina", img: "https://picsum.photos/seed/patagonia-ar/400/260" },
];

type InspirationItem = {
  type: "BLOG" | "VIDEO" | "ITINERARY";
  source: string;
  title: string;
  sub: string;
  img: string;
  tags: string[];
  href: string;
};

const INSPIRATION: InspirationItem[] = [
  {
    type: "BLOG",
    source: "Lonely Planet",
    title: "3 Perfect Days in Bali",
    sub: "An itinerary for first-time visitors navigating temples, rice terraces and surf.",
    img: "https://picsum.photos/seed/bali-temple/400/280",
    tags: ["#bali", "#indonesia", "#firsttrip"],
    href: "https://www.lonelyplanet.com/articles/best-things-to-do-in-bali",
  },
  {
    type: "VIDEO",
    source: "Mark Wiens · YouTube",
    title: "Ultimate Bangkok Street Food Tour",
    sub: "Eat your way through 12 legendary stalls in one day.",
    img: "https://picsum.photos/seed/bangkok-food/400/280",
    tags: ["#bangkok", "#foodie", "#streetfood"],
    href: "https://www.youtube.com/watch?v=3S7bRzdxULg",
  },
  {
    type: "ITINERARY",
    source: "TripAdvisor",
    title: "10 Days Across the Amalfi Coast",
    sub: "Cliff towns, hidden coves and the best limoncello stops on the drive.",
    img: "https://picsum.photos/seed/amalfi-coast/400/280",
    tags: ["#italy", "#amalfi", "#roadtrip"],
    href: "https://www.tripadvisor.com/Tourism-g187779-Amalfi_Province_of_Salerno_Campania-Vacations.html",
  },
  {
    type: "BLOG",
    source: "Condé Nast Traveler",
    title: "Europe's Most Scenic Train Journeys",
    sub: "From the Glacier Express to the West Highland Line — windows worth booking a seat for.",
    img: "https://picsum.photos/seed/europe-train/400/280",
    tags: ["#europe", "#train", "#scenic"],
    href: "https://www.cntraveler.com/gallery/most-scenic-train-rides-in-europe",
  },
  {
    type: "VIDEO",
    source: "Lost LeBlancs · YouTube",
    title: "Hidden Gems of Patagonia",
    sub: "Torres del Paine trails and campsites that most tourists never find.",
    img: "https://picsum.photos/seed/patagonia-ar/400/280",
    tags: ["#patagonia", "#hiking", "#offbeat"],
    href: "https://www.youtube.com/watch?v=Dm4MkTqn_9M",
  },
  {
    type: "ITINERARY",
    source: "Travel + Leisure",
    title: "Best Ryokans in Japan",
    sub: "Six traditional inns with kaiseki dinners, onsen baths and impeccable service.",
    img: "https://picsum.photos/seed/japan-ryokan/400/280",
    tags: ["#japan", "#ryokan", "#luxury"],
    href: "https://www.travelandleisure.com/hotels/best-ryokans-japan",
  },
];

const COMMUNITY = [
  {
    user: "Anika S.",
    title: "A hidden beach in Nusa Penida worth visiting",
    img: "https://picsum.photos/seed/nusa-penida/80/60",
    tags: ["#bali", "#hidden"],
  },
  {
    user: "Rahul K.",
    title: "Best sunset spot in Uluwatu",
    img: "https://picsum.photos/seed/uluwatu/80/60",
    tags: ["#uluwatu", "#sunset"],
  },
  {
    user: "Priya M.",
    title: "Solo trip through Vietnam — 3 weeks, ₹60k",
    img: "https://picsum.photos/seed/vietnam-solo/80/60",
    tags: ["#vietnam", "#solotravel", "#budget"],
  },
];

/* ── Itinerary data ──────────────────────────────────────── */
type ActivityType = "hotel" | "beach" | "food" | "nature" | "shopping" | "culture" | "dance" | "trek" | "flight" | "sunset" | "spa" | "walk";
interface DayActivity { time: string; name: string; type: ActivityType }
interface DayPlan {
  day: number; location: string; lat: number; lng: number;
  img: string; tag: string;
  activities: DayActivity[];
  alternatives: string[][];
}

function ActivityIcon({ type, size = 15 }: { type: ActivityType; size?: number }) {
  const cls = "text-ct-action-icon";
  if (type === "hotel") return <Bed size={size} className={cls} />;
  if (type === "beach") return <Waves size={size} className={cls} />;
  if (type === "food") return <ForkKnife size={size} className={cls} />;
  if (type === "nature") return <Tree size={size} className={cls} />;
  if (type === "shopping") return <ShoppingBag size={size} className={cls} />;
  if (type === "culture") return <Church size={size} className={cls} />;
  if (type === "dance") return <MusicNote size={size} className={cls} />;
  if (type === "trek") return <Mountains size={size} className={cls} />;
  if (type === "flight") return <AirplaneTilt size={size} className={cls} />;
  if (type === "sunset") return <SunHorizon size={size} className={cls} />;
  if (type === "spa") return <Sparkle size={size} className={cls} />;
  if (type === "walk") return <Footprints size={size} className={cls} />;
  return <Compass size={size} className={cls} />;
}

const BALI_PLAN: DayPlan[] = [
  {
    day: 1, location: "Seminyak", lat: -8.692, lng: 115.165,
    img: "https://picsum.photos/seed/seminyak-beach/600/400",
    tag: "Arrival & Beach",
    activities: [
      { time: "14:00", name: "Check-in at Taj Fort Aguada", type: "hotel" },
      { time: "16:30", name: "Seminyak Beach sunset", type: "sunset" },
      { time: "19:30", name: "Dinner at Sardine Restaurant", type: "food" },
    ],
    alternatives: [
      ["Echo Beach surfing session", "Legian Beach walk", "Petitenget Beach"],
      ["La Lucciola sunset dinner", "Ku De Ta rooftop", "Merah Putih fine dining"],
    ],
  },
  {
    day: 2, location: "Ubud", lat: -8.508, lng: 115.259,
    img: "https://picsum.photos/seed/ubud-rice/600/400",
    tag: "Culture & Rice Terraces",
    activities: [
      { time: "08:00", name: "Tegallalang rice terrace trek", type: "trek" },
      { time: "11:00", name: "Ubud Monkey Forest", type: "nature" },
      { time: "14:00", name: "Ubud Market craft shopping", type: "shopping" },
      { time: "18:00", name: "Traditional Kecak fire dance", type: "dance" },
    ],
    alternatives: [
      ["Sacred Monkey Forest Sanctuary", "Campuhan Ridge Walk", "Goa Gajah temple"],
      ["Ubud Palace", "Puri Saren Royal Palace", "Tirta Empul holy spring"],
    ],
  },
  {
    day: 3, location: "Kintamani", lat: -8.239, lng: 115.375,
    img: "https://picsum.photos/seed/kintamani-volcano/600/400",
    tag: "Volcano & Hot Springs",
    activities: [
      { time: "07:00", name: "Mount Batur sunrise trek", type: "trek" },
      { time: "11:00", name: "Kintamani volcano viewpoint", type: "trek" },
      { time: "14:00", name: "Banjar hot springs soak", type: "beach" },
      { time: "18:30", name: "Local warung dinner in Ubud", type: "food" },
    ],
    alternatives: [
      ["Lake Batur boat ride", "Bali Swing experience", "Jatiluwih rice terraces"],
      ["Lovina dolphin sunrise tour", "North Bali temple circuit", "Gitgit waterfall"],
    ],
  },
  {
    day: 4, location: "Uluwatu", lat: -8.829, lng: 115.085,
    img: "https://picsum.photos/seed/uluwatu-cliff/600/400",
    tag: "Cliffs & Temples",
    activities: [
      { time: "10:00", name: "Uluwatu Temple clifftop walk", type: "culture" },
      { time: "12:30", name: "Padang Padang beach swim", type: "beach" },
      { time: "17:30", name: "Kecak dance at Uluwatu", type: "dance" },
      { time: "20:00", name: "Seafood dinner at Jimbaran Bay", type: "food" },
    ],
    alternatives: [
      ["Bingin Beach surf lesson", "Balangan Beach", "Single Fin cliff bar"],
      ["Nusa Dua water sports", "GWK Cultural Park", "Garuda Wisnu Kencana statue"],
    ],
  },
  {
    day: 5, location: "Nusa Dua", lat: -8.792, lng: 115.231,
    img: "https://picsum.photos/seed/nusa-dua-beach/600/400",
    tag: "Relaxation & Departure",
    activities: [
      { time: "09:00", name: "Nusa Dua beach morning walk", type: "walk" },
      { time: "10:30", name: "Balinese spa & massage", type: "spa" },
      { time: "13:00", name: "Farewell lunch at Bumbu Bali", type: "food" },
      { time: "17:00", name: "Depart from Ngurah Rai Airport", type: "flight" },
    ],
    alternatives: [
      ["Waterblow Nusa Dua", "Benoa Bay water sports", "South Kuta beach morning"],
      ["Seminyak last-minute shopping", "Made's Warung farewell dinner", "Airport lounge"],
    ],
  },
];

/* ── Activity customizer ─────────────────────────────────── */
function ActivityCustomizer({
  day, onClose, onSwap,
}: {
  day: DayPlan;
  onClose: () => void;
  onSwap: (dayIdx: number, slotIdx: number, newActivity: string) => void;
}) {
  const [activeSlot, setActiveSlot] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-lg pb-8 shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: "70vh", overflowY: "auto" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#e5e7eb]" />
        </div>

        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[16px] font-bold text-[#1a1a1a]">Customize Day {day.day}</p>
              <p className="text-[12px] text-ct-text-muted mt-0.5">{day.location} · {day.tag}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-ct-surface-subtle text-ct-text-muted hover:bg-[#eee] transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Current activities */}
          <p className="text-[11px] font-semibold text-ct-text-subtle uppercase tracking-wider mb-2">Current plan</p>
          <div className="space-y-1 mb-4">
            {day.activities.map((act, i) => (
              <button
                key={i}
                onClick={() => setActiveSlot(i)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors border",
                  activeSlot === i
                    ? "border-[#1a1a1a] bg-ct-surface-raised"
                    : "border-ct-border-light bg-[#fafafa] hover:border-ct-border-medium",
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-ct-surface-subtle flex items-center justify-center shrink-0">
                  <ActivityIcon type={act.type} size={14} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[13px] font-semibold truncate", activeSlot === i ? "text-[#1a1a1a]" : "text-[#1a1a1a]")}>{act.name}</p>
                  <p className="text-[11px] text-ct-text-subtle">{act.time}</p>
                </div>
                {activeSlot === i && (
                  <span className="text-[10px] font-bold text-ct-text-secondary bg-[#ebebeb] px-2 py-0.5 rounded-full shrink-0">editing</span>
                )}
              </button>
            ))}
          </div>

          {/* Alternatives */}
          {day.alternatives[activeSlot] && (
            <>
              <p className="text-[11px] font-semibold text-ct-text-subtle uppercase tracking-wider mb-2">Swap with</p>
              <div className="space-y-1.5">
                {day.alternatives[activeSlot % day.alternatives.length].map((alt, i) => (
                  <button
                    key={i}
                    onClick={() => { onSwap(day.day - 1, activeSlot, alt); onClose(); }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-ct-border hover:border-ct-border-medium hover:bg-ct-surface-raised transition-colors text-left group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-ct-surface-subtle flex items-center justify-center shrink-0 group-hover:bg-[#ebebeb] transition-colors">
                      <Compass size={16} className="text-ct-text-muted" />
                    </div>
                    <span className="text-[13px] text-ct-text-ui group-hover:text-[#1a1a1a] font-medium transition-colors">{alt}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" className="ml-auto group-hover:stroke-[#888] transition-colors"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Plan result view ────────────────────────────────────── */
function PlanResultView({
  onSelectDay, selectedDay, planUpdating,
}: {
  onSelectDay: (day: number) => void;
  selectedDay: number;
  planUpdating: boolean;
}) {
  const [days, setDays] = useState<DayPlan[]>(BALI_PLAN);
  const [customizingDay, setCustomizingDay] = useState<DayPlan | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleSwap(dayIdx: number, slotIdx: number, newActivity: string) {
    setDays(prev => prev.map((d, i) =>
      i === dayIdx
        ? { ...d, activities: d.activities.map((a, j) => j === slotIdx ? { ...a, name: newActivity } : a) }
        : d
    ));
  }

  return (
    <div className="space-y-5">
      {/* Updating banner */}
      {planUpdating && (
        <div className="flex items-center gap-2.5 bg-ct-surface-subtle border border-[#e0e0e0] rounded-xl px-4 py-2.5">
          <div className="flex gap-1 items-center">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#888] animate-bounce" style={{ animationDelay: `${i * 100}ms` }} />
            ))}
          </div>
          <p className="text-[13px] text-ct-text-secondary font-medium">Updating your plan with new details…</p>
        </div>
      )}

      {/* Header */}
      <div className={cn("flex items-center justify-between transition-opacity duration-300", planUpdating && "opacity-50")}>
        <div>
          <p className="text-[18px] font-bold text-[#1a1a1a]">Here&apos;s your Bali Itinerary</p>
          <p className="text-[13px] text-ct-text-muted mt-0.5">5 days · ₹62,896 total · ₹17,104 under budget</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3 py-1.5 rounded-full hover:bg-ct-surface-subtle transition-colors">
            Share
          </button>
          <button className="text-[12px] font-semibold text-white bg-ct-action px-3 py-1.5 rounded-full hover:bg-ct-action-hover transition-colors">
            Save trip
          </button>
        </div>
      </div>

      {/* Day cards horizontal scroll */}
      <div ref={scrollRef} className={cn("flex gap-3 overflow-x-auto pb-2 transition-opacity duration-300", planUpdating && "opacity-40 pointer-events-none")} style={{ scrollbarWidth: "none" }}>
        {days.map(d => (
          <button
            key={d.day}
            onClick={() => onSelectDay(d.day)}
            className={cn(
              "relative flex-none w-[200px] rounded-2xl overflow-hidden border-2 transition-all text-left group shrink-0",
              selectedDay === d.day ? "border-ct-border-strong shadow-[0_0_0_3px_rgba(0,0,0,0.05)]" : "border-transparent hover:border-ct-border-medium",
            )}
          >
            {/* Image */}
            <div className="relative w-full h-[110px] overflow-hidden bg-ct-surface-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.img} alt={d.location} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[#1a1a1a] text-[10px] font-bold px-2 py-0.5 rounded-full">
                Day {d.day}
              </div>
              {selectedDay === d.day && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>
            {/* Content */}
            <div className="bg-white px-3 py-2.5">
              <p className="text-[13px] font-bold text-[#1a1a1a] leading-tight">{d.location}</p>
              <p className="text-[10.5px] text-ct-text-muted mt-0.5">{d.tag}</p>
              <div className="mt-2 space-y-1">
                {d.activities.slice(0, 2).map((a, i) => (
                  <p key={i} className="text-[10.5px] text-ct-text-secondary flex items-center gap-1.5 leading-tight">
                    <ActivityIcon type={a.type} size={11} />
                    <span className="truncate">{a.name}</span>
                  </p>
                ))}
                {d.activities.length > 2 && (
                  <p className="text-[10px] text-ct-text-subtle">+{d.activities.length - 2} more activities</p>
                )}
              </div>
              {/* Customize button */}
              <button
                onClick={e => { e.stopPropagation(); setCustomizingDay(d); }}
                className="mt-2.5 w-full flex items-center justify-center gap-1 text-[10.5px] font-semibold text-ct-text-secondary bg-ct-surface-subtle hover:bg-[#ebebeb] py-1.5 rounded-lg transition-colors"
              >
                <PencilSimple size={11} />
                Customize
              </button>
            </div>
          </button>
        ))}
      </div>

      {/* Selected day detail */}
      {(() => {
        const d = days.find(day => day.day === selectedDay);
        if (!d) return null;
        return (
          <div className="bg-white border border-ct-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ct-border-light">
              <div>
                <p className="text-[14px] font-bold text-[#1a1a1a]">Day {d.day} · {d.location}</p>
                <p className="text-[11.5px] text-ct-text-muted">{d.tag}</p>
              </div>
              <button
                onClick={() => setCustomizingDay(d)}
                className="flex items-center gap-1.5 text-[11px] font-semibold text-ct-text-secondary bg-ct-surface-subtle px-3 py-1.5 rounded-full hover:bg-[#ebebeb] transition-colors"
              >
                <PencilSimple size={11} />
                Customize
              </button>
            </div>
            <div className="px-4 py-3 space-y-3">
              {d.activities.map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-ct-surface-subtle flex items-center justify-center shrink-0">
                    <ActivityIcon type={act.type} size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight">{act.name}</p>
                    <p className="text-[11px] text-ct-text-subtle mt-0.5">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Price breakdown */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Flights", price: "₹10,198", sub: "IndiGo · both ways", Icon: AirplaneTilt },
          { label: "Hotel", price: "₹34,000", sub: "Taj · 5★ · 4 nights", Icon: Bed },
          { label: "Experiences", price: "₹8,698", sub: "14 activities", Icon: Compass },
        ].map(item => (
          <div key={item.label} className="bg-white border border-ct-border rounded-xl p-3">
            <div className="w-8 h-8 rounded-lg bg-ct-surface-subtle flex items-center justify-center mb-2">
              <item.Icon size={16} className="text-ct-text-secondary" />
            </div>
            <p className="text-[14px] font-bold text-[#1a1a1a]">{item.price}</p>
            <p className="text-[10px] text-ct-text-muted mt-0.5 font-medium">{item.label}</p>
            <p className="text-[10px] text-ct-text-placeholder mt-0.5">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: "Full breakdown", Icon: ListBullets },
          { label: "Add sequence", Icon: Plus },
          { label: "Swap hotel", Icon: Swap },
          { label: "Change dates", Icon: CalendarBlank },
          { label: "Skip a day", Icon: SkipForward },
        ].map(({ label, Icon }) => (
          <button
            key={label}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3 py-1.5 rounded-full hover:bg-ct-surface-subtle hover:border-ct-border-medium transition-colors"
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Customizer modal */}
      {customizingDay && (
        <ActivityCustomizer
          day={customizingDay}
          onClose={() => setCustomizingDay(null)}
          onSwap={handleSwap}
        />
      )}
    </div>
  );
}

/* ── Planning animation ─────────────────────────────────── */
function PlanningMsg({ step }: { step: number }) {
  const allDone = step >= STEPS.length;
  return (
    <div>
      <style>{`
        @keyframes ct-fade-up {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ct-shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .ct-shimmer-text {
          background: linear-gradient(90deg, #ccc 25%, #888 50%, #ccc 75%);
          background-size: 400px 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: ct-shimmer 1.6s ease-in-out infinite;
        }
        .ct-step-in {
          animation: ct-fade-up 0.4s ease-out both;
        }
      `}</style>

      {/* Subtle header label */}
      <div className="flex items-center gap-2 mb-5">
        {allDone ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6.5" stroke="#aaa" strokeWidth="1"/>
            <path d="M4 7l2 2 4-4" stroke="#aaa" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <span className="flex gap-[3px] items-center">
            {[0,1,2].map(i => (
              <span key={i} className="w-[3px] h-[3px] rounded-full bg-[#bbb] animate-bounce" style={{ animationDelay: `${i * 160}ms` }} />
            ))}
          </span>
        )}
        <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-ct-text-subtle select-none">
          {allDone ? "Done" : "Searching"}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-5">
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          const pending = i > step;
          return (
            <div
              key={i}
              className={cn("transition-opacity duration-500 ct-step-in", pending ? "opacity-25" : "opacity-100")}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center gap-2.5">
                {/* Icon */}
                <s.Icon
                  size={13}
                  className={cn(
                    "shrink-0 transition-colors duration-300",
                    done ? "text-ct-text-disabled" : active ? "text-ct-text-muted" : "text-ct-text-disabled",
                  )}
                />

                {/* Main text */}
                {active ? (
                  <p className="text-[13px] leading-snug font-medium ct-shimmer-text flex-1">{s.text}</p>
                ) : (
                  <p className={cn(
                    "text-[13px] leading-snug font-medium flex-1 transition-colors duration-300",
                    done ? "text-ct-text-placeholder" : "text-ct-text-placeholder",
                  )}>{s.text}</p>
                )}

                {/* Done checkmark */}
                {done && (
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0">
                    <path d="M2.5 6.5l3 3 5-5.5" stroke="#bbb" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              {/* Result line */}
              {done && (
                <p className="mt-1 ml-[21px] text-[12px] text-ct-text-secondary font-medium ct-step-in" style={{ animationDelay: "0ms" }}>
                  {s.result}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#ccc] animate-bounce" style={{ animationDelay: `${i * 120}ms` }} />
      ))}
    </div>
  );
}

function Spark() {
  return (
    <div className="w-6 h-6 rounded-lg bg-ct-action-active flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
    </div>
  );
}

function SummaryBubble({ pairs }: { pairs: SummaryPair[] }) {
  return (
    <div className="flex justify-end">
      <div className="bg-ct-surface-subtle border border-ct-border rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
        {pairs.map((p, i) => (
          <div key={i} className={cn(i > 0 && "mt-2 pt-2 border-t border-ct-border")}>
            <p className="text-[11px] text-ct-text-subtle">Q: {p.q}</p>
            <p className="text-[13px] text-[#1a1a1a] font-medium mt-0.5">A: {p.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Question card ──────────────────────────────────────── */
function QuestionCard({
  q, qIdx, selected, onPick, onSubmit, onSkip,
}: {
  q: QDef; qIdx: number; selected: string[];
  onPick: (v: string) => void; onSubmit: (v: string) => void; onSkip: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [hi, setHi] = useState(-1);

  useEffect(() => { setDraft(""); setHi(-1); }, [q.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowUp") { e.preventDefault(); setHi(h => Math.max(0, h - 1)); }
      else if (e.key === "ArrowDown") { e.preventDefault(); setHi(h => Math.min(q.options.length - 1, h + 1)); }
      else if (e.key === "Enter" && hi >= 0 && !draft) {
        const lbl = q.options[hi].label;
        onPick(lbl);
        if (!q.multi) onSubmit(lbl);
      } else if (e.key === "Escape") onSkip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hi, draft, q, onPick, onSubmit, onSkip]);

  function submit() {
    if (draft.trim()) { onSubmit(draft.trim()); return; }
    if (q.multi && selected.length) { onSubmit(selected.join(" + ")); return; }
    if (!q.multi && selected.length) { onSubmit(selected[0]); }
  }

  const showDone = q.multi && selected.length > 0;
  const showSend = !showDone && !!draft.trim();

  return (
    <div className="bg-white border border-ct-border rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f5f5f5]">
        <span className="text-[15px] font-semibold text-[#1a1a1a]">{q.question}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <button className="w-6 h-6 flex items-center justify-center rounded-full text-ct-text-placeholder hover:text-ct-text-secondary hover:bg-ct-surface-subtle transition-colors">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span className="text-[12px] text-ct-text-subtle font-medium">{qIdx + 1} of {q.pageOf}</span>
            <button className="w-6 h-6 flex items-center justify-center rounded-full text-ct-text-placeholder hover:text-ct-text-secondary hover:bg-ct-surface-subtle transition-colors">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          <button onClick={onSkip} className="text-ct-text-disabled hover:text-ct-text-muted transition-colors">
            <X size={15} />
          </button>
        </div>
      </div>
      <div>
        {q.options.map((opt, i) => {
          const picked = selected.includes(opt.label);
          const highlighted = hi === i;
          return (
            <button
              key={opt.label}
              onClick={() => { onPick(opt.label); if (!q.multi) onSubmit(opt.label); }}
              className={cn(
                "w-full flex items-center gap-3.5 px-5 py-3.5 text-left border-b border-[#f5f5f5] last:border-0 transition-colors group",
                picked ? "bg-ct-surface-raised" : highlighted ? "bg-[#fafbfd]" : "hover:bg-[#fafbfd]",
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 border transition-colors",
                picked ? "bg-ct-action border-[#505050] text-white" : "bg-white border-ct-border text-ct-text-subtle",
              )}>
                {q.multi && picked ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
              </div>
              <span className={cn("flex-1 text-[14px]", picked ? "text-[#1a1a1a] font-semibold" : "text-ct-text-ui group-hover:text-[#1a1a1a]")}>
                {opt.label}
              </span>
              {opt.arrow && <CaretRight size={12} className="text-ct-text-disabled group-hover:text-ct-text-muted" />}
            </button>
          );
        })}
      </div>
      <div className="border-t border-ct-border-light flex items-center gap-2 px-3.5 py-2.5">
        <PencilSimple size={14} className="text-ct-text-placeholder shrink-0" />
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && draft.trim()) submit(); }}
          placeholder={q.placeholder}
          className="flex-1 bg-transparent text-[14px] text-[#1a1a1a] placeholder:text-ct-text-disabled outline-none"
        />
        {showDone && (
          <button onClick={submit} className="text-[12px] font-semibold text-white bg-ct-action hover:bg-ct-action-hover px-3.5 py-1.5 rounded-full transition-colors shrink-0">
            Done
          </button>
        )}
        {showSend && (
          <button onClick={submit} className="w-7 h-7 rounded-full bg-ct-orange flex items-center justify-center shrink-0 hover:bg-ct-orange-hover transition-colors">
            <PaperPlaneTilt size={13} color="white" weight="fill" />
          </button>
        )}
        {!showDone && !showSend && (
          <button onClick={onSkip} className="text-[12px] text-ct-text-placeholder hover:text-ct-text-muted px-2 transition-colors shrink-0">Skip</button>
        )}
      </div>
      <div className="bg-[#fafbfd] border-t border-ct-border-light px-5 py-1.5 flex justify-center">
        <span className="text-[10.5px] text-ct-text-disabled">↑↓ to navigate  ·  Enter to select  ·  Esc to skip</span>
      </div>
    </div>
  );
}

const RECENT_TRIPS = [
  { title: "Bali Getaway", dates: "12 – 17 Jun · 5 days", img: "https://picsum.photos/seed/bali-getaway/80/60" },
  { title: "Japan Adventure", dates: "9 – 16 Jul · 8 days", img: "https://picsum.photos/seed/japan-adv/80/60" },
  { title: "Europe Summer", dates: "2 – 12 Aug · 11 days", img: "https://picsum.photos/seed/europe-sum/80/60" },
];

/* ── Chat list panel ────────────────────────────────────── */
function ChatListPanel({ onNew, onClose }: { onNew: () => void; onClose: () => void }) {
  const [tab, setTab] = useState<"all" | "trips">("all");
  const [search, setSearch] = useState("");

  return (
    <div className="w-[272px] shrink-0 flex flex-col bg-white border-r border-ct-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ct-border-light">
        <div className="flex items-center gap-2">
          <ChatCircle size={18} weight="fill" className="text-[#1a1a1a]" />
          <span className="text-[15px] font-bold text-[#1a1a1a]">Chats</span>
          <span className="text-[11px] font-bold bg-ct-surface-deep text-ct-action-icon rounded-full px-2 py-0.5">2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 bg-ct-action text-white text-[12px] font-semibold px-3 py-1.5 rounded-full hover:bg-ct-action-hover transition-colors"
          >
            <Plus size={12} weight="bold" />
            New Chat
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-ct-text-subtle hover:bg-ct-surface-subtle hover:text-ct-text-secondary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-ct-border-light">
        <div className="flex items-center gap-2 bg-ct-surface-subtle rounded-xl px-3 py-2">
          <MagnifyingGlass size={14} className="text-ct-text-subtle shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-[13px] text-[#1a1a1a] placeholder:text-ct-text-placeholder outline-none"
          />
          <span className="text-[10px] text-ct-text-placeholder font-mono shrink-0">⌘1</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-3 pt-2.5 gap-4 border-b border-ct-border-light">
        {(["all", "trips"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "pb-2.5 text-[13px] font-semibold capitalize border-b-2 transition-colors",
              tab === t ? "border-ct-border-strong text-ct-text-ui" : "border-transparent text-ct-text-subtle hover:text-ct-text-secondary",
            )}
          >
            {t === "all" ? "All" : "Trips"}
          </button>
        ))}
      </div>

      {/* All tab — empty state */}
      {tab === "all" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 pb-8">
          <div className="w-16 h-16 rounded-2xl bg-ct-surface-subtle flex items-center justify-center">
            <ChatCircle size={32} className="text-[#ddd]" weight="fill" />
          </div>
          <p className="text-[13px] text-ct-text-subtle font-medium">No Chat History</p>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 text-[12px] text-ct-text-secondary border border-ct-border px-4 py-2 rounded-full hover:bg-ct-surface-subtle transition-colors font-medium"
          >
            <Plus size={12} weight="bold" />
            New Chat
          </button>
        </div>
      )}

      {/* Trips tab */}
      {tab === "trips" && (
        <div className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: "thin" }}>
          <p className="text-[10px] font-semibold text-ct-text-subtle uppercase tracking-wider px-1 mb-2">Your Trips</p>
          <div className="space-y-1">
            {RECENT_TRIPS.map((trip, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-ct-surface-subtle transition-colors text-left"
              >
                <div className="w-14 h-11 rounded-lg overflow-hidden shrink-0">
                  <img src={trip.img} alt={trip.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight">{trip.title}</p>
                  <p className="text-[11px] text-[#999] mt-0.5">{trip.dates}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


/* ── Right panel ────────────────────────────────────────── */
function RightPanel() {
  const [inspiTab, setInspiTab] = useState<"All" | "Blogs" | "Videos" | "Itineraries">("All");

  const filtered = inspiTab === "All"
    ? INSPIRATION
    : INSPIRATION.filter(item =>
        inspiTab === "Blogs" ? item.type === "BLOG"
        : inspiTab === "Videos" ? item.type === "VIDEO"
        : item.type === "ITINERARY"
      );

  return (
    <div className="w-[360px] shrink-0 border-l border-ct-border bg-white overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Popular right now */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-medium text-[#1a1a1a]">Popular Right Now</p>
          <button className="text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3 py-1 rounded-lg hover:bg-ct-surface-subtle transition-colors">
            See all
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TRENDING.map((d, i) => (
            <div key={i} className="cursor-pointer group">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                <Image src={d.img} alt={d.city} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="160px" />
              </div>
              <p className="mt-1.5 text-[11px] text-ct-text-secondary font-medium leading-snug">{d.city}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 h-px bg-ct-surface-deep" />

      {/* Inspiration for you */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[14px] font-medium text-[#1a1a1a]">Inspiration for you</p>
          <button className="text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3 py-1 rounded-lg hover:bg-ct-surface-subtle transition-colors shrink-0 ml-2">
            Explore
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {(["All", "Blogs", "Videos", "Itineraries"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setInspiTab(tab)}
              className={cn(
                "text-[11.5px] font-semibold px-3 py-1 rounded-full border transition-colors",
                inspiTab === tab
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "text-ct-text-secondary border-ct-border hover:bg-ct-surface-subtle",
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((item, i) => (
            <a
              key={i}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-3 group cursor-pointer"
            >
              <div className="relative w-[100px] shrink-0 rounded-xl overflow-hidden aspect-[4/3]">
                <Image src={item.img} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="100px" />
                {/* <span className={cn("absolute top-1.5 left-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide", TYPE_STYLES[item.type])}>
                  {item.type}
                </span> */}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <p className="text-[12px] font-semibold text-[#1a1a1a] leading-tight line-clamp-2 group-hover:text-ct-text-ui transition-colors">{item.title}</p>
                <p className="mt-0.5 text-[10.5px] text-ct-text-muted leading-snug line-clamp-2">{item.sub}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-ct-text-muted hover:text-ct-text-secondary transition-colors">{tag}</span>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-ct-text-placeholder">{item.source}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="mx-4 h-px bg-ct-surface-deep mt-4" />

      {/* From the community */}
      <div className="px-4 pt-3 pb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-medium text-[#1a1a1a]">From the community</p>
          <button className="text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3 py-1 rounded-lg hover:bg-ct-surface-subtle transition-colors">
            View all
          </button>
        </div>
        <div className="space-y-2.5">
          {COMMUNITY.map((post, i) => (
            <div key={i} className="flex gap-3 cursor-pointer group">
              <div className="relative w-14 h-11 rounded-lg overflow-hidden shrink-0">
                <Image src={post.img} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="56px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1a1a1a] leading-tight line-clamp-2 group-hover:text-ct-text-ui transition-colors">{post.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-ct-text-subtle">{tag}</span>
                  ))}
                </div>
                <p className="text-[10px] text-ct-text-placeholder mt-0.5">by {post.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Header trip chips (editable, appears in top bar after results) ── */
const MONTH_ABR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtHdr(iso: string) {
  const [, m, d] = iso.split("-");
  return `${MONTH_ABR[parseInt(m)-1]} ${parseInt(d)}`;
}

function HeaderTripChips({
  ctx, onCtxChange, onNewChat,
}: {
  ctx: ChipCtx;
  onCtxChange: (updated: ChipCtx) => void;
  onNewChat: () => void;
}) {
  const [open, setOpen] = useState<"dest" | "when" | "travelers" | "budget" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const BUDGET_LABELS: Record<string, string> = { budget: "Budget", mid: "Mid-range", luxury: "Luxury" };
  const destLabel = ctx.destination || "Where";
  const whenLabel = ctx.quickPick || (ctx.dates.start ? fmtHdr(ctx.dates.start) + (ctx.dates.end ? ` – ${fmtHdr(ctx.dates.end)}` : "") : "When");
  const totalTravelers = ctx.adults + ctx.children;
  const travelLabel = totalTravelers > 0 ? `${totalTravelers} traveler${totalTravelers !== 1 ? "s" : ""}` : "Travelers";
  const budgetLabel = BUDGET_LABELS[ctx.budgetPreset] || "Budget";

  const chips = [
    { id: "dest" as const, label: destLabel, filled: !!ctx.destination },
    { id: "when" as const, label: whenLabel, filled: !!(ctx.dates.start || ctx.quickPick) },
    { id: "travelers" as const, label: travelLabel, filled: totalTravelers > 0 },
    { id: "budget" as const, label: budgetLabel, filled: !!ctx.budgetPreset },
  ];

  return (
    <div ref={ref} className="relative flex items-center gap-1.5">
      {chips.map(chip => (
        <button
          key={chip.id}
          onClick={() => setOpen(o => o === chip.id ? null : chip.id)}
          className={cn(
            "flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
            open === chip.id
              ? "border-ct-border-strong bg-ct-action text-white"
              : chip.filled
              ? "border-ct-border-medium bg-ct-surface-subtle text-ct-text-ui"
              : "border-ct-border text-ct-text-secondary hover:border-ct-border-medium",
          )}
        >
          {chip.label}
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none"
            stroke={open === chip.id ? "white" : "#999"}
            strokeWidth="2.5" strokeLinecap="round"
            className={cn("shrink-0 transition-transform", open === chip.id && "rotate-180")}
          ><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      ))}

      {/* Destination panel — suggests new chat */}
      {open === "dest" && (
        <div className="absolute top-full left-0 mt-2 z-50 w-72 bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f5f5f5]">
            <p className="text-[13px] font-bold text-[#1a1a1a]">Change Destination</p>
          </div>
          <div className="px-4 py-4 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[#f8f9fb] rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-ct-surface-subtle flex items-center justify-center shrink-0">
                <MapPin size={18} className="text-ct-text-secondary" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#1a1a1a]">{ctx.destination}</p>
                <p className="text-[11px] text-ct-text-subtle mt-0.5">Current destination</p>
              </div>
            </div>
            <div className="bg-[#fff8f6] border border-[#FFD4C4] rounded-xl px-3.5 py-3">
              <p className="text-[12px] text-[#c0400a] font-medium leading-snug">
                Changing the destination will start a fresh plan. Your current itinerary will be saved.
              </p>
            </div>
            <button
              onClick={() => { setOpen(null); onNewChat(); }}
              className="w-full py-2.5 text-[13px] font-semibold text-white bg-ct-action hover:bg-ct-action-hover rounded-xl transition-colors"
            >
              Start a new chat →
            </button>
          </div>
        </div>
      )}

      {/* When panel */}
      {open === "when" && (
        <div className="absolute top-full left-[80px] mt-2 z-50 w-64 bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f5f5f5] flex items-center justify-between">
            <p className="text-[13px] font-bold text-[#1a1a1a]">Travel dates</p>
            <button onClick={() => setOpen(null)} className="text-ct-text-disabled hover:text-ct-text-muted text-lg leading-none">×</button>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              {["Next weekend","This month","In June","In July","Flexible"].map(pick => (
                <button
                  key={pick}
                  onClick={() => onCtxChange({ ...ctx, quickPick: pick, dateMode: "flexible", dates: { start: "", end: "" } })}
                  className={cn(
                    "text-[11.5px] font-medium px-2.5 py-1 rounded-full border transition-colors",
                    ctx.quickPick === pick ? "bg-ct-action text-white border-[#505050]" : "border-ct-border text-ct-text-secondary hover:border-[#888]",
                  )}
                >{pick}</button>
              ))}
            </div>
            {(ctx.dates.start || ctx.dates.end) && (
              <div className="flex items-center gap-2 pt-1">
                <div className="flex-1 text-center py-1.5 px-2 rounded-lg border border-ct-border-strong bg-ct-surface-subtle text-[12px] font-semibold text-ct-text-ui">
                  {ctx.dates.start ? fmtHdr(ctx.dates.start) : "Depart"}
                </div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                <div className="flex-1 text-center py-1.5 px-2 rounded-lg border border-ct-border-strong bg-ct-surface-subtle text-[12px] font-semibold text-ct-text-ui">
                  {ctx.dates.end ? fmtHdr(ctx.dates.end) : "Return"}
                </div>
              </div>
            )}
            <button
              onClick={() => setOpen(null)}
              className="w-full py-2 text-[12px] font-semibold text-white bg-ct-action hover:bg-ct-action-hover rounded-xl transition-colors mt-1"
            >Done</button>
          </div>
        </div>
      )}

      {/* Travelers panel */}
      {open === "travelers" && (
        <div className="absolute top-full left-[160px] mt-2 z-50 w-56 bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f5f5f5] flex items-center justify-between">
            <p className="text-[13px] font-bold text-[#1a1a1a]">Travelers</p>
            <button onClick={() => setOpen(null)} className="text-ct-text-disabled hover:text-ct-text-muted text-lg leading-none">×</button>
          </div>
          <div className="px-4 py-3 space-y-3">
            {[
              { key: "adults" as const, label: "Adults", sub: "Age 12+", val: ctx.adults, min: 1, max: 9 },
              { key: "children" as const, label: "Children", sub: "Age 2–11", val: ctx.children, min: 0, max: 8 },
            ].map(row => (
              <div key={row.key} className="flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-[#1a1a1a]">{row.label}</p>
                  <p className="text-[10px] text-ct-text-subtle">{row.sub}</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    disabled={row.val <= row.min}
                    onClick={() => onCtxChange({ ...ctx, [row.key]: row.val - 1 })}
                    className="w-7 h-7 rounded-full border border-ct-border flex items-center justify-center text-[16px] font-light text-ct-text-secondary hover:border-ct-border-medium hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >−</button>
                  <span className="text-[13px] font-bold text-[#1a1a1a] w-4 text-center">{row.val}</span>
                  <button
                    disabled={row.val >= row.max}
                    onClick={() => onCtxChange({ ...ctx, [row.key]: row.val + 1 })}
                    className="w-7 h-7 rounded-full border border-ct-border flex items-center justify-center text-[16px] font-light text-ct-text-secondary hover:border-ct-border-medium hover:text-[#1a1a1a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >+</button>
                </div>
              </div>
            ))}
            <button onClick={() => setOpen(null)} className="w-full py-2 text-[12px] font-semibold text-white bg-ct-action hover:bg-ct-action-hover rounded-xl transition-colors">Done</button>
          </div>
        </div>
      )}

      {/* Budget panel */}
      {open === "budget" && (
        <div className="absolute top-full left-[240px] mt-2 z-50 w-60 bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#f5f5f5] flex items-center justify-between">
            <p className="text-[13px] font-bold text-[#1a1a1a]">Budget</p>
            <button onClick={() => setOpen(null)} className="text-ct-text-disabled hover:text-ct-text-muted text-lg leading-none">×</button>
          </div>
          <div className="px-4 py-3 space-y-2">
            {[
              { id: "budget", label: "Budget", sub: "Under ₹40,000", Icon: Backpack },
              { id: "mid", label: "Mid-range", sub: "₹40,000 – ₹1,50,000", Icon: AirplaneTilt },
              { id: "luxury", label: "Luxury", sub: "₹1,50,000+", Icon: Sparkle },
            ].map(bp => (
              <button
                key={bp.id}
                onClick={() => { onCtxChange({ ...ctx, budgetPreset: bp.id }); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left",
                  ctx.budgetPreset === bp.id ? "border-ct-border-strong bg-ct-surface-raised" : "border-ct-border-light hover:border-ct-border-medium",
                )}
              >
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", ctx.budgetPreset === bp.id ? "bg-ct-action" : "bg-ct-surface-subtle")}>
                  <bp.Icon size={14} className={ctx.budgetPreset === bp.id ? "text-white" : "text-ct-text-muted"} />
                </div>
                <div>
                  <p className={cn("text-[12.5px] font-semibold", "text-[#1a1a1a]")}>{bp.label}</p>
                  <p className="text-[10.5px] text-ct-text-subtle">{bp.sub}</p>
                </div>
                {ctx.budgetPreset === bp.id && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-ct-action flex items-center justify-center shrink-0">
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                )}
              </button>
            ))}
            <button onClick={() => setOpen(null)} className="w-full py-2 text-[12px] font-semibold text-white bg-ct-action hover:bg-ct-action-hover rounded-xl transition-colors mt-1">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Results plain input ─────────────────────────────────── */
function ResultsInput({ onSend }: { onSend: (txt: string) => void }) {
  const [draft, setDraft] = useState("");
  function send() { if (!draft.trim()) return; onSend(draft.trim()); setDraft(""); }
  return (
    <div className="bg-white border border-ct-border rounded-2xl shadow-sm flex items-center gap-2 px-4 py-3">
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") send(); }}
        placeholder="Ask to change anything — 'swap the hotel', 'add a rest day'…"
        className="flex-1 text-[14px] text-[#1a1a1a] placeholder:text-ct-text-placeholder outline-none bg-transparent"
      />
      <button
        onClick={send}
        disabled={!draft.trim()}
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
          draft.trim() ? "bg-ct-orange hover:bg-ct-orange-hover" : "bg-ct-surface-deep cursor-not-allowed",
        )}
      >
        <PaperPlaneTilt size={14} weight="fill" color={draft.trim() ? "white" : "#ccc"} />
      </button>
    </div>
  );
}

/* ── Map panel ───────────────────────────────────────────── */
function MapPanel({ selectedDay, onSelectDay }: { selectedDay: number; onSelectDay: (day: number) => void }) {
  const mapDays = BALI_PLAN.map(d => ({ day: d.day, location: d.location, lat: d.lat, lng: d.lng }));

  return (
    <div className="w-[380px] shrink-0 border-l border-ct-border flex flex-col bg-white">
      {/* Map header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-ct-border-light shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-ct-action-active flex items-center justify-center">
            <MapPin size={13} color="white" weight="fill" />
          </div>
          <span className="text-[14px] font-bold text-[#1a1a1a]">Trip Map</span>
        </div>
        <span className="text-[11px] text-ct-text-subtle">Bali, Indonesia</span>
      </div>

      {/* Leaflet map */}
      <div className="flex-1 relative min-h-0">
        <TripMap days={mapDays} selectedDay={selectedDay} onSelectDay={onSelectDay} />
      </div>

      {/* Day legend */}
      <div className="shrink-0 border-t border-ct-border-light px-4 py-3">
        <p className="text-[10px] font-semibold text-ct-text-subtle uppercase tracking-wider mb-2">Route</p>
        <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {BALI_PLAN.map(d => (
            <button
              key={d.day}
              onClick={() => onSelectDay(d.day)}
              className={cn(
                "flex-none flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-colors",
                selectedDay === d.day ? "border-ct-border-strong bg-ct-surface-subtle" : "border-ct-border-light hover:border-ct-border-medium",
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold",
                "bg-ct-action-active text-white",
              )}>
                {d.day}
              </div>
              <span className="text-[9.5px] text-ct-text-secondary font-medium whitespace-nowrap">{d.location}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main chat area ─────────────────────────────────────── */
function ChatArea({
  stage, msgs, isTyping, planStep, planUpdating, currentQ, qIdx, selected,
  onStart, onPick, onAnswer, onSkip, chipCtx, onChipChange, onNewChat, selectedDay, onSelectDay, endRef,
}: {
  stage: Stage;
  msgs: Msg[];
  isTyping: boolean;
  planStep: number;
  planUpdating: boolean;
  currentQ: QDef | null;
  qIdx: number;
  selected: string[];
  onStart: (txt: string, chipState?: ChipCtx) => void;
  onPick: (v: string) => void;
  onAnswer: (v: string) => void;
  onSkip: () => void;
  chipCtx: ChipCtx | null;
  onChipChange: (updated: ChipCtx) => void;
  onNewChat: () => void;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [promptSet, setPromptSet] = useState(0);
  const showCard = (stage === "q1" || stage === "q2") && currentQ !== null;
  const cards = PROMPT_CARD_SETS[promptSet];

  function sendFree(txt: string, chipState?: ChipCtx) {
    onStart(txt, chipState);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#fafafa]">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-ct-border shrink-0">
        {/* <p className="text-[15px] font-bold text-[#1a1a1a] shrink-0">New Chat</p> */}
        {chipCtx && (
          <HeaderTripChips ctx={chipCtx} onCtxChange={onChipChange} onNewChat={onNewChat} />
        )}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button className="flex items-center gap-1.5 text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3.5 py-1.5 rounded-full hover:bg-ct-surface-subtle transition-colors">
            <Plus size={12} weight="bold" />
            Create a Trip
          </button>
          <button className="text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3.5 py-1.5 rounded-full hover:bg-ct-surface-subtle transition-colors">
            Invite
          </button>
          <button className="flex items-center gap-1 text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3.5 py-1.5 rounded-full hover:bg-ct-surface-subtle transition-colors">
            🇮🇳 English
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
        </div>
      </div>

      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-8" style={{ scrollbarWidth: "thin" }}>
        {/* Idle / welcome state */}
        {stage === "idle" && (
          <div className="max-w-[620px] mx-auto">
            <div className="mb-7">
              <h1 className="text-[26px] font-bold text-[#1a1a1a] leading-snug">
                Hey there, <span className="text-[#1a1a1a]">Traveller</span>
              </h1>
              <p className="text-[20px] font-semibold text-[#1a1a1a] mt-0.5">Where would you like to go?</p>
              <p className="text-[14px] text-ct-text-muted mt-2 leading-relaxed">
                I&apos;m here to assist you in planning your experience. Ask me anything travel related.
              </p>
            </div>

            {/* Prompt suggestion cards */}
            <div className="space-y-2.5 mb-5">
              {cards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => sendFree(card.sub)}
                  className="w-full flex items-start gap-3.5 p-4 bg-white border border-ct-border rounded-xl hover:border-[#1a1a1a]/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-ct-surface-subtle flex items-center justify-center shrink-0">
                    <card.Icon size={20} className="text-ct-text-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#1a1a1a] transition-colors">{card.title}</p>
                    <p className="text-[12px] text-ct-text-muted mt-0.5 leading-snug line-clamp-2">{card.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setPromptSet(s => (s + 1) % PROMPT_CARD_SETS.length)}
              className="flex items-center gap-2 text-[12px] text-ct-text-muted hover:text-ct-text-secondary transition-colors"
            >
              <ArrowsClockwise size={13} />
              Refresh prompts
            </button>
          </div>
        )}

        {/* Active conversation */}
        {stage !== "idle" && (
          <div className="max-w-[620px] mx-auto space-y-5">
            {msgs.map(msg => {
              if (msg.kind === "user-init") return (
                <div key={msg.id} className="flex justify-end">
                  <div className="bg-ct-action-hover text-white text-[14px] px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                </div>
              );
              if (msg.kind === "ai") return (
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <p className="flex-1 min-w-0 text-[14px] text-[#1a1a1a] leading-relaxed whitespace-pre-line pt-0.5">{msg.text}</p>
                </div>
              );
              if (msg.kind === "summary") return <SummaryBubble key={msg.id} pairs={msg.pairs!} />;
              if (msg.kind === "planning-done") return (
                <div key={msg.id} className="space-y-4">
                  <div className="flex gap-2.5">
                    <Spark />
                    <div className="flex-1 min-w-0">
                      <PlanningMsg step={STEPS.length} />
                    </div>
                  </div>
                  <PlanResultView onSelectDay={onSelectDay} selectedDay={selectedDay} planUpdating={planUpdating} />
                </div>
              );
              return null;
            })}

            {stage === "planning" && planStep >= 0 && planStep < STEPS.length && (
              <div className="flex gap-2.5">
                <Spark />
                <div className="flex-1 min-w-0 bg-white border border-ct-border rounded-xl p-4 shadow-sm">
                  <PlanningMsg step={planStep} />
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex gap-2.5">
                <Spark />
                <div className="bg-white border border-ct-border rounded-xl px-4 py-3 shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {/* Bottom input area */}
      <div className="shrink-0 px-6 pb-5 max-w-[700px] mx-auto w-full">
        {showCard && currentQ && (
          <QuestionCard q={currentQ} qIdx={qIdx} selected={selected}
            onPick={onPick} onSubmit={onAnswer} onSkip={onSkip} />
        )}

        {stage === "idle" && (
          <ChipInputBar
            placeholder="Where do you want to go? Describe your dream trip…"
            onSend={(txt, chipState) => sendFree(txt, chipState as ChipCtx)}
          />
        )}

        {stage === "results" && (
          <ResultsInput onSend={txt => sendFree(txt)} />
        )}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function AIPlanner() {
  const [stage, setStage] = useState<Stage>("idle");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [summaryPairs, setSummaryPairs] = useState<SummaryPair[]>([]);
  const [planStep, setPlanStep] = useState(-1);
  const [isTyping, setIsTyping] = useState(false);
  const [chipCtx, setChipCtx] = useState<ChipCtx | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [vibeAnswer, setVibeAnswer] = useState("");
  const [planUpdating, setPlanUpdating] = useState(false);
  const updateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const planTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Build the 2-question vibe flow dynamically */
  function getVibeQS(): QDef[] {
    const q2 = vibeAnswer ? (VIBE_FOLLOWUPS[vibeAnswer] ?? VIBE_FOLLOWUPS["Mix of everything"]) : null;
    return q2 ? [VIBE_Q, q2] : [VIBE_Q];
  }

  const vibeQS = getVibeQS();
  const currentQ = vibeQS[qIdx] ?? null;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, isTyping, planStep]);
  useEffect(() => () => { if (planTimer.current) clearInterval(planTimer.current); }, []);

  function addMsg(m: Omit<Msg, "id">) {
    setMsgs(prev => [...prev, { ...m, id: `${Date.now()}-${Math.random()}` }]);
  }

  function showAI(text: string, delay = 900) {
    setIsTyping(true);
    setTimeout(() => { setIsTyping(false); addMsg({ kind: "ai", text }); }, delay);
  }

  function startConversation(init: string, chipState?: ChipCtx) {
    const dest = chipState?.destination || "";
    const userText = init.trim() || [
      dest && `Heading to ${dest}`,
      chipState?.quickPick && `${chipState.quickPick}`,
      chipState?.dates.start && fmtChipDate(chipState.dates.start) + (chipState.dates.end ? ` → ${fmtChipDate(chipState.dates.end)}` : ""),
      chipState && (chipState.adults + chipState.children) > 0 && `${chipState.adults + chipState.children} traveler${(chipState.adults + chipState.children) !== 1 ? "s" : ""}`,
      chipState?.budgetPreset && ({ budget: "Budget trip", mid: "Mid-range budget", luxury: "Luxury" }[chipState.budgetPreset] ?? chipState.budgetPreset),
    ].filter(Boolean).join(" · ") || "Plan my trip";

    if (chipState) {
      setChipCtx(chipState);
      setShowRightPanel(false);
    }
    addMsg({ kind: "user-init", text: userText });
    setStage("q1");
    showAI(AI_ACKS[0], 900);
  }

  function startPlanning(_allPairs: SummaryPair[]) {
    setStage("planning");
    showAI("Perfect. Searching for the best flights, hotels and activities now…", 900);
    let step = 0;
    setPlanStep(0);
    setTimeout(() => {
      planTimer.current = setInterval(() => {
        step++;
        setPlanStep(step);
        if (step >= STEPS.length) {
          clearInterval(planTimer.current!);
          setTimeout(() => {
            setStage("results");
            addMsg({ kind: "planning-done" });
            showAI("Here's your plan! Tap any booking button, or ask me to change anything.", 600);
          }, 700);
        }
      }, 850);
    }, 1500);
  }

  function handleAnswer(answer: string) {
    const q = vibeQS[qIdx];
    const newPair = { q: q.question, a: answer };
    const allPairs = [...summaryPairs, newPair];
    setSummaryPairs(allPairs);
    setTimeout(() => addMsg({ kind: "summary", pairs: allPairs }), 80);

    /* After Q1 (vibe), store the answer so Q2 becomes contextual */
    if (q.id === "vibe") {
      setVibeAnswer(answer);
      setSelected([]);
      setQIdx(1);
      setStage("q2");
      showAI(AI_ACKS[1], 950);
    } else {
      /* Q2 answered — start planning */
      startPlanning(allPairs);
    }
  }

  function handlePick(val: string) {
    const q = vibeQS[qIdx];
    if (q.multi) setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    else setSelected([val]);
  }

  const [showChatsPanel, setShowChatsPanel] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);

  function handleChipChange(updated: ChipCtx) {
    setChipCtx(updated);
    if (stage === "results") {
      if (updateTimer.current) clearTimeout(updateTimer.current);
      setPlanUpdating(true);
      updateTimer.current = setTimeout(() => setPlanUpdating(false), 1600);
    }
  }

  function resetToIdle() {
    setStage("idle");
    setMsgs([]);
    setQIdx(0);
    setSelected([]);
    setSummaryPairs([]);
    setPlanStep(-1);
    setIsTyping(false);
    setChipCtx(null);
    setShowRightPanel(true);
    setVibeAnswer("");
    setSelectedDay(1);
    setPlanUpdating(false);
    if (planTimer.current) clearInterval(planTimer.current);
    if (updateTimer.current) clearTimeout(updateTimer.current);
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <AppSidebar active="ai-planner" onToggleChats={() => setShowChatsPanel(p => !p)} showChats={showChatsPanel} />
      {showChatsPanel && (
        <ChatListPanel onNew={() => { resetToIdle(); }} onClose={() => setShowChatsPanel(false)} />
      )}
      <ChatArea
        stage={stage}
        msgs={msgs}
        isTyping={isTyping}
        planStep={planStep}
        planUpdating={planUpdating}
        currentQ={currentQ}
        qIdx={qIdx}
        selected={selected}
        onStart={startConversation}
        onPick={handlePick}
        onAnswer={handleAnswer}
        onSkip={() => handleAnswer("Skipped")}
        chipCtx={chipCtx}
        onChipChange={handleChipChange}
        onNewChat={resetToIdle}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        endRef={endRef}
      />
      {stage === "results" ? (
        <MapPanel selectedDay={selectedDay} onSelectDay={setSelectedDay} />
      ) : showRightPanel ? (
        <RightPanel />
      ) : null}
    </div>
  );
}
