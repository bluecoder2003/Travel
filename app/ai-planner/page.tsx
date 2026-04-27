"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { SiteHeader } from "../../components/siteheader";
import ChipInputBar from "@/components/chipinputbar";

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

/* ── Planning steps ─────────────────────────────────────── */
const STEPS = [
  { icon: "✈️", text: "Searching 847 flights DEL → GOI · May 15", result: "IndiGo 6E-2241 · ₹4,899/person · Non-stop" },
  { icon: "🏨", text: "Checking 340+ hotels in North Goa · 4 nights", result: "Taj Fort Aguada · 5★ · ₹8,500/night" },
  { icon: "🎯", text: "Curating activities: beach + culture vibes", result: "14 hand-picked experiences across 5 days" },
  { icon: "✈️", text: "Searching return flights GOI → DEL · May 19", result: "IndiGo 6E-2244 · ₹5,299/person · Non-stop" },
  { icon: "✅", text: "Assembling itinerary & running budget check", result: "₹62,896 total · ₹17,104 under budget ✓" },
];

/* ── Itinerary data ─────────────────────────────────────── */
const ITIN = [
  {
    day: "Day 1 · Thu, May 15",
    items: [
      { time: "06:25", icon: "✈️", name: "IndiGo 6E-2241  DEL → GOI", sub: "2h 45m · Non-stop · Economy", price: "₹9,798 for 2", svc: "flights", tag: "Book Flights", tagColor: "bg-[#1a6af4] hover:bg-[#1558d4]" },
      { time: "10:30", icon: "🏨", name: "Taj Fort Aguada Resort & Spa", sub: "5★ · Sinquerim Beach · 4 nights · Breakfast incl.", price: "₹34,000", svc: "hotels", tag: "Book Hotel", tagColor: "bg-[#FF4F17] hover:bg-[#e03d08]" },
      { time: "15:00", icon: "🌅", name: "Sinquerim Beach — golden hour walk", sub: "Views from the Fort · 2h", price: "Free", svc: null, tag: null, tagColor: "" },
      { time: "19:30", icon: "🍽️", name: "Dinner at Gunpowder, Assagao", sub: "Top-rated Kerala cuisine in Goa", price: "~₹2,000", svc: null, tag: null, tagColor: "" },
    ],
  },
  {
    day: "Day 2 · Fri, May 16",
    items: [
      { time: "07:00", icon: "🥾", name: "Dudhsagar Falls full-day trek", sub: "Guided jeep + trek · 2 pax · River rafting included", price: "₹5,600", svc: "experiences", tag: "Book Activity", tagColor: "bg-[#16a34a] hover:bg-[#15803d]" },
      { time: "19:00", icon: "🌿", name: "Return to hotel — evening at leisure", sub: "", price: "—", svc: null, tag: null, tagColor: "" },
    ],
  },
  {
    day: "Day 3 · Sat, May 17",
    items: [
      { time: "09:00", icon: "⛪", name: "Old Goa heritage walk", sub: "Basilica of Bom Jesus + Se Cathedral", price: "₹800", svc: "experiences", tag: "Book Activity", tagColor: "bg-[#16a34a] hover:bg-[#15803d]" },
      { time: "12:30", icon: "🌱", name: "Spice plantation lunch tour", sub: "2.5h · Authentic Goan meal included", price: "₹2,400", svc: "experiences", tag: "Book Activity", tagColor: "bg-[#16a34a] hover:bg-[#15803d]" },
      { time: "16:30", icon: "🛍️", name: "Anjuna Saturday flea market", sub: "Open-air market · Free entry", price: "Free", svc: null, tag: null, tagColor: "" },
    ],
  },
  {
    day: "Day 4 · Sun, May 18",
    items: [
      { time: "08:30", icon: "🐬", name: "Dolphin spotting boat cruise", sub: "2h · Mandovi river · 2 pax", price: "₹3,600", svc: "experiences", tag: "Book Activity", tagColor: "bg-[#16a34a] hover:bg-[#15803d]" },
      { time: "12:00", icon: "🏖️", name: "Baga Beach afternoon + lunch", sub: "Swimming + beach shack", price: "~₹1,400", svc: null, tag: null, tagColor: "" },
      { time: "20:00", icon: "🦞", name: "Dinner at Britto's, Baga", sub: "Iconic Goa seafood by the sea", price: "~₹2,800", svc: null, tag: null, tagColor: "" },
    ],
  },
  {
    day: "Day 5 · Mon, May 19",
    items: [
      { time: "09:30", icon: "🏊", name: "Last morning at Calangute Beach", sub: "Free time · 2h", price: "Free", svc: null, tag: null, tagColor: "" },
      { time: "13:00", icon: "🚖", name: "Hotel checkout + transfer to airport", sub: "Dabolim Airport · ~45 min", price: "~₹800", svc: "buses", tag: "Book Cab", tagColor: "bg-[#d97706] hover:bg-[#b45309]" },
      { time: "19:45", icon: "✈️", name: "IndiGo 6E-2244  GOI → DEL", sub: "2h 45m · Non-stop · Economy", price: "₹10,598 for 2", svc: "flights", tag: "Book Flights", tagColor: "bg-[#1a6af4] hover:bg-[#1558d4]" },
    ],
  },
];

