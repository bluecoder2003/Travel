"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  AirplaneTilt,
  ArrowRight,
  CaretDown,
  Star,
  MapPin,
  Sparkle,
  Check,
  ArrowsLeftRight,
  Plus,
  Minus,
  X,
  CalendarBlank,
  Bed,
  Waves,
  ForkKnife,
  Tree,
  ShoppingBag,
  Church,
  MusicNote,
  Mountains,
  SunHorizon,
  Footprints,
  Compass,
  Clock,
} from "@phosphor-icons/react";

/* ═══════════════════════════════════════════════════════════
   FLIGHTS BLOCK
   Outbound + Return. Selected card big; alternatives in
   horizontal carousel. Tap any alt to swap in place.
═══════════════════════════════════════════════════════════ */

export interface FlightOpt {
  id: string;
  airline: string;
  code: string;          // e.g. 6E-2241
  depart: string;        // 06:25
  arrive: string;        // 12:10
  from: string;          // DEL
  to: string;            // DPS
  duration: string;      // 5h 45m
  stops: string;         // "Non-stop" / "1 stop · KUL"
  price: string;         // ₹9,798
  tag?: "Best" | "Cheapest" | "Fastest";
}

const OUTBOUND: FlightOpt[] = [
  { id: "ob1", airline: "IndiGo",   code: "6E-2241", depart: "06:25", arrive: "12:10", from: "DEL", to: "DPS", duration: "5h 45m", stops: "Non-stop", price: "₹9,798",  tag: "Best" },
  { id: "ob2", airline: "AirAsia",  code: "I5-764",  depart: "09:40", arrive: "20:55", from: "DEL", to: "DPS", duration: "7h 20m", stops: "1 stop · KUL", price: "₹7,200",  tag: "Cheapest" },
  { id: "ob3", airline: "Singapore",code: "SQ-403",  depart: "23:15", arrive: "11:35", from: "DEL", to: "DPS", duration: "5h 20m", stops: "1 stop · SIN", price: "₹14,400", tag: "Fastest" },
  { id: "ob4", airline: "Vistara",  code: "UK-141",  depart: "13:05", arrive: "21:50", from: "DEL", to: "DPS", duration: "6h 15m", stops: "1 stop · BKK", price: "₹10,420" },
  { id: "ob5", airline: "Malaysia", code: "MH-181",  depart: "20:55", arrive: "11:30", from: "DEL", to: "DPS", duration: "8h 05m", stops: "1 stop · KUL", price: "₹8,650" },
];

const RETURN: FlightOpt[] = [
  { id: "rt1", airline: "IndiGo",    code: "6E-2244", depart: "19:45", arrive: "01:30", from: "DPS", to: "DEL", duration: "5h 45m", stops: "Non-stop",       price: "₹10,598", tag: "Best" },
  { id: "rt2", airline: "AirAsia",   code: "I5-765",  depart: "22:10", arrive: "09:25", from: "DPS", to: "DEL", duration: "7h 15m", stops: "1 stop · KUL",   price: "₹7,950",  tag: "Cheapest" },
  { id: "rt3", airline: "Singapore", code: "SQ-942",  depart: "11:30", arrive: "22:10", from: "DPS", to: "DEL", duration: "5h 10m", stops: "1 stop · SIN",   price: "₹15,100", tag: "Fastest" },
  { id: "rt4", airline: "Thai",      code: "TG-432",  depart: "16:20", arrive: "03:45", from: "DPS", to: "DEL", duration: "6h 25m", stops: "1 stop · BKK",   price: "₹11,300" },
];

function tagStyle(t?: FlightOpt["tag"]) {
  if (!t) return "";
  if (t === "Best")     return "bg-ct-action text-white";
  if (t === "Cheapest") return "bg-ct-success-light text-ct-success border border-ct-success/20";
  if (t === "Fastest")  return "bg-ct-info-light text-ct-info border border-ct-info/20";
  return "";
}

