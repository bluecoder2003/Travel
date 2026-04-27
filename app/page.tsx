"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/AppSidebar";
import ChipInputBar from "@/components/ChipInputBar";
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
} from "@phosphor-icons/react";

/* ── Types ─────────────────────────────────────────────── */
type Stage = "idle" | "q1" | "q2" | "q3" | "q4" | "planning" | "results";
interface QOption { label: string; arrow?: boolean }
interface QDef { id: string; question: string; options: QOption[]; multi?: boolean; placeholder: string; pageOf: number }
interface SummaryPair { q: string; a: string }
interface Msg { id: string; kind: "user-init" | "ai" | "summary" | "planning-done"; text?: string; pairs?: SummaryPair[] }

/* ── Questions ──────────────────────────────────────────── */
const QS: QDef[] = [
  { id: "dest", pageOf: 4, question: "Where are you headed?",
    options: [{ label: "I have a destination in mind", arrow: true }, { label: "Help me pick somewhere" }],
    placeholder: "Type a city or country…" },
  { id: "who", pageOf: 4, question: "Who's coming along?",
    options: [{ label: "Just me" }, { label: "2 adults" }, { label: "Family with kids" }, { label: "Group of friends" }],
    placeholder: "Something else…" },
  { id: "vibe", pageOf: 4, question: "What's your trip vibe?",
    options: [{ label: "🏖️ Beach & water sports" }, { label: "🏛️ Culture & heritage" }, { label: "🎉 Party & nightlife" }, { label: "🧘 Relaxation" }],
    multi: true, placeholder: "Something else…" },
  { id: "budget", pageOf: 4, question: "What's your total trip budget?",
    options: [{ label: "Under ₹40,000" }, { label: "₹40,000 – ₹80,000" }, { label: "₹80,000 – ₹1,50,000" }, { label: "No strict limit" }],
    placeholder: "Enter an amount…" },
];

const AI_ACKS = [
  "Let's plan your perfect Goa getaway! A few quick questions to get started:",
  "Goa in May — great timing before the rains! Who's coming along?",
  "Nice! What kind of experience are you looking for?",
  "Love that mix! Last one:",
];

const STEPS = [
  { icon: "✈️", text: "Searching 847 flights DEL → GOI · May 15", result: "IndiGo 6E-2241 · ₹4,899/person · Non-stop" },
  { icon: "🏨", text: "Checking 340+ hotels in North Goa · 4 nights", result: "Taj Fort Aguada · 5★ · ₹8,500/night" },
  { icon: "🎯", text: "Curating activities: beach + culture vibes", result: "14 hand-picked experiences across 5 days" },
  { icon: "✈️", text: "Searching return flights GOI → DEL · May 19", result: "IndiGo 6E-2244 · ₹5,299/person · Non-stop" },
  { icon: "✅", text: "Assembling itinerary & running budget check", result: "₹62,896 total · ₹17,104 under budget ✓" },
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

/* ── Planning animation ─────────────────────────────────── */
function PlanningMsg({ step }: { step: number }) {
  return (
    <div className="space-y-2.5">
      {STEPS.map((s, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <div key={i} className={cn("flex items-start gap-2.5 transition-opacity duration-300", i > step && "opacity-25")}>
            <div className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold",
              done ? "bg-[#22c55e] text-white" : active ? "bg-[#FF4F17] text-white animate-pulse" : "bg-[#e5e7eb] text-[#aaa]",
            )}>
              {done ? "✓" : active ? "…" : "·"}
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("text-[13px] leading-snug", done ? "text-[#aaa] line-through" : active ? "text-[#1a1a1a]" : "text-[#bbb]")}>
                {s.icon} {s.text}
              </p>
              {done && <p className="text-[11.5px] text-[#22c55e] mt-0.5 font-medium">{s.result}</p>}
            </div>
          </div>
        );
      })}
      {step < STEPS.length && (
        <div className="mt-2 h-1.5 rounded-full bg-[#f0f0f0] overflow-hidden">
          <div className="h-full rounded-full bg-[#FF4F17] transition-all duration-700" style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
      )}
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
    <div className="w-6 h-6 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
    </div>
  );
}

