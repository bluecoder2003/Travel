"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Backpack, AirplaneTilt, Diamond } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────────────────────── */
type ChipId = "where" | "when" | "travelers" | "budget";

interface DateRange { start: string; end: string }
interface TripState {
  destination: string;
  dateMode: "exact" | "flexible";
  dates: DateRange;
  quickPick: string;
  adults: number;
  children: number;
  cabinClass: string;
  budgetPreset: string;
  budgetRange: [number, number];
}

interface ChipInputBarProps {
  onStateChange?: (state: TripState) => void;
  onSend?: (text: string, state: TripState) => void;
  placeholder?: string;
  className?: string;
}

/* ── Constants ─────────────────────────────────────────────── */
const DESTINATIONS = [
  { name: "Bali",      sub: "Indonesia",  img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=120&h=120&fit=crop&auto=format" },
  { name: "Paris",     sub: "France",     img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=120&h=120&fit=crop&auto=format" },
  { name: "Tokyo",     sub: "Japan",      img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=120&h=120&fit=crop&auto=format" },
  { name: "Maldives",  sub: "South Asia", img: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=120&h=120&fit=crop&auto=format" },
  { name: "Manali",    sub: "India",      img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=120&h=120&fit=crop&auto=format" },
  { name: "Rome",      sub: "Italy",      img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=120&h=120&fit=crop&auto=format" },
  { name: "New York",  sub: "USA",        img: "https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=120&h=120&fit=crop&auto=format" },
  { name: "Nairobi",   sub: "Kenya",      img: "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=120&h=120&fit=crop&auto=format" },
];

const QUICK_PICKS = ["Next weekend", "This month", "In June", "In July", "Flexible"];
const CABIN_CLASSES = ["Economy", "Premium", "Business", "First"];
const BUDGET_PRESETS = [
  { id: "budget", label: "Budget", sub: "Under ₹40k", color: "#22c55e" },
  { id: "mid", label: "Mid-range", sub: "₹40k–₹1.5L", color: "#FF4F17" },
  { id: "luxury", label: "Luxury", sub: "₹1.5L+", color: "#a855f7" },
];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAY_NAMES = ["Su","Mo","Tu","We","Th","Fr","Sa"];

/* ── Shared spring config ───────────────────────────────────── */
const spring = { type: "spring" as const, stiffness: 380, damping: 28, mass: 0.8 };
const softSpring = { type: "spring" as const, stiffness: 260, damping: 24, mass: 0.9 };

/* ── Mini Calendar ─────────────────────────────────────────── */
function MiniCalendar({ year, month, selected, onDayClick }: {
  year: number; month: number; selected: DateRange; onDayClick: (iso: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function iso(d: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  function isInRange(d: number) {
    if (!selected.start || !selected.end) return false;
    const s = iso(d);
    return s > selected.start && s < selected.end;
  }
  function isStart(d: number) { return iso(d) === selected.start; }
  function isEnd(d: number) { return iso(d) === selected.end; }

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] text-[#bbb] font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const start = isStart(d);
          const end = isEnd(d);
          const inRange = isInRange(d);
          const today = new Date();
          const past = new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <motion.button
              key={i}
              disabled={past}
              onClick={() => onDayClick(iso(d))}
              whileHover={!past && !start && !end ? { scale: 1.1 } : {}}
              whileTap={!past ? { scale: 0.93 } : {}}
              transition={spring}
              className={cn(
                "h-7 w-full text-[11px] font-medium relative rounded-full transition-colors",
                past && "text-[#ddd] cursor-not-allowed",
                !past && !start && !end && !inRange && "text-[#444] hover:bg-[#fff3ef]",
                inRange && "bg-[#fff3ef] text-[#FF4F17] rounded-none",
                (start || end) && "bg-[#FF4F17] text-white z-10",
              )}
            >
              {d}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Where Panel ───────────────────────────────────────────── */
function WherePanel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  const filtered = query.trim()
    ? DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.sub.toLowerCase().includes(query.toLowerCase()))
    : DESTINATIONS;

  return (
    <div className="p-3 space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2 bg-[#f8f9fb] border border-[#ebebeb] rounded-xl px-3 py-2">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          autoFocus
          value={query}
          onChange={e => { setQuery(e.target.value); if (e.target.value.trim()) onChange(e.target.value.trim()); }}
          onKeyDown={e => { if (e.key === "Enter" && query.trim()) onChange(query.trim()); }}
          placeholder="Search destinations…"
          className="flex-1 text-[13px] text-[#1a1a1a] placeholder:text-[#ccc] bg-transparent outline-none"
        />
        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={spring}
              onClick={() => { setQuery(""); onChange(""); }}
              className="text-[#ccc] hover:text-[#888] transition-colors text-sm leading-none w-4 h-4 flex items-center justify-center"
            >×</motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Photo grid */}
      <div>
        <p className="text-[10.5px] font-semibold text-[#bbb] uppercase tracking-wide mb-2">
          {query.trim() ? "Results" : "Trending destinations"}
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {filtered.slice(0, 8).map((dest, i) => {
            const selected = value === dest.name;
            return (
              <motion.button
                key={dest.name}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...softSpring, delay: i * 0.03 }}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { setQuery(dest.name); onChange(dest.name); }}
                className={cn(
                  "relative flex flex-col rounded-xl overflow-hidden border transition-colors",
                  selected ? "border-[#FF4F17]" : "border-transparent hover:border-gray-200",
                )}
              >
                {/* Photo */}
                <div className="w-full aspect-square overflow-hidden bg-[#f0f0f0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dest.img}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    loading="lazy"
                  />
                </div>
                {/* Label */}
                <div className={cn(
                  "px-1.5 py-1.5 text-left transition-colors",
                  selected ? "bg-[#fff3ef]" : "bg-white",
                )}>
                  <p className={cn("text-[11px] font-semibold leading-tight truncate", selected ? "text-[#FF4F17]" : "text-[#1a1a1a]")}>
                    {dest.name}
                  </p>
                  <p className="text-[9.5px] text-[#bbb] leading-tight">{dest.sub}</p>
                </div>
                {/* Selected checkmark */}
                {selected && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#FF4F17] flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── When Panel ────────────────────────────────────────────── */
function WhenPanel({ dateMode, dates, quickPick, onDateModeChange, onDatesChange, onQuickPickChange }: {
  dateMode: "exact" | "flexible"; dates: DateRange; quickPick: string;
  onDateModeChange: (m: "exact" | "flexible") => void;
  onDatesChange: (d: DateRange) => void;
  onQuickPickChange: (q: string) => void;
}) {
  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  function handleDayClick(iso: string) {
    if (!dates.start || (dates.start && dates.end)) {
      onDatesChange({ start: iso, end: "" });
    } else {
      if (iso < dates.start) onDatesChange({ start: iso, end: dates.start });
      else onDatesChange({ start: dates.start, end: iso });
    }
  }

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  }

  function formatDate(iso: string) {
    if (!iso) return "";
    const [, m, d] = iso.split("-");
    return `${MONTH_NAMES[parseInt(m) - 1]} ${d}`;
  }

  return (
    <div className="p-3 space-y-3">
      {/* Pill toggle */}
      <div className="relative flex gap-0 p-1 bg-[#f5f5f5] rounded-xl">
        {(["exact", "flexible"] as const).map(mode => (
          <button
            key={mode}
            onClick={() => onDateModeChange(mode)}
            className="relative flex-1 py-1.5 text-[12px] font-semibold rounded-lg z-10 transition-colors"
            style={{ color: dateMode === mode ? "#1a1a1a" : "#999" }}
          >
            {dateMode === mode && (
              <motion.div
                layoutId="dateModeIndicator"
                className="absolute inset-0 bg-white rounded-lg shadow-sm"
                style={{ zIndex: -1 }}
                transition={spring}
              />
            )}
            {mode === "exact" ? "Exact dates" : "I'm flexible"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {dateMode === "exact" ? (
          <motion.div
            key="exact"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={softSpring}
            className="space-y-3"
          >
            <AnimatePresence>
              {(dates.start || dates.end) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={softSpring}
                  className="flex items-center gap-2 text-[12px] overflow-hidden"
                >
                  <div className={cn("flex-1 text-center py-1.5 rounded-lg border transition-colors", dates.start ? "border-[#FF4F17] bg-[#fff3ef] text-[#FF4F17] font-semibold" : "border-[#f0f0f0] text-[#ccc]")}>
                    {dates.start ? formatDate(dates.start) : "Depart"}
                  </div>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                  <div className={cn("flex-1 text-center py-1.5 rounded-lg border transition-colors", dates.end ? "border-[#FF4F17] bg-[#fff3ef] text-[#FF4F17] font-semibold" : "border-[#f0f0f0] text-[#ccc]")}>
                    {dates.end ? formatDate(dates.end) : "Return"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <motion.button
                onClick={prevMonth}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={spring}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f5f5f5]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </motion.button>
              <motion.span
                key={`${calMonth}-${calYear}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={spring}
                className="text-[12px] font-semibold text-[#1a1a1a]"
              >
                {MONTH_NAMES[calMonth]} {calYear}
              </motion.span>
              <motion.button
                onClick={nextMonth}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={spring}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#f5f5f5]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </motion.button>
            </div>

            <MiniCalendar year={calYear} month={calMonth} selected={dates} onDayClick={handleDayClick} />

            <AnimatePresence>
              {(dates.start || dates.end) && (
                <motion.button
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => onDatesChange({ start: "", end: "" })}
                  className="w-full text-[11px] text-[#ccc] hover:text-[#888] transition-colors py-1"
                >
                  Clear dates
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="flexible"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={softSpring}
            className="space-y-2.5"
          >
            <p className="text-[10.5px] font-semibold text-[#bbb] uppercase tracking-wide">Quick picks</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PICKS.map((pick, i) => {
                const active = quickPick === pick;
                return (
                  <motion.button
                    key={pick}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ ...spring, delay: i * 0.04 }}
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => onQuickPickChange(pick)}
                    className={cn(
                      "relative px-3 py-1.5 rounded-full text-[12px] font-medium border overflow-hidden",
                      active ? "border-[#FF4F17] text-white" : "border-[#e5e7eb] text-[#444] hover:border-[#FF4F17] hover:text-[#FF4F17]",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="quickPickBg"
                        className="absolute inset-0 bg-[#FF4F17]"
                        transition={spring}
                      />
                    )}
                    <span className="relative z-10">{pick}</span>
                  </motion.button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#bbb] leading-relaxed">
              AI will find the best fares and suggest the optimal window.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Animated number ────────────────────────────────────────── */
function AnimatedCount({ value }: { value: number }) {
  const prevRef = useRef(value);
  const dirRef = useRef(0);
  if (value !== prevRef.current) {
    dirRef.current = value > prevRef.current ? 1 : -1;
  }

  useEffect(() => { prevRef.current = value; }, [value]);

  const dir = dirRef.current;

  return (
    <div className="w-5 h-5 flex items-center justify-center overflow-hidden relative">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: dir > 0 ? 14 : -14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: dir > 0 ? -14 : 14, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="text-[14px] font-bold text-[#1a1a1a] absolute"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

/* ── Stepper row (defined outside TravelersPanel to avoid component-in-render) */
function StepperRow({ label, sub, value, min, max, onChange }: {
  label: string; sub: string; value: number; min: number; max: number; onChange: (n: number) => void;
}) {
  const canDec = value > min;
  const canInc = value < max;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#f7f7f7] last:border-0">
      <div>
        <p className="text-[13px] font-medium text-[#1a1a1a]">{label}</p>
        <p className="text-[11px] text-[#bbb]">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <motion.button
          disabled={!canDec}
          onClick={() => onChange(value - 1)}
          whileHover={canDec ? { scale: 1.1 } : {}}
          whileTap={canDec ? { scale: 0.88 } : {}}
          transition={spring}
          className={cn(
            "w-8 h-8 rounded-full border flex items-center justify-center text-lg font-light transition-colors select-none",
            !canDec ? "border-[#f0f0f0] text-[#ddd] cursor-not-allowed" : "border-[#e5e7eb] text-[#555] hover:border-[#FF4F17] hover:text-[#FF4F17]",
          )}
        >−</motion.button>
        <AnimatedCount value={value} />
        <motion.button
          disabled={!canInc}
          onClick={() => onChange(value + 1)}
          whileHover={canInc ? { scale: 1.1 } : {}}
          whileTap={canInc ? { scale: 0.88 } : {}}
          transition={spring}
          className={cn(
            "w-8 h-8 rounded-full border flex items-center justify-center text-lg font-light transition-colors select-none",
            !canInc ? "border-[#f0f0f0] text-[#ddd] cursor-not-allowed" : "border-[#e5e7eb] text-[#555] hover:border-[#FF4F17] hover:text-[#FF4F17]",
          )}
        >+</motion.button>
      </div>
    </div>
  );
}

/* ── Travelers Panel ───────────────────────────────────────── */
function TravelersPanel({ adults, children, cabinClass, onAdultsChange, onChildrenChange, onCabinChange }: {
  adults: number; children: number; cabinClass: string;
  onAdultsChange: (n: number) => void;
  onChildrenChange: (n: number) => void;
  onCabinChange: (c: string) => void;
}) {
  return (
    <div className="p-3 space-y-1">
      <StepperRow label="Adults" sub="Age 12+" value={adults} min={1} max={9} onChange={onAdultsChange} />
      <StepperRow label="Children" sub="Age 2–11" value={children} min={0} max={8} onChange={onChildrenChange} />

      <div className="pt-3">
        <p className="text-[10.5px] font-semibold text-[#bbb] uppercase tracking-wide mb-2">Cabin class</p>
        <div className="grid grid-cols-2 gap-1.5">
          {CABIN_CLASSES.map(c => {
            const active = cabinClass === c;
            return (
              <motion.button
                key={c}
                onClick={() => onCabinChange(c)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                transition={spring}
                className={cn(
                  "relative py-2 px-3 rounded-xl border text-[12px] font-medium text-left overflow-hidden transition-colors",
                  active ? "border-[#FF4F17] text-[#FF4F17]" : "border-[#f0f0f0] text-[#444] hover:border-[#FF4F17]",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="cabinBg"
                    className="absolute inset-0 bg-[#fff3ef]"
                    transition={spring}
                  />
                )}
                <span className="relative z-10">{c}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Budget Panel ──────────────────────────────────────────── */
const BUDGET_ICONS = {
  budget:  <Backpack size={18} weight="duotone" />,
  mid:     <AirplaneTilt size={18} weight="duotone" />,
  luxury:  <Diamond size={18} weight="duotone" />,
} as const;

const BUDGET_META: Record<string, { range: string; bar: string }> = {
  budget:  { range: "Up to ₹40,000",          bar: "20%"  },
  mid:     { range: "₹40,000 – ₹1,50,000",   bar: "50%"  },
  luxury:  { range: "₹1,50,000+",              bar: "88%"  },
};

function BudgetPanel({ preset, range, onPresetChange, onRangeChange }: {
  preset: string; range: [number, number];
  onPresetChange: (p: string) => void;
  onRangeChange: (r: [number, number]) => void;
}) {
  const [showCustom, setShowCustom] = useState(preset === "custom");
  const [localMax, setLocalMax] = useState(range[1] || 80000);

  const RANGES: Record<string, [number, number]> = {
    budget: [0, 40000], mid: [40000, 150000], luxury: [150000, 500000],
  };

  function handlePreset(id: string) {
    onPresetChange(id);
    onRangeChange(RANGES[id]);
    setLocalMax(RANGES[id][1]);
    setShowCustom(false);
  }

  const barPct = preset === "budget" ? "20%"
    : preset === "mid" ? "50%"
    : preset === "luxury" ? "88%"
    : `${Math.round((localMax / 500000) * 100)}%`;

  const rangeLabel = preset && preset !== "custom"
    ? BUDGET_META[preset].range
    : `Up to ₹${localMax.toLocaleString("en-IN")}`;

  return (
    <div className="p-3 space-y-3">

      {/* Segmented toggle */}
      <div className="relative flex p-1 bg-[#f5f5f5] rounded-xl">
        {BUDGET_PRESETS.map(bp => {
          const active = preset === bp.id;
          return (
            <button
              key={bp.id}
              onClick={() => handlePreset(bp.id)}
              className="relative flex-1 flex flex-col items-center py-2.5 gap-1 text-[12px] font-semibold rounded-lg z-10 transition-colors"
              style={{ color: active ? "#1a1a1a" : "#999" }}
            >
              {active && (
                <motion.div
                  layoutId="budgetIndicator"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm"
                  style={{ zIndex: -1 }}
                  transition={spring}
                />
              )}
              <span className="leading-none">{BUDGET_ICONS[bp.id as keyof typeof BUDGET_ICONS]}</span>
              <span>{bp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Range label + bar (bar becomes slider in custom mode) */}
      <div className="space-y-2 px-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] text-[#bbb]">₹0</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={rangeLabel}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.14 }}
              className="text-[11px] font-semibold text-[#FF4F17]"
            >
              {rangeLabel}
            </motion.span>
          </AnimatePresence>
          <span className="text-[10.5px] text-[#bbb]">₹5L+</span>
        </div>

        {/*
         * Gray bar — visual in preset mode, interactive in custom mode.
         * In custom mode an invisible <input type="range"> sits exactly on top
         * so the gray fill is the drag handle — no native slider chrome visible.
         */}
        {/* Extra vertical space so the knob (which overflows the 6px bar) isn't clipped */}
        <div className="relative h-4 flex items-center">
          {/* Track */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-[#f0f0f0]">
            {/* Fill */}
            <motion.div
              className="h-full rounded-full bg-[#c8c8c8] pointer-events-none"
              animate={{ width: barPct }}
              transition={{ type: "spring", stiffness: 180, damping: 26 }}
            />
          </div>

          {/* Knob — only in custom mode, sits at the tip of the fill */}
          <AnimatePresence>
            {showCustom && (
              <motion.div
                key="knob"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={spring}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-[#aaa] shadow-sm pointer-events-none z-10"
                style={{ left: barPct }}
              />
            )}
          </AnimatePresence>

          {/* Invisible range input on top */}
          {showCustom && (
            <input
              type="range" min={5000} max={500000} step={5000}
              value={localMax}
              onChange={e => {
                const v = parseInt(e.target.value);
                setLocalMax(v);
                onRangeChange([0, v]);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-grab active:cursor-grabbing"
            />
          )}
        </div>
      </div>

      {/* Custom range toggle button */}
      <button
        onClick={() => {
          const next = !showCustom;
          setShowCustom(next);
          if (next) {
            onPresetChange("custom");
            onRangeChange([0, localMax]);
          }
        }}
        className={cn(
          "w-full py-2 text-[12px] font-medium border rounded-xl transition-colors",
          showCustom
            ? "border-[#FF4F17] text-[#FF4F17] bg-[#fff3ef]"
            : "border-[#ebebeb] text-[#888] hover:border-[#FF4F17] hover:text-[#FF4F17]",
        )}
      >
        {showCustom ? "Custom range" : "+ Set custom range"}
      </button>
    </div>
  );
}

/* ── Chip button — pure CSS transitions, no layout animation ── */
function Chip({ label, value, active, onMouseEnter, onMouseLeave, onClick }: {
  id: ChipId; label: string; value?: string;
  active: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const filled = !!value;
  const displayText = value && !active ? value : label;

  return (
    <button
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12.5px] font-medium border",
        "transition-colors duration-150 whitespace-nowrap select-none",
        active
          ? "border-[#FF4F17] bg-[#FF4F17] text-white"
          : filled
          ? "border-[#FF4F17] bg-[#fff3ef] text-[#FF4F17]"
          : "border-[#e5e7eb] bg-white text-[#555] hover:border-[#FF4F17] hover:text-[#FF4F17]",
      )}
    >
      {/* Dot — only visible when filled & not active, CSS opacity transition */}
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full bg-[#FF4F17] shrink-0 transition-all duration-150",
          filled && !active ? "opacity-100 w-1.5" : "opacity-0 w-0 overflow-hidden",
        )}
      />

      {/* Fixed-width label container so chip never resizes */}
      <span className="relative overflow-hidden" style={{ minWidth: 36 }}>
        {displayText}
      </span>

      {/* Chevron — CSS rotate */}
      <svg
        width="10" height="10" viewBox="0 0 24 24" fill="none"
        stroke={active ? "white" : filled ? "#FF4F17" : "#bbb"}
        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        className={cn("shrink-0 transition-transform duration-200", active && "rotate-180")}
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
  );
}

/* ── Panel content switcher ─────────────────────────────────── */
const PANEL_LABELS: Record<ChipId, string> = {
  where: "Where to?", when: "When?", travelers: "Travelers & Class", budget: "Budget",
};

/* ── Main ChipInputBar ─────────────────────────────────────── */
export default function ChipInputBar({ onStateChange, onSend, placeholder, className }: ChipInputBarProps) {
  const [activeChip, setActiveChip] = useState<ChipId | null>(null);
  const [draft, setDraft] = useState("");

  const [state, setState] = useState<TripState>({
    destination: "",
    dateMode: "exact",
    dates: { start: "", end: "" },
    quickPick: "",
    adults: 1,
    children: 0,
    cabinClass: "Economy",
    budgetPreset: "",
    budgetRange: [0, 80000],
  });

  /* Track whether user has explicitly touched travelers */
  const [travelersSet, setTravelersSet] = useState(false);

  function update<K extends keyof TripState>(key: K, value: TripState[K]) {
    setState(prev => {
      const next = { ...prev, [key]: value };
      onStateChange?.(next);
      return next;
    });
  }

  function updateTravelers(key: "adults" | "children" | "cabinClass", value: number | string) {
    setTravelersSet(true);
    update(key as keyof TripState, value as TripState[keyof TripState]);
  }

  /* Click-outside closes the panel */
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setActiveChip(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function chipValue(id: ChipId): string {
    if (id === "where") return state.destination;
    if (id === "when") {
      if (state.dateMode === "flexible" && state.quickPick) return state.quickPick;
      if (state.dates.start) {
        const s = fmt(state.dates.start);
        const e = state.dates.end ? ` → ${fmt(state.dates.end)}` : "";
        return `${s}${e}`;
      }
      return "";
    }
    if (id === "travelers") {
      if (!travelersSet) return "";
      const total = state.adults + state.children;
      const cabin = state.cabinClass !== "Economy" ? ` · ${state.cabinClass}` : "";
      return `${total} traveler${total !== 1 ? "s" : ""}${cabin}`;
    }
    if (id === "budget") {
      const bp = BUDGET_PRESETS.find(b => b.id === state.budgetPreset);
      if (bp) return bp.label;
      if (state.budgetPreset === "custom") return `Up to ₹${state.budgetRange[1].toLocaleString("en-IN")}`;
      return "";
    }
    return "";
  }

  function fmt(iso: string) {
    const [, m, d] = iso.split("-");
    return `${MONTH_NAMES[parseInt(m) - 1]} ${parseInt(d)}`;
  }

  function handleSend() {
    const hasChipContext = !!(state.destination || state.dates.start || state.quickPick || travelersSet || state.budgetPreset);
    if (!draft.trim() && !hasChipContext) return;
    onSend?.(draft.trim(), state);
    setDraft("");
  }

  const CHIPS: { id: ChipId; label: string }[] = [
    { id: "where", label: "Where" },
    { id: "when", label: "When" },
    { id: "travelers", label: "Travelers" },
    { id: "budget", label: "Budget" },
  ];

  const PANEL_WIDTHS: Record<ChipId, number> = {
    where: 360, when: 280, travelers: 260, budget: 280,
  };

  return (
    /*
     * Single hover zone wraps BOTH the panel and the input bar.
     * Moving between chips or between a chip and the panel never
     * triggers a close — only leaving this entire wrapper does.
     */
    <div ref={wrapperRef} className={cn("relative", className)}>
      {/* ── Floating panel ────────────────────────────────── */}
      <AnimatePresence>
        {activeChip && (
          <motion.div
            key="panel-shell"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={spring}
            className="absolute bottom-full mb-2.5 left-0 z-50"
            /* Stop click events from bubbling and closing */
            onClick={e => e.stopPropagation()}
          >
            {/*
             * Fixed-width shell — width switches instantly (no animated resize).
             * Content is always rendered at the correct width with no reflow.
             */}
            <div
              style={{ width: `min(${PANEL_WIDTHS[activeChip]}px, calc(100vw - 32px))` }}
              className="bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden"
            >
              {/* Header — plain text swap, no AnimatePresence exit */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#f5f5f5]">
                <span className="text-[13px] font-bold text-[#1a1a1a]">
                  {PANEL_LABELS[activeChip]}
                </span>
                <button
                  onClick={() => setActiveChip(null)}
                  className="w-6 h-6 flex items-center justify-center rounded-full text-[#ccc] hover:text-[#555] hover:bg-[#f5f5f5] transition-colors text-base leading-none"
                >×</button>
              </div>

              {/*
               * Content — no AnimatePresence mode="wait" here.
               * We render all four panels simultaneously (hidden via opacity/pointer-events)
               * so there's never a height change that shifts the panel position.
               */}
              <div className="relative">
                {CHIPS.map(chip => (
                  <div
                    key={chip.id}
                    className="transition-opacity duration-150"
                    style={{
                      display: activeChip === chip.id ? "block" : "none",
                    }}
                  >
                    {chip.id === "where" && (
                      <WherePanel value={state.destination} onChange={v => update("destination", v)} />
                    )}
                    {chip.id === "when" && (
                      <WhenPanel
                        dateMode={state.dateMode} dates={state.dates} quickPick={state.quickPick}
                        onDateModeChange={v => update("dateMode", v)}
                        onDatesChange={v => update("dates", v)}
                        onQuickPickChange={v => update("quickPick", v)}
                      />
                    )}
                    {chip.id === "travelers" && (
                      <TravelersPanel
                        adults={state.adults} children={state.children} cabinClass={state.cabinClass}
                        onAdultsChange={v => updateTravelers("adults", v)}
                        onChildrenChange={v => updateTravelers("children", v)}
                        onCabinChange={v => updateTravelers("cabinClass", v)}
                      />
                    )}
                    {chip.id === "budget" && (
                      <BudgetPanel
                        preset={state.budgetPreset} range={state.budgetRange}
                        onPresetChange={v => update("budgetPreset", v)}
                        onRangeChange={v => update("budgetRange", v)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow — fixed position per chip, no animation */}
            <div
              className="absolute -bottom-[5px] w-2.5 h-2.5 bg-white border-r border-b border-[#e8e8e8] rotate-45"
              style={{
                left: activeChip === "where" ? 28 : activeChip === "when" ? 100 : activeChip === "travelers" ? 172 : 254,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Input bar ──────────────────────────────────────── */}
      <div className="bg-white border border-[#e5e7eb] rounded-2xl shadow-sm overflow-hidden">
        {/* Chips — only onMouseEnter per chip; close handled by wrapper onMouseLeave */}
        <div className="flex items-center gap-1.5 px-3 pt-3 pb-2 flex-wrap">
          {CHIPS.map(chip => (
            <Chip
              key={chip.id}
              id={chip.id}
              label={chip.label}
              value={chipValue(chip.id)}
              active={activeChip === chip.id}
              onMouseEnter={() => {}}
              onMouseLeave={() => {}}
              onClick={() => setActiveChip(prev => prev === chip.id ? null : chip.id)}
            />
          ))}
        </div>

        {/* Text input */}
        <div className="flex items-center gap-2 px-4 pb-3">
          <input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
            placeholder={placeholder ?? "Ask anything — change destination, swap hotels, add a day…"}
            className="flex-1 text-[14px] text-[#1a1a1a] placeholder:text-[#ccc] outline-none bg-transparent"
          />
          <motion.button
            onClick={handleSend}
            disabled={!draft.trim() && !(state.destination || state.dates.start || state.quickPick || travelersSet || state.budgetPreset)}
            whileHover={(draft.trim() || state.destination || state.dates.start || state.quickPick || travelersSet || state.budgetPreset) ? { scale: 1.08 } : {}}
            whileTap={(draft.trim() || state.destination || state.dates.start || state.quickPick || travelersSet || state.budgetPreset) ? { scale: 0.92 } : {}}
            transition={spring}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
              (draft.trim() || state.destination || state.dates.start || state.quickPick || travelersSet || state.budgetPreset) ? "bg-[#FF4F17] hover:bg-[#e03d08]" : "bg-[#f0f0f0] cursor-not-allowed",
            )}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={draft.trim() ? "white" : "#ccc"} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