/* ── Selected (large) flight card ─────────────────────── */
function SelectedFlightCard({ leg, opt }: { leg: "Outbound" | "Return"; opt: FlightOpt }) {
  return (
    <div className="rounded-2xl border border-ct-border bg-ct-surface p-3.5 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-ct-surface-subtle flex items-center justify-center">
            <AirplaneTilt size={13} className="text-ct-text-secondary" weight="fill" />
          </span>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.06em] uppercase text-ct-text-subtle">{leg}</p>
            <p className="text-[12.5px] font-bold text-ct-text leading-tight">{opt.airline} · {opt.code}</p>
          </div>
        </div>
        {opt.tag && (
          <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full", tagStyle(opt.tag))}>
            {opt.tag}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <div className="text-left">
          <p className="text-[18px] font-bold text-ct-text leading-none">{opt.depart}</p>
          <p className="text-[11px] text-ct-text-muted mt-1">{opt.from}</p>
        </div>

        <div className="flex-1 px-1">
          <div className="flex items-center justify-center gap-1.5">
            <span className="h-px flex-1 bg-ct-border" />
            <span className="text-[10px] font-medium text-ct-text-muted whitespace-nowrap">{opt.duration}</span>
            <span className="h-px flex-1 bg-ct-border" />
          </div>
          <p className="text-[10px] text-center text-ct-text-subtle mt-1">{opt.stops}</p>
        </div>

        <div className="text-right">
          <p className="text-[18px] font-bold text-ct-text leading-none">{opt.arrive}</p>
          <p className="text-[11px] text-ct-text-muted mt-1">{opt.to}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-ct-border-light">
        <p className="text-[11px] text-ct-text-muted">
          <Sparkle size={10} className="inline -mt-0.5 mr-1" weight="fill" />
          Picked for {opt.stops === "Non-stop" ? "non-stop + best timing" : "the best price-time balance"}
        </p>
        <p className="text-[14px] font-bold text-ct-text">{opt.price}</p>
      </div>
    </div>
  );
}

/* ── Compact alternate flight pill ────────────────────── */
function AltFlightCard({
  opt, picked, onPick,
}: {
  opt: FlightOpt; picked: boolean; onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      className={cn(
        "shrink-0 w-[185px] text-left rounded-xl border bg-ct-surface p-2.5 transition-all snap-start",
        picked
          ? "border-ct-action shadow-[var(--shadow-ct-sm)]"
          : "border-ct-border hover:border-ct-border-medium hover:shadow-[var(--shadow-ct-xs)]",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-ct-text truncate">{opt.airline}</p>
        {opt.tag && (
          <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full", tagStyle(opt.tag))}>
            {opt.tag}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-1 mt-1.5">
        <span className="text-[13px] font-bold text-ct-text">{opt.depart}</span>
        <ArrowRight size={9} className="text-ct-text-subtle" />
        <span className="text-[13px] font-bold text-ct-text">{opt.arrive}</span>
      </div>

      <p className="text-[10px] text-ct-text-muted mt-0.5 truncate">{opt.duration} · {opt.stops}</p>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-ct-border-light">
        <p className="text-[12px] font-bold text-ct-text">{opt.price}</p>
        <span className={cn(
          "text-[9.5px] font-semibold flex items-center gap-0.5 transition-colors",
          picked ? "text-ct-success" : "text-ct-text-muted",
        )}>
          {picked ? <><Check size={9} weight="bold" /> Selected</> : <>Tap to swap</>}
        </span>
      </div>
    </button>
  );
}

/* ── One leg block: selected card + carousel of alts ──── */
function FlightLeg({
  leg, options,
}: {
  leg: "Outbound" | "Return";
  options: FlightOpt[];
}) {
  const [pickedId, setPickedId] = useState(options[0].id);
  const picked = options.find(o => o.id === pickedId)!;
  const alts   = options.filter(o => o.id !== pickedId);

  return (
    <div className="space-y-2.5">
      <SelectedFlightCard leg={leg} opt={picked} />

      <div className="px-0.5">
        <p className="text-[10px] font-semibold tracking-[0.06em] uppercase text-ct-text-subtle mb-1.5 px-0.5">
          {alts.length} alternates
        </p>
        <div
          className="flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory -mx-1 px-1"
          style={{ scrollbarWidth: "none" }}
        >
          {alts.map(opt => (
            <AltFlightCard
              key={opt.id}
              opt={opt}
              picked={false}
              onPick={() => setPickedId(opt.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FlightsBlock() {
  return (
    <div className="bg-ct-surface border border-ct-border rounded-2xl p-3.5 shadow-[var(--shadow-ct-sm)] space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12.5px] font-bold text-ct-text">Flights · Delhi ⇌ Bali</p>
          <p className="text-[10.5px] text-ct-text-muted mt-0.5">
            Tap any alternate to swap it in. Departure and return are independent.
          </p>
        </div>
        <span className="text-[10px] font-semibold bg-ct-orange-light text-ct-orange border border-ct-orange-border px-2 py-0.5 rounded-full">
          AI picked
        </span>
      </div>

      <FlightLeg leg="Outbound" options={OUTBOUND} />
      <div className="h-px bg-ct-border-light -mx-1" />
      <FlightLeg leg="Return"   options={RETURN} />
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   MULTI-STAY HOTELS BLOCK
   Each stay block = day group. Inline expand for swap with
   filters and alt list. Split / Merge nights controls.
═══════════════════════════════════════════════════════════ */

interface HotelOpt {
  id: string;
  name: string;
  area: string;
  stars: number;
  rating: number;
  pricePerNight: number;
  img: string;
  tag?: string;       // "Closer to activities" / "Best value"
}

interface StayBlock {
  id: string;
  fromDay: number;
  toDay: number;
  hotelId: string;
  rationale: string;  // AI explanation
}

const HOTEL_DB: Record<string, HotelOpt> = {
  taj:     { id: "taj",     name: "Taj Fort Aguada",       area: "Seminyak", stars: 5, rating: 4.8, pricePerNight: 8500,  img: "https://picsum.photos/seed/stay-taj/600/420",   tag: "Closer to activities" },
  alaya:   { id: "alaya",   name: "Alaya Resort Ubud",     area: "Ubud",     stars: 4, rating: 4.7, pricePerNight: 6200,  img: "https://picsum.photos/seed/stay-alaya/600/420", tag: "Best value" },
  w:       { id: "w",       name: "W Bali",                area: "Seminyak", stars: 5, rating: 4.6, pricePerNight: 11200, img: "https://picsum.photos/seed/stay-w/600/420" },
  kata:    { id: "kata",    name: "Katamama Suites",       area: "Seminyak", stars: 5, rating: 4.9, pricePerNight: 12400, img: "https://picsum.photos/seed/stay-kata/600/420" },
  como:    { id: "como",    name: "COMO Uma Ubud",         area: "Ubud",     stars: 5, rating: 4.8, pricePerNight: 14200, img: "https://picsum.photos/seed/stay-como/600/420" },
  bisma:   { id: "bisma",   name: "Bisma Eight",           area: "Ubud",     stars: 4, rating: 4.7, pricePerNight: 7800,  img: "https://picsum.photos/seed/stay-bisma/600/420" },
  potato:  { id: "potato",  name: "Potato Head Studios",   area: "Seminyak", stars: 5, rating: 4.5, pricePerNight: 9900,  img: "https://picsum.photos/seed/stay-potato/600/420" },
  desa:    { id: "desa",    name: "Desa Visesa Ubud",      area: "Ubud",     stars: 5, rating: 4.6, pricePerNight: 8400,  img: "https://picsum.photos/seed/stay-desa/600/420" },
};

const INITIAL_STAYS: StayBlock[] = [
  { id: "s1", fromDay: 1, toDay: 2, hotelId: "taj",   rationale: "On the beach — minutes from your sunset and dining plans." },
  { id: "s2", fromDay: 3, toDay: 5, hotelId: "alaya", rationale: "Quieter base near your Ubud temple and rice-paddy days." },
];

const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

function nights(b: StayBlock) { return Math.max(1, b.toDay - b.fromDay + 1); }

function StayHeader({ b }: { b: StayBlock }) {
  const n = nights(b);
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-ct-text-subtle">
        Day {b.fromDay}{b.toDay !== b.fromDay && `–${b.toDay}`}
      </span>
      <span className="w-1 h-1 rounded-full bg-ct-border-medium" />
      <span className="text-[10px] font-medium text-ct-text-muted">{n} {n === 1 ? "night" : "nights"}</span>
    </div>
  );
}

function HotelOptCard({
  opt, picked, current, onPick,
}: {
  opt: HotelOpt; picked: boolean; current: boolean; onPick: () => void;
}) {
  return (
    <button
      onClick={onPick}
      className={cn(
        "shrink-0 w-[200px] text-left rounded-xl border bg-ct-surface overflow-hidden transition-all snap-start",
        picked || current
          ? "border-ct-action shadow-[var(--shadow-ct-sm)]"
          : "border-ct-border hover:border-ct-border-medium hover:shadow-[var(--shadow-ct-xs)]",
      )}
    >
      <div className="relative w-full aspect-[5/3] bg-ct-surface-deep overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={opt.img} alt={opt.name} className="w-full h-full object-cover" loading="lazy" />
        {opt.tag && (
          <span className="absolute top-2 left-2 bg-ct-surface/95 text-[9.5px] font-semibold text-ct-text px-2 py-0.5 rounded-full shadow-[var(--shadow-ct-xs)]">
            {opt.tag}
          </span>
        )}
        <div className="absolute bottom-2 right-2 bg-ct-action/85 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {inr(opt.pricePerNight)}<span className="opacity-70">/nt</span>
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-[12px] font-bold text-ct-text leading-tight truncate">{opt.name}</p>
        <p className="text-[10.5px] text-ct-text-muted mt-0.5 flex items-center gap-1 truncate">
          <MapPin size={9} weight="fill" />
          {opt.area} · {opt.stars}★
        </p>
        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-ct-border-light">
          <span className="text-[10px] font-semibold text-ct-text flex items-center gap-1">
            <Star size={9} weight="fill" className="text-ct-warning" /> {opt.rating}
          </span>
          <span className={cn(
            "text-[9.5px] font-semibold flex items-center gap-0.5 transition-colors",
            current ? "text-ct-text-muted" : picked ? "text-ct-success" : "text-ct-text-muted",
          )}>
            {current
              ? "Current"
              : picked
                ? <><Check size={9} weight="bold" /> Selected</>
                : "Tap to replace"}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Inline swap panel for a stay block ───────────────── */
function StaySwapPanel({
  block, currentHotelId, onReplace, onClose,
}: {
  block: StayBlock;
  currentHotelId: string;
  onReplace: (hotelId: string) => void;
  onClose: () => void;
}) {
  const [priceCap, setPriceCap]   = useState<"any" | "8" | "10" | "15">("any");
  const [area,     setArea]       = useState<"all" | "Seminyak" | "Ubud">("all");
  const [minStars, setMinStars]   = useState<3 | 4 | 5>(3);

  const all = Object.values(HOTEL_DB);
  const filtered = all.filter(h =>
    (area === "all" || h.area === area) &&
    (h.stars >= minStars) &&
    (priceCap === "any"
      || (priceCap === "8"  && h.pricePerNight <= 8000)
      || (priceCap === "10" && h.pricePerNight <= 10000)
      || (priceCap === "15" && h.pricePerNight <= 15000))
  );

  return (
    <div className="mt-2.5 rounded-xl border border-ct-border bg-ct-surface-raised overflow-hidden animate-[ct-expand_240ms_cubic-bezier(0.4,0,0.2,1)]">
      <style>{`
        @keyframes ct-expand {
          from { opacity: 0; transform: translateY(-4px); max-height: 0; }
          to   { opacity: 1; transform: translateY(0);    max-height: 600px; }
        }
      `}</style>

      <div className="flex items-center justify-between px-3.5 pt-3 pb-2">
        <div>
          <p className="text-[12px] font-bold text-ct-text">
            Swap stay for Day {block.fromDay}{block.toDay !== block.fromDay && `–${block.toDay}`}
          </p>
          <p className="text-[10.5px] text-ct-text-muted mt-0.5">
            {filtered.length} of {all.length} options match your filters.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full border border-ct-border flex items-center justify-center text-ct-text-muted hover:bg-ct-surface-subtle transition-colors"
        >
          <X size={11} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap px-3.5 pb-2.5">
        <FilterDropdown
          label="Price"
          value={priceCap === "any" ? "Any price" : `≤ ₹${priceCap}k/nt`}
          options={[
            { v: "any", l: "Any price" },
            { v: "8",   l: "≤ ₹8k / night" },
            { v: "10",  l: "≤ ₹10k / night" },
            { v: "15",  l: "≤ ₹15k / night" },
          ]}
          onSelect={v => setPriceCap(v as typeof priceCap)}
        />
        <FilterDropdown
          label="Area"
          value={area === "all" ? "All areas" : area}
          options={[
            { v: "all",      l: "All areas" },
            { v: "Seminyak", l: "Seminyak" },
            { v: "Ubud",     l: "Ubud" },
          ]}
          onSelect={v => setArea(v as typeof area)}
        />
        <FilterDropdown
          label="Rating"
          value={minStars === 3 ? "All ratings" : `${minStars}★ +`}
          options={[
            { v: "3", l: "All ratings" },
            { v: "4", l: "4★ and up" },
            { v: "5", l: "5★ only" },
          ]}
          onSelect={v => setMinStars(Number(v) as typeof minStars)}
        />
      </div>

      {/* Alt list */}
      <div
        className="flex gap-2 overflow-x-auto px-3.5 pb-3 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {filtered.length === 0 && (
          <p className="text-[11px] text-ct-text-muted py-4">No hotels match — loosen a filter.</p>
        )}
        {filtered.map(h => (
          <HotelOptCard
            key={h.id}
            opt={h}
            current={h.id === currentHotelId}
            picked={false}
            onPick={() => onReplace(h.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterDropdown({
  label, value, options, onSelect,
}: {
  label: string;
  value: string;
  options: { v: string; l: string }[];
  onSelect: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors select-none cursor-pointer",
          open
            ? "border-ct-border-strong bg-ct-action text-white"
            : "border-ct-border bg-ct-surface text-ct-text-secondary hover:border-ct-border-medium",
        )}
      >
        <span className={cn("opacity-70", open && "opacity-100")}>{label}</span>
        <span className="font-semibold">{value}</span>
        <CaretDown size={9} weight="bold" className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 left-0 min-w-[160px] bg-ct-surface border border-ct-border rounded-lg shadow-[var(--shadow-ct-md)] p-1">
          {options.map(o => (
            <button
              key={o.v}
              onClick={() => { onSelect(o.v); setOpen(false); }}
              className="w-full text-left text-[11.5px] text-ct-text px-2.5 py-1.5 rounded-md hover:bg-ct-surface-subtle transition-colors"
            >
              {o.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── A single stay block in the timeline ──────────────── */
function StayRow({
  block, hotel, expanded, onToggleSwap, onReplace,
  onSplit, onMerge, onAddNight, onRemoveNight,
  canMerge,
}: {
  block: StayBlock;
  hotel: HotelOpt;
  expanded: boolean;
  onToggleSwap: () => void;
  onReplace: (hotelId: string) => void;
  onSplit: () => void;
  onMerge: () => void;
  onAddNight: () => void;
  onRemoveNight: () => void;
  canMerge: boolean;
}) {
  const n = nights(block);
  const total = hotel.pricePerNight * n;

  return (
    <div className="relative pl-6">
      {/* timeline dot + line */}
      <div className="absolute left-0 top-2 flex flex-col items-center">
        <span className="w-3 h-3 rounded-full bg-ct-action ring-4 ring-ct-surface" />
        <span className="w-px flex-1 bg-ct-border-light mt-1" style={{ height: expanded ? "100%" : "200%" }} />
      </div>

      <div className="space-y-2">
        <StayHeader b={block} />

        {/* hotel card */}
        <div className="flex gap-3 p-2.5 rounded-xl border border-ct-border bg-ct-surface">
          <div className="relative w-[92px] h-[92px] rounded-lg overflow-hidden shrink-0 bg-ct-surface-deep">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hotel.img} alt={hotel.name} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-ct-text leading-tight truncate">{hotel.name}</p>
                <p className="text-[10.5px] text-ct-text-muted mt-0.5 flex items-center gap-1 truncate">
                  <MapPin size={9} weight="fill" />
                  {hotel.area} · {hotel.stars}★
                  <span className="ml-1 inline-flex items-center gap-0.5 text-ct-text-secondary font-semibold">
                    <Star size={9} weight="fill" className="text-ct-warning" /> {hotel.rating}
                  </span>
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-bold text-ct-text leading-none">{inr(total)}</p>
                <p className="text-[10px] text-ct-text-muted mt-0.5">{inr(hotel.pricePerNight)} × {n} nt</p>
              </div>
            </div>

            <p className="text-[10.5px] text-ct-text-secondary mt-1.5 leading-snug">
              <Sparkle size={10} weight="fill" className="inline -mt-0.5 mr-1 text-ct-orange" />
              {block.rationale}
            </p>

            {/* Actions row */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <button
                onClick={onToggleSwap}
                className={cn(
                  "inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors select-none cursor-pointer",
                  expanded
                    ? "border-ct-border-strong bg-ct-action text-white"
                    : "border-ct-border bg-ct-surface text-ct-text hover:border-ct-border-medium",
                )}
              >
                <ArrowsLeftRight size={10} weight="bold" />
                {expanded ? "Close" : "Swap stay"}
              </button>

              {/* Night controls */}
              <div className="inline-flex items-center gap-0.5 rounded-full border border-ct-border bg-ct-surface px-1 py-0.5">
                <button
                  onClick={onRemoveNight}
                  disabled={n <= 1}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-ct-text-secondary hover:bg-ct-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Remove a night"
                >
                  <Minus size={9} weight="bold" />
                </button>
                <span className="text-[10.5px] font-semibold text-ct-text px-1 tabular-nums min-w-[14px] text-center">{n}</span>
                <button
                  onClick={onAddNight}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-ct-text-secondary hover:bg-ct-surface-subtle transition-colors"
                  title="Add a night"
                >
                  <Plus size={9} weight="bold" />
                </button>
              </div>

              {n > 1 && (
                <button
                  onClick={onSplit}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-ct-text-secondary hover:text-ct-text px-2 py-1 rounded-full hover:bg-ct-surface-subtle transition-colors"
                  title="Split into two stays"
                >
                  Split
                </button>
              )}
              {canMerge && (
                <button
                  onClick={onMerge}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-ct-text-secondary hover:text-ct-text px-2 py-1 rounded-full hover:bg-ct-surface-subtle transition-colors"
                  title="Merge with previous stay"
                >
                  Merge ↑
                </button>
              )}
            </div>
          </div>
        </div>

        {expanded && (
          <StaySwapPanel
            block={block}
            currentHotelId={block.hotelId}
            onReplace={onReplace}
            onClose={onToggleSwap}
          />
        )}
      </div>
    </div>
  );
}

export function MultiStayBlock({ onChange }: { onChange?: (summary: string) => void }) {
  const [stays, setStays] = useState<StayBlock[]>(INITIAL_STAYS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalNights = stays.reduce((s, b) => s + nights(b), 0);
  const totalCost   = stays.reduce((s, b) => s + HOTEL_DB[b.hotelId].pricePerNight * nights(b), 0);

  function notify(s: string) { onChange?.(s); }

  function replaceHotel(stayId: string, hotelId: string) {
    setStays(prev => prev.map(s => s.id === stayId
      ? { ...s, hotelId, rationale: HOTEL_DB[hotelId].tag === "Best value"
          ? "Better value for the same area."
          : "Closer to your activities for these days." }
      : s));
    setExpandedId(null);
    notify(`Swapped to ${HOTEL_DB[hotelId].name} for that leg.`);
  }

  function addNight(stayId: string) {
    setStays(prev => prev.map(s => s.id === stayId ? { ...s, toDay: s.toDay + 1 } : s));
    notify("Added a night.");
  }
  function removeNight(stayId: string) {
    setStays(prev => prev.map(s => s.id === stayId && nights(s) > 1 ? { ...s, toDay: s.toDay - 1 } : s));
    notify("Removed a night.");
  }
  function splitStay(stayId: string) {
    setStays(prev => {
      const idx = prev.findIndex(s => s.id === stayId);
      if (idx < 0) return prev;
      const s = prev[idx];
      if (nights(s) < 2) return prev;
      const mid = Math.floor((s.fromDay + s.toDay) / 2);
      const a: StayBlock = { ...s, toDay: mid };
      const b: StayBlock = {
        id: "s" + Date.now(),
        fromDay: mid + 1,
        toDay: s.toDay,
        hotelId: HOTEL_DB[s.hotelId].area === "Ubud" ? "como" : "potato",
        rationale: "Different vibe for the second half — try a new area.",
      };
      return [...prev.slice(0, idx), a, b, ...prev.slice(idx + 1)];
    });
    notify("Split that leg into two stays.");
  }
  function mergeWithPrev(stayId: string) {
    setStays(prev => {
      const idx = prev.findIndex(s => s.id === stayId);
      if (idx <= 0) return prev;
      const a = prev[idx - 1];
      const b = prev[idx];
      const merged: StayBlock = {
        ...a,
        toDay: b.toDay,
        rationale: "One base for the full stretch — fewer check-ins.",
      };
      return [...prev.slice(0, idx - 1), merged, ...prev.slice(idx + 1)];
    });
    notify("Merged the two stays into one.");
  }
  function addStay() {
    setStays(prev => {
      const last = prev[prev.length - 1];
      const fromDay = last ? last.toDay + 1 : 1;
      return [...prev, {
        id: "s" + Date.now(),
        fromDay,
        toDay: fromDay,
        hotelId: "como",
        rationale: "An extra night — pick a different area to explore.",
      }];
    });
  }

  return (
    <div className="bg-ct-surface border border-ct-border rounded-2xl p-3.5 shadow-[var(--shadow-ct-sm)]">
      {/* Header */}
      <div className="flex items-start justify-between mb-3.5">
        <div>
          <p className="text-[12.5px] font-bold text-ct-text">Your stays · {stays.length} hotel{stays.length !== 1 && "s"}</p>
          <p className="text-[10.5px] text-ct-text-muted mt-0.5">
            <CalendarBlank size={10} className="inline -mt-0.5 mr-1" />
            {totalNights} {totalNights === 1 ? "night" : "nights"} · split across {stays.length} stay{stays.length !== 1 && "s"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold tracking-[0.06em] uppercase text-ct-text-subtle">Hotels total</p>
          <p className="text-[14px] font-bold text-ct-text leading-tight">{inr(totalCost)}</p>
        </div>
      </div>

      {/* Timeline of stay blocks */}
      <div className="space-y-4">
        {stays.map((s, i) => (
          <StayRow
            key={s.id}
            block={s}
            hotel={HOTEL_DB[s.hotelId]}
            expanded={expandedId === s.id}
            onToggleSwap={() => setExpandedId(prev => prev === s.id ? null : s.id)}
            onReplace={hid => replaceHotel(s.id, hid)}
            onSplit={() => splitStay(s.id)}
            onMerge={() => mergeWithPrev(s.id)}
            onAddNight={() => addNight(s.id)}
            onRemoveNight={() => removeNight(s.id)}
            canMerge={i > 0}
          />
        ))}
      </div>

      {/* Add stay */}
      <button
        onClick={addStay}
        className="mt-3.5 ml-6 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-ct-text-secondary border border-dashed border-ct-border-medium hover:border-ct-action hover:text-ct-text bg-ct-surface px-3 py-1.5 rounded-full transition-colors"
      >
        <Plus size={11} weight="bold" />
        Add another stay
      </button>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   ACTIVITIES CUSTOMIZER
   Visual, inline, card-based replacement for the old
   text-list customizer. Each activity row expands inline
   to reveal a horizontal carousel of rich alternates with
   images, ratings, traveller mentions, duration and price.
═══════════════════════════════════════════════════════════ */

type ActType =
  | "hotel" | "beach" | "food" | "nature" | "shopping" | "culture"
  | "dance" | "trek" | "flight" | "sunset" | "spa" | "walk";

interface ActivityLike {
  time: string;
  name: string;
  type: ActType;
  img?: string;
}

interface ActivityAlt {
  name: string;
  type: ActType;
  duration: string;     // "2h" / "Half day"
  area: string;         // "Ubud · centre"
  rating: number;       // 4.7
  mentions: number;     // 184
  price: string;        // "₹600" / "Free"
  img: string;
  blurb: string;
  tag?: "Crowd favourite" | "Hidden gem" | "Quick win" | "Local pick";
}

function actIcon(t: ActType, size = 12) {
  const cls = "text-ct-action-icon";
  switch (t) {
    case "hotel":    return <Bed size={size} className={cls} />;
    case "beach":    return <Waves size={size} className={cls} />;
    case "food":     return <ForkKnife size={size} className={cls} />;
    case "nature":   return <Tree size={size} className={cls} />;
    case "shopping": return <ShoppingBag size={size} className={cls} />;
    case "culture":  return <Church size={size} className={cls} />;
    case "dance":    return <MusicNote size={size} className={cls} />;
    case "trek":     return <Mountains size={size} className={cls} />;
    case "flight":   return <AirplaneTilt size={size} className={cls} />;
    case "sunset":   return <SunHorizon size={size} className={cls} />;
    case "spa":      return <Sparkle size={size} className={cls} />;
    case "walk":     return <Footprints size={size} className={cls} />;
    default:         return <Compass size={size} className={cls} />;
  }
}

/* Synthesise a richer alt from a plain name + a hint type */
function synthAlt(name: string, hintType: ActType, idx: number, location: string): ActivityAlt {
  const seed = encodeURIComponent(name).slice(0, 24);
  const lower = name.toLowerCase();
  const t: ActType =
    /walk|ridge|trail/.test(lower)             ? "walk"     :
    /trek|hike|sunrise|mount|volcano|ridge/.test(lower) ? "trek"  :
    /beach|surf|bay|cove/.test(lower)          ? "beach"    :
    /temple|palace|kecak|holy|spring/.test(lower) ? "culture":
    /forest|monkey|sanctuary|garden|paddy|terrace/.test(lower) ? "nature" :
    /market|shop|silver|gallery/.test(lower)   ? "shopping" :
    /spa|massage|wellness/.test(lower)         ? "spa"      :
    /dance|music|fire/.test(lower)             ? "dance"    :
    /sunset|golden/.test(lower)                ? "sunset"   :
    /dinner|lunch|breakfast|cafe|warung|food|restaurant|tasting/.test(lower) ? "food" :
    hintType;

  const tags: ActivityAlt["tag"][] = ["Crowd favourite", "Hidden gem", "Quick win", "Local pick", undefined, undefined];
  const durations = ["1h", "1.5h", "2h", "2.5h", "3h", "Half day"];
  const prices = ["Free", "₹400", "₹600", "₹900", "₹1,200", "₹1,800", "₹2,400"];

  return {
    name,
    type: t,
    duration: durations[(name.length + idx) % durations.length],
    area: `${location} · ${["centre", "old town", "north", "ridge"][idx % 4]}`,
    rating: 4.3 + ((name.length + idx) % 7) * 0.08,
    mentions: 40 + ((name.length * 7 + idx * 13) % 220),
    price: prices[(name.length + idx) % prices.length],
    img: `https://picsum.photos/seed/act-${seed}-${idx}/600/420`,
    blurb: pickBlurb(t, idx),
    tag: tags[(name.length + idx) % tags.length],
  };
}

function pickBlurb(t: ActType, i: number) {
  const map: Record<string, string[]> = {
    nature:   ["Lush trail through paddy fields and shaded canopy.", "Quiet sanctuary best visited early."],
    trek:     ["Steady climb with sweeping caldera views at the top.", "Pre-dawn hike — bring a light jacket."],
    culture:  ["Modest dress required. A sarong is provided at the gate.", "Open courtyards with daily ceremonies."],
    food:     ["Reservation recommended. Ask for the chef's special.", "Family-run kitchen with daily-changing thali."],
    beach:    ["Calm in the late afternoon — watch the rip current.", "Soft sand cove tucked below the cliff path."],
    shopping: ["Bargain politely — start at about 40% of the asking price.", "Workshop in the back where you can watch silver work."],
    sunset:   ["Arrive an hour before — golden hour lasts about 25 minutes.", "Pair with a cliff-top drink for the best view."],
    spa:      ["Allow 30 minutes after your session for tea and cool-down.", "Couples rooms available — book ahead."],
    dance:    ["Open seating. Arrive 20 minutes early for a good row.", "Held in the temple courtyard at dusk."],
    walk:     ["Easy stroll. Mornings are quieter and cooler.", "Loop trail with a café stop at the halfway point."],
  };
  const arr = map[t] ?? ["A well-loved Bali experience."];
  return arr[i % arr.length];
}

const FILTER_TYPES: { v: "all" | ActType; l: string }[] = [
  { v: "all",      l: "All" },
  { v: "nature",   l: "Nature" },
  { v: "culture",  l: "Culture" },
  { v: "food",     l: "Food" },
  { v: "shopping", l: "Shopping" },
  { v: "trek",     l: "Adventure" },
  { v: "spa",      l: "Wellness" },
];

/* Small star row */
function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-semibold text-ct-text">
      <Star size={9} weight="fill" className="text-ct-warning" />
      {value.toFixed(1)}
    </span>
  );
}

/* ── Rich alternate activity card ─────────────────────── */
function ActAltCard({
  alt, picked, onPick,
}: { alt: ActivityAlt; picked: boolean; onPick: () => void }) {
  return (
    <button
      onClick={onPick}
      className={cn(
        "shrink-0 w-[210px] text-left rounded-xl border bg-ct-surface overflow-hidden transition-all snap-start",
        picked
          ? "border-ct-action shadow-[var(--shadow-ct-sm)]"
          : "border-ct-border hover:border-ct-border-medium hover:shadow-[var(--shadow-ct-xs)]",
      )}
    >
      <div className="relative w-full aspect-[5/3] bg-ct-surface-deep overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={alt.img} alt={alt.name} className="w-full h-full object-cover" loading="lazy" />
        {alt.tag && (
          <span className="absolute top-2 left-2 bg-ct-surface/95 text-[9.5px] font-semibold text-ct-text px-2 py-0.5 rounded-full shadow-[var(--shadow-ct-xs)]">
            {alt.tag}
          </span>
        )}
        <div className="absolute bottom-2 right-2 bg-ct-action/85 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {alt.price}
        </div>
        <div className="absolute bottom-2 left-2 bg-ct-surface/95 text-[10px] font-semibold text-ct-text px-2 py-0.5 rounded-full inline-flex items-center gap-1">
          <Clock size={9} weight="bold" /> {alt.duration}
        </div>
      </div>

      <div className="p-2.5">
        <p className="text-[12px] font-bold text-ct-text leading-tight line-clamp-2">{alt.name}</p>
        <p className="text-[10.5px] text-ct-text-muted mt-0.5 flex items-center gap-1 truncate">
          <MapPin size={9} weight="fill" />
          {alt.area}
        </p>
        <p className="text-[10.5px] text-ct-text-secondary mt-1.5 leading-snug line-clamp-2">{alt.blurb}</p>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-ct-border-light">
          <div className="flex items-center gap-1.5">
            <Stars value={alt.rating} />
            <span className="text-[10px] text-ct-text-muted">· {alt.mentions} saved</span>
          </div>
          <span className={cn(
            "text-[9.5px] font-semibold flex items-center gap-0.5 transition-colors",
            picked ? "text-ct-success" : "text-ct-text-muted",
          )}>
            {picked ? <><Check size={9} weight="bold" /> Swapped</> : "Replace"}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ── Selected activity row (always visible) ───────────── */
function ActivityRow({
  act, expanded, picked, justSwapped, onToggle,
}: {
  act: ActivityLike;
  expanded: boolean;
  picked: boolean;
  justSwapped: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-xl border bg-ct-surface text-left transition-all",
        expanded
          ? "border-ct-border-strong shadow-[var(--shadow-ct-sm)]"
          : picked
            ? "border-ct-border-medium"
            : "border-ct-border hover:border-ct-border-medium",
      )}
    >
      <div className="relative w-12 h-12 rounded-lg bg-ct-surface-deep overflow-hidden shrink-0">
        {act.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={act.img} alt={act.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {actIcon(act.type, 16)}
          </div>
        )}
        <span className="absolute -bottom-0 -right-0 w-4 h-4 rounded-full bg-ct-surface border border-ct-border-light flex items-center justify-center">
          {actIcon(act.type, 9)}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] font-bold text-ct-text leading-tight truncate">{act.name}</p>
        <p className="text-[10.5px] text-ct-text-muted mt-0.5 flex items-center gap-1.5">
          <Clock size={9} weight="bold" />
          {act.time}
          {justSwapped && (
            <span className="text-[9.5px] font-semibold text-ct-success bg-ct-success-light px-1.5 py-0.5 rounded-full ml-1">
              Just swapped
            </span>
          )}
        </p>
      </div>

      <span className={cn(
        "shrink-0 inline-flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-full border transition-colors",
        expanded
          ? "border-ct-border-strong bg-ct-action text-white"
          : "border-ct-border text-ct-text-secondary group-hover:border-ct-border-medium",
      )}>
        <ArrowsLeftRight size={10} weight="bold" />
        {expanded ? "Close" : "Swap"}
      </span>
    </button>
  );
}

/* ── Inline expand panel: filters + alt carousel ──────── */
function ActSwapPanel({
  alts, currentName, onReplace,
}: {
  alts: ActivityAlt[];
  currentName: string;
  onReplace: (alt: ActivityAlt) => void;
}) {
  const [filter, setFilter] = useState<"all" | ActType>("all");
  const filtered = filter === "all" ? alts : alts.filter(a => a.type === filter);

  return (
    <div className="mt-2 mb-1 rounded-xl border border-ct-border bg-ct-surface-raised overflow-hidden animate-[ct-act-expand_240ms_cubic-bezier(0.4,0,0.2,1)]">
      <style>{`
        @keyframes ct-act-expand {
          from { opacity: 0; transform: translateY(-4px); max-height: 0; }
          to   { opacity: 1; transform: translateY(0);    max-height: 500px; }
        }
      `}</style>

      <div className="flex items-center justify-between px-3 pt-2.5 pb-2">
        <p className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-ct-text-subtle">
          Pick a replacement
        </p>
        <p className="text-[10.5px] text-ct-text-muted">
          Currently <span className="font-semibold text-ct-text-secondary">{currentName}</span>
        </p>
      </div>

      <div
        className="flex items-center gap-1.5 px-3 pb-2.5 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {FILTER_TYPES.map(f => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={cn(
              "shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap transition-colors select-none cursor-pointer",
              filter === f.v
                ? "border-ct-border-strong bg-ct-action text-white"
                : "border-ct-border bg-ct-surface text-ct-text-secondary hover:border-ct-border-medium",
            )}
          >
            {f.l}
          </button>
        ))}
      </div>

      <div
        className="flex gap-2 overflow-x-auto px-3 pb-3 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {filtered.length === 0 && (
          <p className="text-[11px] text-ct-text-muted py-4">No matches — try another filter.</p>
        )}
        {filtered.map(alt => (
          <ActAltCard
            key={alt.name}
            alt={alt}
            picked={false}
            onPick={() => onReplace(alt)}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Add-activity preset palette ──────────────────────── */
const ADD_PRESETS: { name: string; type: ActType; duration: string }[] = [
  { name: "Sunset cocktails at a cliff bar", type: "sunset",  duration: "1.5h" },
  { name: "Local cooking class",             type: "food",    duration: "3h"   },
  { name: "Spa & flower bath ritual",        type: "spa",     duration: "2h"   },
  { name: "Sunrise hike to a viewpoint",     type: "trek",    duration: "3h"   },
  { name: "Traditional dance performance",   type: "dance",   duration: "1.5h" },
  { name: "Café-hopping morning",            type: "food",    duration: "2h"   },
  { name: "Beach time & swim",               type: "beach",   duration: "2h"   },
  { name: "Artisan market browse",           type: "shopping",duration: "1.5h" },
  { name: "Temple visit",                    type: "culture", duration: "1h"   },
  { name: "Rice paddy walk",                 type: "walk",    duration: "1h"   },
];

/* Pick the next round time after the latest scheduled slot, e.g. "20:30". */
function nextSlotTime(activities: ActivityLike[]): string {
  let maxMin = 9 * 60; // default 09:00
  for (const a of activities) {
    const m = /(\d{1,2}):(\d{2})/.exec(a.time);
    if (m) {
      const t = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
      if (t > maxMin) maxMin = t;
    }
  }
  const next = Math.min(maxMin + 90, 22 * 60 + 30); // +1.5h, cap 22:30
  const hh = String(Math.floor(next / 60)).padStart(2, "0");
  const mm = String(next % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

/* ── Top-level customizer (drop-in replacement) ───────── */
export function ActivitiesCustomizer({
  day,
  onSwap,
  onAdd,
  onClose,
}: {
  day: {
    day: number;
    location: string;
    activities: ActivityLike[];
    alternatives: string[][];
  };
  onSwap: (dayIdx: number, slotIdx: number, newActivity: string) => void;
  onAdd?: (dayIdx: number, activity: ActivityLike) => void;
  onClose: () => void;
}) {
  const [expandedSlot, setExpandedSlot] = useState<number | null>(null);
  const [recentlySwapped, setRecentlySwapped] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);

  /* Build rich alts per slot from the existing string-list data */
  function altsForSlot(slot: number): ActivityAlt[] {
    const list = day.alternatives[slot % day.alternatives.length] ?? [];
    return list.map((name, i) => synthAlt(name, day.activities[slot]?.type ?? "nature", i, day.location));
  }

  function handleReplace(slot: number, alt: ActivityAlt) {
    onSwap(day.day - 1, slot, alt.name);
    setExpandedSlot(null);
    setRecentlySwapped(slot);
    setTimeout(() => setRecentlySwapped(null), 2400);
  }

  function handleAddPick(p: { name: string; type: ActType; duration: string }) {
    const time = nextSlotTime(day.activities);
    onAdd?.(day.day - 1, { time, name: p.name, type: p.type });
    setAdding(false);
    setJustAdded(p.name);
    setTimeout(() => setJustAdded(null), 2400);
  }

  // Filter presets to ones not already on the day
  const existingNames = new Set(day.activities.map(a => a.name));
  const availablePresets = ADD_PRESETS.filter(p => !existingNames.has(p.name));

  return (
    <div className="rounded-2xl border border-ct-border bg-ct-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ct-border-light bg-ct-surface-raised">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-ct-text-subtle">
            Customise · Day {day.day}
          </p>
          <p className="text-[12.5px] font-bold text-ct-text leading-tight mt-0.5">
            {day.location} · {day.activities.length} activities
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full border border-ct-border text-ct-text-muted hover:bg-ct-surface-subtle transition-colors"
          title="Close"
        >
          <X size={11} />
        </button>
      </div>

      {/* AI hint */}
      <div className="flex items-start gap-2 px-4 py-2.5 bg-ct-orange-light border-b border-ct-orange-border">
        <Sparkle size={11} weight="fill" className="text-ct-orange mt-0.5 shrink-0" />
        <p className="text-[11px] text-ct-text-secondary leading-snug">
          Tap any activity to see swaps with photos, ratings and traveller picks. Your day will rebuild around the new pick.
        </p>
      </div>

      {/* Activities timeline */}
      <div className="p-3 space-y-1.5">
        {day.activities.map((act, i) => (
          <div key={i} className="group">
            <ActivityRow
              act={act}
              expanded={expandedSlot === i}
              picked={recentlySwapped === i}
              justSwapped={recentlySwapped === i}
              onToggle={() => setExpandedSlot(prev => prev === i ? null : i)}
            />
            {expandedSlot === i && (
              <ActSwapPanel
                alts={altsForSlot(i)}
                currentName={act.name}
                onReplace={(alt) => handleReplace(i, alt)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Add-activity inline picker */}
      {adding && (
        <div className="px-3 pt-1 pb-3 border-t border-ct-border-light bg-ct-surface-raised animate-[ct-act-expand_240ms_cubic-bezier(0.4,0,0.2,1)]">
          <div className="flex items-center justify-between px-1 pt-2 pb-2">
            <p className="text-[10.5px] font-semibold tracking-[0.06em] uppercase text-ct-text-subtle">
              Pick something to add
            </p>
            <button
              onClick={() => setAdding(false)}
              className="text-[10.5px] text-ct-text-muted hover:text-ct-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
          {availablePresets.length === 0 ? (
            <p className="text-[11px] text-ct-text-muted px-1 py-2">
              You&apos;ve already added every suggestion for this day. Try swapping an existing slot instead.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {availablePresets.map(p => (
                <button
                  key={p.name}
                  onClick={() => handleAddPick(p)}
                  className="flex items-start gap-2 text-left rounded-xl border border-ct-border bg-ct-surface px-2.5 py-2 hover:border-ct-border-medium hover:bg-ct-surface-subtle transition-colors"
                >
                  <span className="w-6 h-6 rounded-lg bg-ct-surface-subtle flex items-center justify-center shrink-0 mt-0.5">
                    {actIcon(p.type, 12)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11.5px] font-semibold text-ct-text leading-tight truncate">
                      {p.name}
                    </span>
                    <span className="block text-[10px] text-ct-text-muted mt-0.5 flex items-center gap-1">
                      <Clock size={9} /> {p.duration}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-ct-border-light bg-ct-surface-raised">
        <button
          onClick={() => setAdding(v => !v)}
          aria-expanded={adding}
          className={cn(
            "inline-flex items-center gap-1.5 text-[11.5px] font-semibold border border-dashed px-3 py-1.5 rounded-full transition-colors",
            adding
              ? "border-ct-action text-ct-text bg-ct-surface-subtle"
              : "border-ct-border-medium text-ct-text-secondary bg-ct-surface hover:border-ct-action hover:text-ct-text",
          )}
        >
          <Plus size={11} weight="bold" className={cn("transition-transform", adding && "rotate-45")} />
          {adding ? "Close" : "Add an activity"}
        </button>
        {justAdded ? (
          <span className="ml-auto text-[10.5px] font-semibold text-[#16a34a] flex items-center gap-1">
            <Check size={10} weight="bold" />
            Added “{justAdded.length > 24 ? justAdded.slice(0, 24) + "…" : justAdded}”
          </span>
        ) : (
          <span className="ml-auto text-[10.5px] text-ct-text-muted">
            Changes save automatically
          </span>
        )}
      </div>
    </div>
  );
}