/* ── Map pins in SVG viewBox 0 0 380 220 ────────────────── */
const PINS = [
  { n: 1, x: 215, y: 155, label: "Dabolim Airport" },
  { n: 2, x: 82, y: 74, label: "Fort Aguada · Hotel" },
  { n: 3, x: 155, y: 100, label: "Old Goa" },
  { n: 4, x: 78, y: 48, label: "Anjuna" },
  { n: 5, x: 84, y: 60, label: "Baga" },
  { n: 6, x: 335, y: 120, label: "Dudhsagar Falls" },
];


/* ── Question card (Claude-style, light) ────────────────── */
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
      }
      else if (e.key === "Escape") onSkip();
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
    <div className="bg-white border border-[#e5e7eb] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-[15px] font-semibold text-[#1a1a1a]">{q.question}</span>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#aaa]">{qIdx + 1} of {q.pageOf}</span>
          <button onClick={onSkip} className="text-[#ccc] hover:text-[#888] transition-colors text-lg leading-none">×</button>
        </div>
      </div>

      {/* Options */}
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
                picked ? "bg-[#fff9f7]" : highlighted ? "bg-[#f8f9fb]" : "hover:bg-[#fafbfd]",
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all",
                picked ? "bg-[#FF4F17] text-white" : "bg-[#f0f0f0] text-[#888]",
              )}>
                {q.multi && picked ? "✓" : i + 1}
              </div>
              <span className={cn(
                "flex-1 text-[14px] transition-colors",
                picked ? "text-[#FF4F17] font-medium" : "text-[#333]",
              )}>
                {opt.label}
              </span>
              {opt.arrow && !picked && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </button>
          );
        })}
      </div>

      {/* Text input row */}
      <div className="border-t border-[#f0f0f0] flex items-center gap-2 px-3.5 py-2.5">
        <div className="w-7 h-7 rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </div>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && draft.trim()) submit(); }}
          placeholder={q.placeholder}
          className="flex-1 bg-transparent text-[14px] text-[#1a1a1a] placeholder:text-[#ccc] outline-none"
        />
        {showDone && (
          <button onClick={submit} className="text-[12px] font-semibold text-white bg-[#FF4F17] hover:bg-[#e03d08] px-3.5 py-1.5 rounded-full transition-colors shrink-0">
            Done →
          </button>
        )}
        {showSend && (
          <button onClick={submit} className="w-7 h-7 rounded-full bg-[#FF4F17] flex items-center justify-center shrink-0 hover:bg-[#e03d08] transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        )}
        {!showDone && !showSend && (
          <button onClick={onSkip} className="text-[12px] text-[#ccc] hover:text-[#888] px-2 transition-colors shrink-0">Skip</button>
        )}
      </div>

      {/* Keyboard hint */}
      <div className="bg-[#fafbfd] border-t border-[#f0f0f0] px-5 py-1.5 flex justify-center">
        <span className="text-[10.5px] text-[#ccc]">↑↓ to navigate  ·  Enter to select  ·  Esc to skip</span>
      </div>
    </div>
  );
}

