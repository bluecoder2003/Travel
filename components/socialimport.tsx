"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  X,
  Sparkle,
  ArrowRight,
  ArrowLeft,
  Check,
  InstagramLogo,
  YoutubeLogo,
  TiktokLogo,
  LinkSimple,
  MapPin,
  ForkKnife,
  Mountains,
  Camera,
  Coffee,
  Waves,
  Heart,
  CalendarBlank,
  Wallet,
  Compass,
  Sun,
} from "@phosphor-icons/react";

/* ══════════════════════════════════════════════════════════
   Theme — chat design system: warm orange accent, neutrals
   ══════════════════════════════════════════════════════════ */
const ACCENT = "#FF4F17";        // Cleartrip orange — primary CTA only
const ACCENT_HOVER = "#e03d08";

/* ══════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════ */
export type SocialSource = "instagram" | "youtube" | "tiktok" | "link";

export interface SocialPrefs {
  source: SocialSource;
  handle: string;
  itemCount: number;
  destinations: string[];
  interests: string[];
  vibe: string;
  primaryDestination: string;
  budgetRange: [number, number];
  budgetPreset: string;
  quickPick: string;
  initText: string;
}

interface SocialImportFlowProps {
  open: boolean;
  onClose: () => void;
  onComplete: (prefs: SocialPrefs) => void;
}

/* ══════════════════════════════════════════════════════════
   Mock saved content per source
   ══════════════════════════════════════════════════════════ */
type SavedItem = {
  img: string;
  caption: string;
  tag: string;
  type: "post" | "reel" | "video" | "playlist";
};

type IconCmp = React.ComponentType<{ size?: number; weight?: "regular" | "fill" | "bold"; className?: string }>;

type Experience = { label: string; icon: IconCmp };

const SOURCE_DATA: Record<
  SocialSource,
  {
    handle: string;
    label: string;
    items: SavedItem[];
    extracted: {
      destinations: string[];
      interests: { label: string; icon: IconCmp; weight: number }[];
      vibe: string;
      primary: string;
      quickPick: string;
      duration: string;
      budgetLabel: string;
      budgetSub: string;
      season: string;
      experiences: Experience[];
      initText: string;
    };
  }