function SummaryBubble({ pairs }: { pairs: SummaryPair[] }) {
  return (
    <div className="flex justify-end">
      <div className="bg-[#f5f5f5] border border-[#e5e7eb] rounded-2xl rounded-tr-sm px-4 py-3 max-w-[75%]">
        {pairs.map((p, i) => (
          <div key={i} className={cn(i > 0 && "mt-2 pt-2 border-t border-[#e5e7eb]")}>
            <p className="text-[11px] text-[#aaa]">Q: {p.q}</p>
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
    <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-[15px] font-semibold text-[#1a1a1a]">{q.question}</span>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#aaa]">{qIdx + 1} of {q.pageOf}</span>
          <button onClick={onSkip} className="text-[#ccc] hover:text-[#888] transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="border-t border-[#f0f0f0]">
        {q.options.map((opt, i) => {
          const picked = selected.includes(opt.label);
          const highlighted = hi === i;
          return (
            <button
              key={opt.label}
              onClick={() => { onPick(opt.label); if (!q.multi) onSubmit(opt.label); }}
              className={cn(
                "w-full flex items-center gap-3.5 px-5 py-3.5 text-left border-b border-[#f5f5f5] last:border-0 transition-colors",
                picked ? "bg-[#f8f8f8]" : highlighted ? "bg-[#f8f9fb]" : "hover:bg-[#fafbfd]",
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                picked ? "bg-[#1a1a1a] text-white" : "bg-[#f0f0f0] text-[#888]",
              )}>
                {q.multi && picked ? "✓" : i + 1}
              </div>
              <span className={cn("flex-1 text-[14px]", picked ? "text-[#1a1a1a] font-semibold" : "text-[#333]")}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="border-t border-[#f0f0f0] flex items-center gap-2 px-3.5 py-2.5">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && draft.trim()) submit(); }}
          placeholder={q.placeholder}
          className="flex-1 bg-transparent text-[14px] text-[#1a1a1a] placeholder:text-[#ccc] outline-none"
        />
        {showDone && (
          <button onClick={submit} className="text-[12px] font-semibold text-white bg-[#1a1a1a] hover:bg-[#333] px-3.5 py-1.5 rounded-full transition-colors shrink-0">
            Done →
          </button>
        )}
        {showSend && (
          <button onClick={submit} className="w-7 h-7 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 hover:bg-[#333] transition-colors">
            <PaperPlaneTilt size={13} color="white" weight="fill" />
          </button>
        )}
        {!showDone && !showSend && (
          <button onClick={onSkip} className="text-[12px] text-[#ccc] hover:text-[#888] px-2 transition-colors shrink-0">Skip</button>
        )}
      </div>
      <div className="bg-[#fafbfd] border-t border-[#f0f0f0] px-5 py-1.5 flex justify-center">
        <span className="text-[10.5px] text-[#ccc]">↑↓ to navigate  ·  Enter to select  ·  Esc to skip</span>
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
    <div className="w-[272px] shrink-0 flex flex-col bg-white border-r border-[#e5e7eb]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-2">
          <ChatCircle size={18} weight="fill" className="text-[#1a1a1a]" />
          <span className="text-[15px] font-bold text-[#1a1a1a]">Chats</span>
          <span className="text-[11px] font-bold bg-[#f0f0f0] text-[#666] rounded-full px-2 py-0.5">2</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 bg-[#1a1a1a] text-white text-[12px] font-semibold px-3 py-1.5 rounded-full hover:bg-[#333] transition-colors"
          >
            <Plus size={12} weight="bold" />
            New Chat
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-[#aaa] hover:bg-[#f5f5f5] hover:text-[#555] transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2.5 border-b border-[#f0f0f0]">
        <div className="flex items-center gap-2 bg-[#f5f5f5] rounded-xl px-3 py-2">
          <MagnifyingGlass size={14} className="text-[#aaa] shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 bg-transparent text-[13px] text-[#1a1a1a] placeholder:text-[#bbb] outline-none"
          />
          <span className="text-[10px] text-[#bbb] font-mono shrink-0">⌘1</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-3 pt-2.5 gap-4 border-b border-[#f0f0f0]">
        {(["all", "trips"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "pb-2.5 text-[13px] font-semibold capitalize border-b-2 transition-colors",
              tab === t ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-[#aaa] hover:text-[#555]",
            )}
          >
            {t === "all" ? "All" : "Trips"}
          </button>
        ))}
      </div>

      {/* All tab — empty state */}
      {tab === "all" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 pb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#f5f5f5] flex items-center justify-center">
            <ChatCircle size={32} className="text-[#ddd]" weight="fill" />
          </div>
          <p className="text-[13px] text-[#aaa] font-medium">No Chat History</p>
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 text-[12px] text-[#555] border border-[#e5e7eb] px-4 py-2 rounded-full hover:bg-[#f5f5f5] transition-colors font-medium"
          >
            <Plus size={12} weight="bold" />
            New Chat
          </button>
        </div>
      )}

      {/* Trips tab */}
      {tab === "trips" && (
        <div className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: "thin" }}>
          <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wider px-1 mb-2">Your Trips</p>
          <div className="space-y-1">
            {RECENT_TRIPS.map((trip, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#f5f5f5] transition-colors text-left"
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

const TYPE_STYLES: Record<InspirationItem["type"], string> = {
  BLOG: "bg-[#e8f4fd] text-[#1a6fa8]",
  VIDEO: "bg-[#fde8e8] text-[#c0392b]",
  ITINERARY: "bg-[#e8fdf0] text-[#1a7a45]",
};

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
    <div className="w-[360px] shrink-0 border-l border-[#e5e7eb] bg-white overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
      {/* Popular right now */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-medium text-[#1a1a1a]">Popular Right Now</p>
          <button className="text-[12px] font-semibold text-[#555] border border-[#e5e7eb] px-3 py-1 rounded-lg hover:bg-[#f5f5f5] transition-colors">
            See all
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TRENDING.map((d, i) => (
            <div key={i} className="cursor-pointer group">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                <Image src={d.img} alt={d.city} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="160px" />
              </div>
              <p className="mt-1.5 text-[11px] text-[#555] font-medium leading-snug">{d.city}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-4 h-px bg-[#f0f0f0]" />

      {/* Inspiration for you */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[14px] font-medium text-[#1a1a1a]">Inspiration for you</p>
          <button className="text-[12px] font-semibold text-[#555] border border-[#e5e7eb] px-3 py-1 rounded-lg hover:bg-[#f5f5f5] transition-colors shrink-0 ml-2">
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
                  : "text-[#555] border-[#e5e7eb] hover:bg-[#f5f5f5]",
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
                <p className="text-[12px] font-semibold text-[#1a1a1a] leading-tight line-clamp-2 group-hover:text-[#444] transition-colors">{item.title}</p>
                <p className="mt-0.5 text-[10.5px] text-[#888] leading-snug line-clamp-2">{item.sub}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-[#888] hover:text-[#555] transition-colors">{tag}</span>
                  ))}
                </div>
                <p className="mt-1 text-[10px] text-[#bbb]">{item.source}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="mx-4 h-px bg-[#f0f0f0] mt-4" />

      {/* From the community */}
      <div className="px-4 pt-3 pb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[14px] font-medium text-[#1a1a1a]">From the community</p>
          <button className="text-[12px] font-semibold text-[#555] border border-[#e5e7eb] px-3 py-1 rounded-lg hover:bg-[#f5f5f5] transition-colors">
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
                <p className="text-[12px] font-semibold text-[#1a1a1a] leading-tight line-clamp-2 group-hover:text-[#444] transition-colors">{post.title}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-[10px] text-[#aaa]">{tag}</span>
                  ))}
                </div>
                <p className="text-[10px] text-[#bbb] mt-0.5">by {post.user}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main chat area ─────────────────────────────────────── */
function ChatArea({
  stage, msgs, isTyping, planStep, qIdx, selected,
  onStart, onPick, onAnswer, onSkip, endRef,
}: {
  stage: Stage;
  msgs: Msg[];
  isTyping: boolean;
  planStep: number;
  qIdx: number;
  selected: string[];
  onStart: (v: string) => void;
  onPick: (v: string) => void;
  onAnswer: (v: string) => void;
  onSkip: () => void;
  endRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [promptSet, setPromptSet] = useState(0);
  const showCard = stage === "q1" || stage === "q2" || stage === "q3" || stage === "q4";
  const cards = PROMPT_CARD_SETS[promptSet];

  function sendFree(txt: string) {
    if (!txt.trim()) return;
    onStart(txt.trim());
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#fafafa]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e5e7eb] shrink-0">
        <p className="text-[15px] font-bold text-[#1a1a1a]">New Chat</p>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 text-[12px] font-semibold text-[#555] border border-[#e5e7eb] px-3.5 py-1.5 rounded-full hover:bg-[#f5f5f5] transition-colors">
            <Plus size={12} weight="bold" />
            Create a Trip
          </button>
          <button className="text-[12px] font-semibold text-[#555] border border-[#e5e7eb] px-3.5 py-1.5 rounded-full hover:bg-[#f5f5f5] transition-colors">
            Invite
          </button>
          <button className="flex items-center gap-1 text-[12px] font-semibold text-[#555] border border-[#e5e7eb] px-3.5 py-1.5 rounded-full hover:bg-[#f5f5f5] transition-colors">
            🇮🇳 English
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
        </div>
      </div>

      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 pt-24" style={{ scrollbarWidth: "thin" }}>
        {/* Idle / welcome state */}
        {stage === "idle" && (
          <div className="max-w-[620px] mx-auto">
            <div className="mb-7">
              <h1 className="text-[26px] font-bold text-[#1a1a1a] leading-snug">
                Hey there, <span className="text-[#FF4F17]">Traveller</span>
              </h1>
              <p className="text-[20px] font-semibold text-[#1a1a1a] mt-0.5">Where would you like to go?</p>
              <p className="text-[14px] text-[#888] mt-2 leading-relaxed">
                I&apos;m here to assist you in planning your experience. Ask me anything travel related.
              </p>
            </div>

            {/* Prompt suggestion cards */}
            <div className="space-y-2.5 mb-5">
              {cards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => sendFree(card.sub)}
                  className="w-full flex items-start gap-3.5 p-4 bg-white border border-[#e5e7eb] rounded-xl hover:border-[#1a1a1a]/20 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
                    <card.Icon size={20} className="text-[#555]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#1a1a1a] transition-colors">{card.title}</p>
                    <p className="text-[12px] text-[#888] mt-0.5 leading-snug line-clamp-2">{card.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setPromptSet(s => (s + 1) % PROMPT_CARD_SETS.length)}
              className="flex items-center gap-2 text-[12px] text-[#888] hover:text-[#555] transition-colors"
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
                  <div className="bg-[#1a1a1a] text-white text-[14px] px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed shadow-sm">
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
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <div className="flex-1 min-w-0">
                    <PlanningMsg step={STEPS.length} />
                  </div>
                </div>
              );
              return null;
            })}

            {stage === "planning" && planStep >= 0 && planStep < STEPS.length && (
              <div className="flex gap-2.5">
                <Spark />
                <div className="flex-1 min-w-0 bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
                  <PlanningMsg step={planStep} />
                </div>
              </div>
            )}

            {isTyping && (
              <div className="flex gap-2.5">
                <Spark />
                <div className="bg-white border border-[#e5e7eb] rounded-xl px-4 py-3 shadow-sm">
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
        {showCard && (
          <QuestionCard q={QS[qIdx]} qIdx={qIdx} selected={selected}
            onPick={onPick} onSubmit={onAnswer} onSkip={onSkip} />
        )}

        {(stage === "idle" || stage === "results") && (
          <ChipInputBar
            placeholder={stage === "results" ? "Ask to change anything — 'swap the hotel', 'add a rest day'…" : "Where do you want to go? Describe your dream trip…"}
            onSend={(txt) => sendFree(txt)}
          />
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
  const endRef = useRef<HTMLDivElement>(null);
  const planTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const Q_STAGES: Stage[] = ["q1", "q2", "q3", "q4"];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, isTyping, planStep]);
  useEffect(() => () => { if (planTimer.current) clearInterval(planTimer.current); }, []);

  function addMsg(m: Omit<Msg, "id">) {
    setMsgs(prev => [...prev, { ...m, id: `${Date.now()}-${Math.random()}` }]);
  }

  function showAI(text: string, delay = 900) {
    setIsTyping(true);
    setTimeout(() => { setIsTyping(false); addMsg({ kind: "ai", text }); }, delay);
  }

  function startConversation(init: string) {
    addMsg({ kind: "user-init", text: init });
    setStage("q1");
    showAI(AI_ACKS[0], 900);
  }

  function handleAnswer(answer: string) {
    const q = QS[qIdx];
    const newPair = { q: q.question, a: answer };
    const allPairs = [...summaryPairs, newPair];
    setSummaryPairs(allPairs);
    setTimeout(() => addMsg({ kind: "summary", pairs: allPairs }), 80);

    const next = qIdx + 1;
    if (next < QS.length) {
      setSelected([]);
      setQIdx(next);
      setStage(Q_STAGES[next]);
      showAI(AI_ACKS[next], 950);
    } else {
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
              showAI("Here's your 5-day Goa plan! ₹62,896 total — ₹17,104 under your ₹80,000 budget. 🎉\n\nTap any booking button on the right, or ask me to change anything.", 600);
            }, 700);
          }
        }, 850);
      }, 1500);
    }
  }

  function handlePick(val: string) {
    const q = QS[qIdx];
    if (q.multi) setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    else setSelected([val]);
  }

  const [showChatsPanel, setShowChatsPanel] = useState(false);

  function resetToIdle() {
    setStage("idle");
    setMsgs([]);
    setQIdx(0);
    setSelected([]);
    setSummaryPairs([]);
    setPlanStep(-1);
    setIsTyping(false);
    if (planTimer.current) clearInterval(planTimer.current);
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
          qIdx={qIdx}
          selected={selected}
          onStart={startConversation}
          onPick={handlePick}
          onAnswer={handleAnswer}
          onSkip={() => handleAnswer("Skipped")}
          endRef={endRef}
        />
        <RightPanel />
    </div>
  );
}