/* ── Goa map (light theme) ──────────────────────────────── */
function GoaMap() {
  const routePts = [...PINS.map(p => `${p.x},${p.y}`), "215,155"].join(" ");
  return (
    <div className="relative w-full bg-[#e8f4ea]" style={{ paddingBottom: "57.9%" }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 380 220" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lterrain" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d4edda"/>
            <stop offset="100%" stopColor="#c3e6cb"/>
          </linearGradient>
          <linearGradient id="lsea" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#90caf9"/>
            <stop offset="100%" stopColor="#bbdefb"/>
          </linearGradient>
          <filter id="lglow">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Terrain */}
        <rect width="380" height="220" fill="url(#lterrain)"/>

        {/* Grid lines (topo style) */}
        {[40,80,120,160,200].map(y => (
          <line key={y} x1="90" y1={y} x2="380" y2={y} stroke="#b8dbbf" strokeWidth="0.5" opacity="0.7"/>
        ))}
        {[130,170,210,250,290,330,370].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="220" stroke="#b8dbbf" strokeWidth="0.5" opacity="0.7"/>
        ))}

        {/* Sea */}
        <polygon points="0,0 96,0 86,30 84,50 80,70 82,90 85,110 88,135 90,155 92,175 93,200 90,220 0,220" fill="url(#lsea)"/>

        {/* Coastline */}
        <path d="M96,0 C92,15 88,28 86,45 C84,58 82,68 80,80 C81,95 84,108 85,122 C87,140 89,155 90,168 C91,183 92,195 90,210 C90,215 89,218 88,220" fill="none" stroke="#5b9bd4" strokeWidth="1.5"/>

        {/* Mandovi river */}
        <path d="M165,100 C185,104 210,108 240,110 C270,112 305,110 330,106" fill="none" stroke="#64b5f6" strokeWidth="1.5" opacity="0.8"/>

        {/* Zuari river */}
        <path d="M150,152 C175,156 200,158 230,157 C255,156 280,152 300,148" fill="none" stroke="#64b5f6" strokeWidth="1.2" opacity="0.6"/>

        {/* Roads */}
        <path d="M200,0 L200,220" fill="none" stroke="#aaa" strokeWidth="1" strokeDasharray="4,5" opacity="0.5"/>
        <path d="M90,110 L380,110" fill="none" stroke="#aaa" strokeWidth="1" strokeDasharray="4,5" opacity="0.5"/>

        {/* Route line */}
        <polyline points={routePts} fill="none" stroke="#FF4F17" strokeWidth="2" strokeDasharray="5,3" opacity="0.9" filter="url(#lglow)"/>

        {/* Pins */}
        {PINS.map(p => (
          <g key={p.n} filter="url(#lglow)">
            <circle cx={p.x} cy={p.y} r="11" fill="white" opacity="0.6"/>
            <circle cx={p.x} cy={p.y} r="8" fill="#FF4F17"/>
            <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">{p.n}</text>
          </g>
        ))}

        {/* Sea label */}
        <text x="42" y="110" textAnchor="middle" fontSize="7.5" fill="#5b9bd4" fontStyle="italic" transform="rotate(-90, 42, 110)">Arabian Sea</text>

        {/* North indicator */}
        <g transform="translate(358,16)">
          <circle r="9" fill="white" stroke="#ddd" strokeWidth="1"/>
          <text x="0" y="3.5" textAnchor="middle" fontSize="8" fill="#888" fontWeight="bold">N</text>
        </g>
      </svg>
      <div className="absolute bottom-1 right-2 text-[8px] text-[#aaa]">Map data © Cleartrip AI</div>
    </div>
  );
}