> = {
  instagram: {
    handle: "@neo_wanders",
    label: "Instagram",
    items: [
      { img: "/all1.png", caption: "rice fields at golden hour", tag: "Ubud", type: "post" },
      { img: "/all2.png", caption: "hidden waterfall reel", tag: "Tegalalang", type: "reel" },
      { img: "/all3.png", caption: "cliffside cafe", tag: "Canggu", type: "post" },
      { img: "/all4.png", caption: "sunset surf check", tag: "Uluwatu", type: "reel" },
      { img: "/all5.png", caption: "warung lunch", tag: "Bali", type: "post" },
      { img: "/all6.png", caption: "monkey forest walk", tag: "Ubud", type: "reel" },
    ],
    extracted: {
      destinations: ["Bali", "Ubud", "Canggu", "Uluwatu"],
      interests: [
        { label: "Cafés & slow mornings", icon: Coffee, weight: 92 },
        { label: "Surf & beach", icon: Waves, weight: 78 },
        { label: "Ricefields & nature", icon: Mountains, weight: 71 },
        { label: "Photo spots", icon: Camera, weight: 64 },
        { label: "Local food", icon: ForkKnife, weight: 53 },
      ],
      vibe: "Slow, photo-led, sunset chaser",
      primary: "Bali, Indonesia",
      quickPick: "Beach + Culture",
      duration: "8–10 days",
      budgetLabel: "Mid-range",
      budgetSub: "₹60k–₹1.2L pp",
      season: "Apr – Oct (dry season)",
      experiences: [
        { label: "Sunrise at Tegalalang", icon: Sun },
        { label: "Surf lesson, Uluwatu", icon: Waves },
        { label: "Canggu café crawl", icon: Coffee },
        { label: "Ubud rice walk", icon: Mountains },
      ],
      initText:
        "Plan a Bali trip from my saved Instagram — slow cafés, ricefields, surf at sunset.",
    },
  },
  youtube: {
    handle: "Travel watchlist",
    label: "YouTube",
    items: [
      { img: "/all1.png", caption: "Kyoto in 4K", tag: "Kyoto", type: "video" },
      { img: "/all2.png", caption: "Tokyo ramen alleys", tag: "Tokyo", type: "playlist" },
      { img: "/all3.png", caption: "Fuji sunrise hike", tag: "Hakone", type: "video" },
      { img: "/all4.png", caption: "Onsen towns", tag: "Hakone", type: "video" },
      { img: "/all5.png", caption: "Cherry blossoms", tag: "Kyoto", type: "playlist" },
      { img: "/all6.png", caption: "Tokyo cafes", tag: "Tokyo", type: "video" },
    ],
    extracted: {
      destinations: ["Kyoto", "Tokyo", "Hakone"],
      interests: [
        { label: "Temples & history", icon: Mountains, weight: 89 },
        { label: "Ramen & food alleys", icon: ForkKnife, weight: 84 },
        { label: "Slow scenic travel", icon: Camera, weight: 72 },
        { label: "Onsen & wellness", icon: Waves, weight: 60 },
      ],
      vibe: "Cinematic, deep-dive, heritage",
      primary: "Kyoto, Japan",
      quickPick: "Culture + Food",
      duration: "10–12 days",
      budgetLabel: "Mid-range",
      budgetSub: "₹1.4L–₹2.2L pp",
      season: "Mar – May (cherry blossom)",
      experiences: [
        { label: "Fushimi Inari at dawn", icon: Mountains },
        { label: "Tokyo ramen alley", icon: ForkKnife },
        { label: "Hakone onsen night", icon: Waves },
        { label: "Arashiyama bamboo", icon: Camera },
      ],
      initText:
        "Plan a Japan trip from my YouTube watchlist — temples, ramen alleys, onsen stops.",
    },
  },
  tiktok: {
    handle: "Liked travel saves",
    label: "TikTok",
    items: [
      { img: "/all1.png", caption: "santorini viewpoint", tag: "Oia", type: "reel" },
      { img: "/all2.png", caption: "blue domes at sunrise", tag: "Fira", type: "reel" },
      { img: "/all3.png", caption: "tavernas to try", tag: "Santorini", type: "reel" },
      { img: "/all4.png", caption: "donkey lane", tag: "Oia", type: "reel" },
      { img: "/all5.png", caption: "naxos cliff jump", tag: "Naxos", type: "reel" },
      { img: "/all6.png", caption: "homestay tour", tag: "Mykonos", type: "reel" },
    ],
    extracted: {
      destinations: ["Santorini", "Naxos", "Mykonos"],
      interests: [
        { label: "Aesthetic spots", icon: Camera, weight: 91 },
        { label: "Coastal swims", icon: Waves, weight: 82 },
        { label: "Tavernas & wine", icon: ForkKnife, weight: 70 },
        { label: "Hidden viewpoints", icon: Mountains, weight: 63 },
      ],
      vibe: "Aesthetic, golden-hour, viral spots",
      primary: "Santorini, Greece",
      quickPick: "Beach + Culture",
      duration: "7–9 days",
      budgetLabel: "Mid-range",
      budgetSub: "₹1.1L–₹1.8L pp",
      season: "May – Sep (warm seas)",
      experiences: [
        { label: "Oia sunset", icon: Sun },
        { label: "Naxos cliff swim", icon: Waves },
        { label: "Taverna in Fira", icon: ForkKnife },
        { label: "Mykonos walk", icon: Camera },
      ],
      initText:
        "Plan a Greek islands trip from my TikTok saves — aesthetic spots, coastal swims, tavernas.",
    },
  },
  link: {
    handle: "Pasted links",
    label: "Pasted",
    items: [
      { img: "/popular-argentina.png", caption: "patagonia hike", tag: "Patagonia", type: "post" },
      { img: "/scenary.png", caption: "buenos aires steak", tag: "Buenos Aires", type: "video" },
      { img: "/all2.png", caption: "tango nights", tag: "San Telmo", type: "reel" },
      { img: "/popular-bali.png", caption: "iguazu falls", tag: "Iguazu", type: "video" },
    ],
    extracted: {
      destinations: ["Buenos Aires", "Patagonia", "Iguazu"],
      interests: [
        { label: "Big-city food", icon: ForkKnife, weight: 86 },
        { label: "Adventure hikes", icon: Mountains, weight: 79 },
        { label: "Live music", icon: Heart, weight: 64 },
      ],
      vibe: "Bold, contrasts, food-and-feet",
      primary: "Buenos Aires, Argentina",
      quickPick: "Adventure + Food",
      duration: "12–14 days",
      budgetLabel: "Mid-range",
      budgetSub: "₹1.6L–₹2.4L pp",
      season: "Oct – Mar (S. summer)",
      experiences: [
        { label: "Steak in Palermo", icon: ForkKnife },
        { label: "Patagonia trek", icon: Mountains },
        { label: "Tango in San Telmo", icon: Heart },
        { label: "Iguazu falls", icon: Waves },
      ],
      initText:
        "Plan an Argentina trip from these saved posts — steakhouses, tango, then Patagonia hikes.",
    },
  },
};

const STAGE_LABELS = [
  "Reading saves",
  "Recognising places",
  "Extracting interests",
  "Mapping vibe",
  "Drafting plan",
];

/* ══════════════════════════════════════════════════════════
   Component
   ══════════════════════════════════════════════════════════ */
export default function SocialImportFlow({ open, onClose, onComplete }: SocialImportFlowProps) {
  const [step, setStep] = useState<"connect" | "scan" | "review">("connect");
  const [source, setSource] = useState<SocialSource>("instagram");
  const [pastedLink, setPastedLink] = useState("");
  const [stageIdx, setStageIdx] = useState(0);
  const [revealedTagIdx, setRevealedTagIdx] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const tagTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const data = SOURCE_DATA[source];

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep("connect");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStageIdx(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRevealedTagIdx(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScanProgress(0);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPastedLink("");
      if (stageTimer.current) clearInterval(stageTimer.current);
      if (tagTimer.current) clearInterval(tagTimer.current);
      if (progressTimer.current) clearInterval(progressTimer.current);
    }
  }, [open]);

  useEffect(() => {
    if (step !== "scan") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStageIdx(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRevealedTagIdx(0);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setScanProgress(0);

    let s = 0;
    stageTimer.current = setInterval(() => {
      s += 1;
      if (s >= STAGE_LABELS.length) {
        if (stageTimer.current) clearInterval(stageTimer.current);
        return;
      }
      setStageIdx(s);
    }, 900);

    let t = 0;
    tagTimer.current = setInterval(() => {
      t += 1;
      setRevealedTagIdx(t);
      if (t >= data.extracted.interests.length + data.extracted.destinations.length) {
        if (tagTimer.current) clearInterval(tagTimer.current);
      }
    }, 480);

    let p = 0;
    progressTimer.current = setInterval(() => {
      p += 2.4;
      setScanProgress(Math.min(100, p));
      if (p >= 100) {
        if (progressTimer.current) clearInterval(progressTimer.current);
      }
    }, 100);

    const done = setTimeout(() => setStep("review"), 4600);
    return () => {
      clearTimeout(done);
      if (stageTimer.current) clearInterval(stageTimer.current);
      if (tagTimer.current) clearInterval(tagTimer.current);
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [step, data]);

  function handleConnect(s: SocialSource) {
    setSource(s);
    setStep("scan");
  }

  function handleConfirm() {
    onComplete({
      source,
      handle: data.handle,
      itemCount: data.items.length,
      destinations: data.extracted.destinations,
      interests: data.extracted.interests.map(i => i.label),
      vibe: data.extracted.vibe,
      primaryDestination: data.extracted.primary,
      budgetRange: [60000, 120000],
      budgetPreset: "mid",
      quickPick: data.extracted.quickPick,
      initText: data.extracted.initText,
    });
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-[#0a0a0a]/45 backdrop-blur-[6px] flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          key="panel"
          initial={{ opacity: 0, y: 14, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.985 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-[680px] max-h-[92vh] overflow-hidden rounded-[20px] bg-white shadow-[0_30px_80px_-20px_rgba(15,15,20,0.25),0_8px_24px_-8px_rgba(15,15,20,0.08)] flex flex-col border border-ct-border-light"
        >
          {/* Header — minimal, editorial */}
          <div className="flex items-center justify-between px-6 sm:px-7 pt-5 pb-4 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center bg-ct-text">
                <Sparkle size={11} weight="fill" className="text-white" />
              </div>
              <p className="text-[12px] font-semibold text-ct-text tracking-tight">
                Plan from saved content
              </p>
              <StepDots step={step} />
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 -mr-1 rounded-full flex items-center justify-center text-ct-text-muted hover:text-ct-text hover:bg-ct-surface-subtle transition-colors"
            >
              <X size={14} weight="bold" />
            </button>
          </div>

          <div className="h-px bg-ct-border-light shrink-0" />

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {step === "connect" && (
                <ConnectStep
                  key="connect"
                  pastedLink={pastedLink}
                  onPastedChange={setPastedLink}
                  onConnect={handleConnect}
                />
              )}
              {step === "scan" && (
                <ScanStep
                  key="scan"
                  data={data}
                  stageIdx={stageIdx}
                  revealedTagIdx={revealedTagIdx}
                  scanProgress={scanProgress}
                />
              )}
              {step === "review" && (
                <ReviewStep
                  key="review"
                  data={data}
                  onBack={() => setStep("connect")}
                  onConfirm={handleConfirm}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Step indicator dots ───────────────────────────────────── */
function StepDots({ step }: { step: "connect" | "scan" | "review" }) {
  const order = ["connect", "scan", "review"] as const;
  const idx = order.indexOf(step);
  return (
    <div className="hidden sm:flex items-center gap-1 ml-2">
      {order.map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-1 rounded-full transition-all duration-300",
            i === idx ? "w-5 bg-ct-text" : i < idx ? "w-1.5 bg-ct-text" : "w-1.5 bg-ct-border",
          )}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Step 1 — Connect
   ══════════════════════════════════════════════════════════ */
function ConnectStep({
  pastedLink,
  onPastedChange,
  onConnect,
}: {
  pastedLink: string;
  onPastedChange: (v: string) => void;
  onConnect: (s: SocialSource) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="px-6 sm:px-7 pt-7 pb-7"
    >
      <h2 className="text-[24px] font-semibold text-ct-text leading-[1.1] tracking-[-0.01em]">
        Bring in what you&apos;ve been
        <br />
        <span className="italic font-medium text-ct-text-secondary">saving for someday.</span>
      </h2>
      {/* <p className="text-[12.5px] text-ct-text-secondary mt-3 leading-relaxed max-w-[440px]">
        We&apos;ll read the captions, places and feel of your bookmarks — and stitch a draft trip from them in seconds.
      </p> */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-7">
        <SourceCard
          label="Instagram"
          sub="Saved · Reels"
          accent="#E4405F"
          icon={InstagramLogo}
          onClick={() => onConnect("instagram")}
        />
        <SourceCard
          label="YouTube"
          sub="Watch later"
          accent="#FF0000"
          icon={YoutubeLogo}
          onClick={() => onConnect("youtube")}
        />
        <SourceCard
          label="TikTok"
          sub="Liked saves"
          accent="#000000"
          icon={TiktokLogo}
          onClick={() => onConnect("tiktok")}
        />
      </div>

      <div className="mt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1 h-px bg-ct-border-light" />
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-ct-text-muted">
            or paste any link
          </p>
          <div className="flex-1 h-px bg-ct-border-light" />
        </div>
        <div className="flex items-center gap-2 bg-ct-surface-subtle rounded-xl border border-transparent px-3.5 py-2.5 focus-within:border-ct-border-medium focus-within:bg-white transition-colors">
          <LinkSimple size={14} className="text-ct-text-muted shrink-0" weight="bold" />
          <input
            value={pastedLink}
            onChange={e => onPastedChange(e.target.value)}
            placeholder="instagram.com/p/…   ·   youtu.be/…   ·   tiktok.com/@…"
            className="flex-1 bg-transparent outline-none text-[12.5px] text-ct-text placeholder:text-ct-text-placeholder"
          />
          <button
            onClick={() => onConnect("link")}
            className="text-[11.5px] font-semibold text-white bg-ct-action hover:bg-ct-action-hover px-3.5 py-1.5 rounded-lg transition-colors"
          >
            Read link
          </button>
        </div>
      </div>

      {/* <p className="text-[10.5px] text-ct-text-muted mt-5 leading-relaxed">
        Private to you. We never post, follow, or share — only read what you&apos;ve saved.
      </p> */}
    </motion.div>
  );
}

function SourceCard({
  label,
  sub,
  accent,
  icon: Icon,
  onClick,
}: {
  label: string;
  sub: string;
  accent: string;
  icon: IconCmp;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl border border-ct-border-light bg-white hover:border-ct-border-medium hover:shadow-[0_4px_14px_rgba(15,15,20,0.06)] transition-all text-left p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: `${accent}10`, color: accent }}
        >
          <Icon size={18} weight="fill" />
        </div>
        <ArrowRight
          size={13}
          weight="bold"
          className="text-ct-text-subtle group-hover:text-ct-text group-hover:translate-x-0.5 transition-all"
        />
      </div>
      <p className="text-[13.5px] font-semibold text-ct-text leading-tight">{label}</p>
      <p className="text-[11px] text-ct-text-muted mt-0.5 font-medium">{sub}</p>
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   Step 2 — Scan
   ══════════════════════════════════════════════════════════ */
function ScanStep({
  data,
  stageIdx,
  revealedTagIdx,
  scanProgress,
}: {
  data: typeof SOURCE_DATA[SocialSource];
  stageIdx: number;
  revealedTagIdx: number;
  scanProgress: number;
}) {
  const allTags = [
    ...data.extracted.destinations.map(d => ({ kind: "place" as const, label: d })),
    ...data.extracted.interests.map(i => ({ kind: "interest" as const, label: i.label })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="px-6 sm:px-7 pt-6 pb-7"
    >
      {/* Status */}
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex w-1.5 h-1.5 shrink-0">
            <span
              className="absolute inset-0 rounded-full animate-ping opacity-70"
              style={{ background: ACCENT }}
            />
            <span className="relative w-1.5 h-1.5 rounded-full" style={{ background: ACCENT }} />
          </span>
          <motion.p
            key={stageIdx}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[12.5px] font-medium text-ct-text truncate tracking-tight"
          >
            {STAGE_LABELS[Math.min(stageIdx, STAGE_LABELS.length - 1)]}
            <span className="text-ct-text-muted">…</span>
          </motion.p>
        </div>
        <span className="text-[10.5px] font-mono tabular-nums text-ct-text-muted shrink-0">
          {String(Math.round(scanProgress)).padStart(2, "0")}%
        </span>
      </div>
      <div className="h-[2px] rounded-full bg-ct-border-light overflow-hidden">
        <div
          className="h-full transition-[width] duration-100 ease-linear"
          style={{ width: `${scanProgress}%`, background: ACCENT }}
        />
      </div>

      {/* Two-column scan */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-3">
        {/* Posts grid */}
        <div className="relative rounded-xl overflow-hidden border border-ct-border-light bg-ct-surface-subtle p-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            {data.items.map((item, i) => (
              <ScanThumb key={i} item={item} index={i} />
            ))}
          </div>
          {/* Sweeping scan line */}
          <motion.div
            aria-hidden
            initial={{ y: "-8%" }}
            animate={{ y: "108%" }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            className="absolute inset-x-1.5 h-px pointer-events-none"
            style={{ background: ACCENT, boxShadow: `0 0 14px ${ACCENT}` }}
          />
        </div>

        {/* Extracted side */}
        <div className="rounded-xl border border-ct-border-light bg-white p-4 flex flex-col">
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkle size={10} weight="fill" style={{ color: ACCENT }} />
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-ct-text-muted">
              Identified
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <AnimatePresence>
              {allTags.slice(0, revealedTagIdx).map((t, i) => (
                <motion.span
                  key={`${t.label}-${i}`}
                  initial={{ opacity: 0, y: 6, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22 }}
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full border",
                    t.kind === "place"
                      ? "bg-ct-text text-white border-ct-text"
                      : "bg-ct-surface-subtle text-ct-text border-ct-border-light",
                  )}
                >
                  {t.kind === "place" && <MapPin size={10} weight="fill" />}
                  {t.label}
                </motion.span>
              ))}
              {revealedTagIdx < allTags.length && (
                <motion.span
                  key="dots"
                  className="inline-flex items-center gap-0.5 px-1 py-1.5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Dot delay={0} />
                  <Dot delay={0.15} />
                  <Dot delay={0.3} />
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {stageIdx >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-auto pt-4 border-t border-ct-border-light"
              >
                <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-ct-text-muted mb-1.5">
                  Vibe
                </p>
                <p className="text-[12.5px] text-ct-text leading-snug font-medium">
                  {data.extracted.vibe}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function ScanThumb({ item, index }: { item: SavedItem; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="relative aspect-square rounded-md overflow-hidden bg-ct-surface-deep"
    >
      <Image src={item.img} alt="" fill className="object-cover" sizes="120px" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <div className="absolute bottom-1 left-1 right-1 flex items-center gap-0.5 text-[8.5px] font-semibold text-white truncate">
        <MapPin size={8} weight="fill" />
        <span className="truncate">{item.tag}</span>
      </div>
      <motion.div
        aria-hidden
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{
          duration: 1.4,
          repeat: Infinity,
          delay: index * 0.18,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-md pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1.5px ${ACCENT}` }}
      />
    </motion.div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <motion.span
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.1, repeat: Infinity, delay }}
      className="inline-block w-1 h-1 rounded-full bg-ct-text-muted"
    />
  );
}

/* ══════════════════════════════════════════════════════════
   Step 3 — Review (premium "extracted insights" view)
   ══════════════════════════════════════════════════════════ */
function ReviewStep({
  data,
  onBack,
  onConfirm,
}: {
  data: typeof SOURCE_DATA[SocialSource];
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="flex flex-col">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="px-6 sm:px-7 pt-6 pb-5"
      >
        {/* Hero — primary destination + collage */}
        <div className="grid grid-cols-[1fr_auto] gap-5 items-start">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.12em] uppercase mb-2.5 text-ct-text-muted">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: ACCENT }}
              />
              {data.items.length} saves analysed
            </div>
            <h2 className="text-[26px] font-semibold text-ct-text leading-[1.08] tracking-[-0.015em]">
              {data.extracted.primary}
            </h2>
            <p className="text-[12.5px] text-ct-text-secondary mt-2 leading-relaxed italic">
              &ldquo;{data.extracted.vibe}&rdquo;
            </p>
          </div>

          {/* Polaroid stack */}
          <div className="relative w-[140px] h-[112px] hidden sm:block shrink-0">
            <div className="absolute top-3 left-0 w-[74px] h-[92px] bg-white rounded-md p-1 shadow-[0_4px_14px_rgba(15,15,20,0.10)] -rotate-[7deg] border border-ct-border-light">
              <div className="relative w-full h-full rounded-sm overflow-hidden bg-ct-surface-deep">
                <Image src={data.items[0].img} alt="" fill className="object-cover" sizes="80px" />
              </div>
            </div>
            <div className="absolute top-0 right-0 w-[74px] h-[92px] bg-white rounded-md p-1 shadow-[0_4px_14px_rgba(15,15,20,0.10)] rotate-[6deg] border border-ct-border-light">
              <div className="relative w-full h-full rounded-sm overflow-hidden bg-ct-surface-deep">
                <Image src={data.items[1].img} alt="" fill className="object-cover" sizes="80px" />
              </div>
            </div>
          </div>
        </div>

        {/* Inline meta row — destinations as chips */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {data.extracted.destinations.map((d, i) => (
            <motion.span
              key={d}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium px-2.5 py-1 rounded-full bg-ct-text text-white"
            >
              <MapPin size={10} weight="fill" />
              {d}
            </motion.span>
          ))}
        </div>

        {/* Insights — 3-up grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <InsightCard
            icon={CalendarBlank}
            label="Suggested duration"
            value={data.extracted.duration}
          />
          <InsightCard
            icon={Wallet}
            label={data.extracted.budgetLabel}
            value={data.extracted.budgetSub}
          />
          <InsightCard
            icon={Sun}
            label="Best window"
            value={data.extracted.season}
          />
        </div>

        {/* Top interests — weighted bars */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-ct-text-muted">
              Top interests
            </p>
            <p className="text-[10px] font-medium text-ct-text-subtle">
              from {data.items.length} saves
            </p>
          </div>
          <div className="rounded-xl border border-ct-border-light overflow-hidden">
            {data.extracted.interests.slice(0, 4).map((i, idx) => {
              const Icon = i.icon;
              return (
                <motion.div
                  key={i.label}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 bg-white",
                    idx > 0 && "border-t border-ct-border-light",
                  )}
                >
                  <div className="w-7 h-7 rounded-md bg-ct-surface-subtle flex items-center justify-center shrink-0 text-ct-text">
                    <Icon size={13} weight="fill" />
                  </div>
                  <p className="flex-1 text-[12.5px] font-medium text-ct-text truncate">
                    {i.label}
                  </p>
                  <div className="hidden sm:flex items-center gap-2 shrink-0">
                    <div className="w-24 h-[3px] rounded-full bg-ct-border-light overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${i.weight}%` }}
                        transition={{ duration: 0.7, delay: 0.15 + idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{ background: ACCENT }}
                      />
                    </div>
                    <span className="text-[10px] font-mono tabular-nums text-ct-text-muted w-7 text-right">
                      {i.weight}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Top experiences */}
        <div className="mt-5">
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-ct-text-muted mb-2.5">
            Experiences pulled in
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {data.extracted.experiences.slice(0, 4).map((exp, idx) => {
              const Icon = exp.icon;
              return (
                <motion.div
                  key={exp.label}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.04 }}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-ct-surface-subtle"
                >
                  <Icon size={12} weight="fill" className="text-ct-text-secondary shrink-0" />
                  <p className="text-[11.5px] font-medium text-ct-text truncate">
                    {exp.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 mt-auto border-t border-ct-border-light bg-white/95 backdrop-blur px-6 sm:px-7 py-3.5 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ct-text-secondary hover:text-ct-text transition-colors"
        >
          <ArrowLeft size={11} weight="bold" />
          Change source
        </button>
        <button
          onClick={onConfirm}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-full transition-colors"
          style={{ background: ACCENT }}
          onMouseEnter={e => (e.currentTarget.style.background = ACCENT_HOVER)}
          onMouseLeave={e => (e.currentTarget.style.background = ACCENT)}
        >
          <Compass size={12} weight="fill" />
          Plan this trip
          <ArrowRight size={12} weight="bold" />
        </button>
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  label,
  value,
}: {
  icon: IconCmp;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-ct-border-light bg-white px-3 py-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={11} weight="fill" className="text-ct-text-muted" />
        <p className="text-[9.5px] font-semibold tracking-[0.1em] uppercase text-ct-text-muted">
          {label}
        </p>
      </div>
      <p className="text-[12.5px] font-semibold text-ct-text leading-tight tracking-tight">
        {value}
      </p>
    </div>
  );
}