/* ── Itinerary sidebar ──────────────────────────────────── */
function ItinerarySidebar() {
  const [openDay, setOpenDay] = useState(0);
  const BUDGET = 80_000;
  const spent = 62_896;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white border-l border-[#e5e7eb]">
      {/* Map */}
      <div className="shrink-0 border-b border-[#e5e7eb]">
        <GoaMap />
      </div>

      {/* Trip header */}
      <div className="px-4 py-3 border-b border-[#e5e7eb] shrink-0 bg-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-bold text-[#1a1a1a]">5 Days in Goa</h2>
            <p className="text-[11px] text-[#888] mt-0.5">May 15–19 · 2 adults · ₹80,000 budget</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[16px] font-bold text-[#1a1a1a]">₹62,896</p>
            <p className="text-[10px] text-[#22c55e] font-medium">₹17,104 under budget</p>
          </div>
        </div>

        {/* Budget bar */}
        <div className="mt-2.5 flex h-2 rounded-full overflow-hidden bg-[#f0f0f0]">
          <div className="bg-[#1a6af4]" style={{ width: "25.5%" }}/>
          <div className="bg-[#FF4F17]" style={{ width: "42.5%" }}/>
          <div className="bg-[#14b8a6]" style={{ width: "10.6%" }}/>
          <div className="bg-[#dcfce7] flex-1"/>
        </div>
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {[
            { color: "#1a6af4", label: "Flights", val: "₹20,396" },
            { color: "#FF4F17", label: "Hotel", val: "₹34,000" },
            { color: "#14b8a6", label: "Activities", val: "₹8,500" },
            { color: "#22c55e", label: "Buffer", val: "₹17,104" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}/>
              <span className="text-[9.5px] text-[#888]">{s.label} {s.val}</span>
            </div>
          ))}
        </div>

        {/* Pin legend */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {PINS.map(p => (
            <div key={p.n} className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-[#FF4F17] flex items-center justify-center text-[8px] font-bold text-white shrink-0">{p.n}</div>
              <span className="text-[9px] text-[#999]">{p.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Day accordion */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        {ITIN.map((section, di) => (
          <div key={di} className="border-b border-[#f0f0f0]">
            <button
              onClick={() => setOpenDay(openDay === di ? -1 : di)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fafbfd] transition-colors"
            >
              <span className="text-[12px] font-semibold text-[#555]">{section.day}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={cn("transition-transform duration-200", openDay === di && "rotate-180")}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {openDay === di && (
              <div className="px-4 pb-3 space-y-3 bg-[#fafbfd]">
                {section.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-3">
                    <div className="w-[40px] text-right shrink-0 pt-0.5">
                      <span className="text-[10px] text-[#aaa] font-medium">{item.time}</span>
                    </div>
                    <div className="w-px self-stretch bg-[#e5e7eb] shrink-0"/>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-medium text-[#1a1a1a] leading-snug">
                            <span className="mr-1">{item.icon}</span>{item.name}
                          </p>
                          {item.sub && <p className="text-[10.5px] text-[#888] mt-0.5">{item.sub}</p>}
                          <p className="text-[10.5px] text-[#555] mt-0.5 font-medium">{item.price}</p>
                        </div>
                        {item.tag && (
                          <button className={cn(
                            "shrink-0 text-[9.5px] font-bold text-white px-2.5 py-1 rounded-full whitespace-nowrap transition-colors mt-0.5",
                            item.tagColor,
                          )}>
                            {item.tag}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Book all CTA */}
      <div className="shrink-0 p-4 border-t border-[#e5e7eb] bg-white">
        <button className="w-full bg-[#FF4F17] hover:bg-[#e03d08] text-white font-bold text-[13px] py-3 rounded-xl transition-colors">
          Book everything on Cleartrip  →
        </button>
        <p className="text-center text-[10px] text-[#ccc] mt-2">Tap any item above to book individually</p>
      </div>
    </div>
  );
}

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
              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold transition-all",
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
          <div className="h-full rounded-full bg-[#FF4F17] transition-all duration-700" style={{ width: `${(step / STEPS.length) * 100}%` }}/>
        </div>
      )}
    </div>
  );
}

/* ── Small helpers ──────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#ccc] animate-bounce" style={{ animationDelay: `${i * 120}ms` }}/>
      ))}
    </div>
  );
}

function Spark() {
  return (
    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#FF4F17] to-[#c026d3] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="white">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
      </svg>
    </div>
  );
}

function FeedbackRow() {
  return (
    <div className="flex items-center gap-0.5 mt-2">
      {[
        { title: "Copy", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> },
        { title: "Good", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg> },
        { title: "Bad", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg> },
        { title: "Retry", icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> },
      ].map(btn => (
        <button key={btn.title} title={btn.title} className="w-7 h-7 flex items-center justify-center rounded-md text-[#ccc] hover:text-[#888] hover:bg-[#f5f5f5] transition-colors">
          {btn.icon}
        </button>
      ))}
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

function FreeInput({ onSend, placeholder = "Where do you want to go? Describe your dream trip…" }: { onSend: (v: string) => void; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  function submit() { if (draft.trim()) { onSend(draft.trim()); setDraft(""); } }
  return (
    <div className="flex items-center gap-2 bg-white border border-[#e5e7eb] rounded-2xl px-4 py-3 shadow-sm">
      <input value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") submit(); }}
        placeholder={placeholder} className="flex-1 text-[14px] text-[#1a1a1a] placeholder:text-[#ccc] outline-none bg-transparent"/>
      <button onClick={submit} disabled={!draft.trim()} className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
        draft.trim() ? "bg-[#FF4F17] hover:bg-[#e03d08]" : "bg-[#f0f0f0] cursor-not-allowed",
      )}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={draft.trim() ? "white" : "#ccc"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  );
}

/* ── Suggestion cards ───────────────────────────────────── */
const SUGGESTIONS = [
  { emoji: "🏖️", label: "Plan a Goa trip", sub: "5 days · 2 adults · May 2026" },
  { emoji: "🏔️", label: "Explore Manali this summer", sub: "7 days · family · adventure" },
  { emoji: "🇹🇭", label: "Thailand on a budget", sub: "10 days · couple · ₹1.2L" },
  { emoji: "🏰", label: "Rajasthan heritage circuit", sub: "8 days · solo · culture" },
];

/* ── Main page ──────────────────────────────────────────── */
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

  const showMap = stage === "results";
  const showCard = stage === "q1" || stage === "q2" || stage === "q3" || stage === "q4";

  return (
    <div className="h-screen flex flex-col bg-[#f5f7fa] overflow-hidden">
      <SiteHeader active="ai-planner" />

      {/* Sub-bar */}
      <div className="bg-[#0a1f6e] text-white px-5 py-2.5 shrink-0">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-[12px] text-white/70">
            <span className="text-white font-semibold">AI Trip Planner</span>
            <span>·</span>
            <span>Plan, compare & book an entire trip in one conversation</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-white/50">
            <span>✈️ 500+ airlines</span><span>·</span>
            <span>🏨 1M+ hotels</span><span>·</span>
            <span>🎯 Curated activities</span>
          </div>
        </div>
      </div>

      {/* Main panels */}
      <div className="flex flex-1 min-h-0 max-w-[1400px] mx-auto w-full">

        {/* Left: Chat */}
        <div className={cn("flex flex-col min-h-0 transition-all duration-500", showMap ? "w-[52%]" : "w-full")}>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6" style={{ scrollbarWidth: "thin" }}>

            {/* Welcome / idle */}
            {stage === "idle" && (
              <div className="flex flex-col items-center justify-center min-h-full pb-32 text-center px-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF4F17] to-[#c026d3] flex items-center justify-center mb-5 shadow-lg">
                  <span className="text-[26px]">✨</span>
                </div>
                <h1 className="text-[22px] font-bold text-[#1a1a1a] mb-2">Plan your perfect trip</h1>
                <p className="text-[13px] text-[#888] mb-8 max-w-[340px] leading-relaxed">
                  Describe where you want to go — I'll find flights, hotels, and a full itinerary within your budget.
                </p>
                <div className="w-full max-w-[520px] grid grid-cols-2 gap-2.5">
                  {SUGGESTIONS.map(s => (
                    <button key={s.label} onClick={() => startConversation(s.label)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white border border-[#e5e7eb] hover:border-[#FF4F17] hover:shadow-md text-left transition-all group">
                      <span className="text-[22px] shrink-0">{s.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#1a1a1a] group-hover:text-[#FF4F17] transition-colors">{s.label}</p>
                        <p className="text-[11px] text-[#aaa] mt-0.5">{s.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation */}
            {stage !== "idle" && (
              <div className="max-w-[620px] mx-auto space-y-5">
                {msgs.map(msg => {
                  if (msg.kind === "user-init") return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="bg-[#FF4F17] text-white text-[14px] px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed shadow-sm">
                        {msg.text}
                      </div>
                    </div>
                  );
                  if (msg.kind === "ai") return (
                    <div key={msg.id} className="flex gap-2.5">
                      <Spark />
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] text-[#1a1a1a] leading-relaxed whitespace-pre-line">{msg.text}</p>
                        <FeedbackRow />
                      </div>
                    </div>
                  );
                  if (msg.kind === "summary") return <SummaryBubble key={msg.id} pairs={msg.pairs!} />;
                  if (msg.kind === "planning-done") return (
                    <div key={msg.id} className="flex gap-2.5">
                      <Spark />
                      <div className="flex-1 min-w-0">
                        <PlanningMsg step={STEPS.length} />
                        <FeedbackRow />
                      </div>
                    </div>
                  );
                  return null;
                })}

                {/* Live planning animation */}
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
          <div className="shrink-0 px-4 pb-4 max-w-[620px] mx-auto w-full">
            {stage === "idle" && <FreeInput onSend={startConversation} />}
            {showCard && (
              <QuestionCard q={QS[qIdx]} qIdx={qIdx} selected={selected}
                onPick={handlePick} onSubmit={handleAnswer} onSkip={() => handleAnswer("Skipped")} />
            )}
            {stage === "results" && (
              <ChipInputBar
                placeholder="Ask to change anything — 'swap the hotel', 'add a rest day'…"
                onSend={(txt, tripState) => {
                  const ctx = [
                    tripState.destination && `Destination: ${tripState.destination}`,
                    (tripState.dates.start || tripState.quickPick) && `Dates: ${tripState.quickPick || `${tripState.dates.start} → ${tripState.dates.end}`}`,
                    `Travelers: ${tripState.adults + tripState.children} (${tripState.cabinClass})`,
                    tripState.budgetPreset && `Budget: ${tripState.budgetPreset}`,
                  ].filter(Boolean).join(" · ");
                  const full = ctx ? `${txt}\n[${ctx}]` : txt;
                  addMsg({ kind: "user-init", text: txt });
                  showAI("Got it! I've noted that — updating your plan on the right…");
                  void full;
                }}
              />
            )}
          </div>
        </div>

        {/* Right: Map + Itinerary */}
        {showMap && (
          <div className="flex-1 min-w-0 min-h-0">
            <ItinerarySidebar />
          </div>
        )}
      </div>
    </div>
  );
}
