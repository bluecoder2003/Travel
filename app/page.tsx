"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AppSidebar } from "@/components/appsidebar";
import ChipInputBar from "@/components/chipinputbar";
import { FlightsBlock, MultiStayBlock, ActivitiesCustomizer } from "@/components/tripblocks";
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
  ClockCounterClockwise,
  ArrowUUpLeft,
  FloppyDisk,
} from "@phosphor-icons/react";

const TripMap = dynamic(() => import("@/components/tripmap"), { ssr: false, loading: () => <div className="w-full h-full bg-[#f5f5f0] animate-pulse" /> });

/* ── Types ─────────────────────────────────────────────── */
type Stage = "idle" | "q1" | "q2" | "q3" | "planning" | "results";
type BookingSegment = "flight-out" | "hotel" | "flight-return";
interface BookingItem { id: BookingSegment; label: string; detail: string; price: string; status: "confirmed" | "at-risk" | "unavailable" }
interface TravellerVote { travellerA: string; travellerB: string; options: string[]; voteA: string | null; voteB: string | null }
interface QOption { label: string; arrow?: boolean }
interface QDef { id: string; question: string; options: QOption[]; multi?: boolean; placeholder: string; pageOf: number }
interface SummaryPair { q: string; a: string }
type SwapKind = "stay" | "activity";
type CardSet = "savings" | "cafes" | "adventure" | "pace";
interface Version {
  id: string;
  n: number;
  label: string;          // e.g. "Initial plan", "Hotel swap"
  ts: number;             // Date.now()
  destination: string;
  daysCount: number;
  stopsCount: number;
  budget: string;
  changes: string[];      // delta chips ("+ Alaya Resort", "− Catamaran cruise")
  snapshot: { days: DayPlan[]; chipCtx: ChipCtx | null };
}
interface ChipDiff { label: string; from: string; to: string }
interface Msg {
  id: string;
  kind: "user-init" | "ai" | "summary" | "planning" | "planning-done" | "breakdown" | "swap" | "cards" | "save-trip" | "flights" | "multi-stay" | "version-saved" | "regen-preview";
  text?: string;
  pairs?: SummaryPair[];
  swapKind?: SwapKind;
  cardSet?: CardSet;
  chipDiffs?: ChipDiff[];
}
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

const PACE_Q: QDef = {
  id: "pace", pageOf: 3,
  question: "How do you like to travel?",
  options: [
    { label: "Packed itinerary — see everything" },
    { label: "Relaxed pace — slow travel" },
    { label: "Mix of busy & chill days" },
    { label: "Spontaneous — minimal planning" },
  ],
  placeholder: "Something else…",
};

const AI_ACKS = [
  "I love it! A few quick questions to personalise your trip:",
  "Great choice! And one more —",
  "Almost there! Last question —",
];

const STEPS = [
  {
    Icon: AirplaneTilt,
    label: "Searching flights",
    text: "Searching 847 flights DEL → GOI · May 15",
    result: "IndiGo 6E-2241 · ₹4,899/person · Non-stop",
    countTarget: 847,
    countSuffix: "flights DEL → GOI · May 15",
    subs: ["Filtering by date · May 15", "Sorting by price & stops", "Locking best non-stop route"],
  },
  {
    Icon: Buildings,
    label: "Checking hotels",
    text: "Checking 340+ hotels in North Goa · 4 nights",
    result: "Taj Fort Aguada · 5★ · ₹8,500/night",
    countTarget: 340,
    countSuffix: "hotels in North Goa · 4 nights",
    subs: ["Scanning North Goa properties", "Filtering 4-night availability", "Ranking by value & rating"],
  },
  {
    Icon: Compass,
    label: "Curating activities",
    text: "Curating activities: beach + culture vibes",
    result: "14 hand-picked experiences across 5 days",
    countTarget: 14,
    countSuffix: "activities matched",
    subs: ["Matching beach + culture tags", "Checking reviews & ratings", "Sequencing by day"],
  },
  {
    Icon: AirplaneTilt,
    label: "Searching return flights",
    text: "Searching return flights GOI → DEL · May 19",
    result: "IndiGo 6E-2244 · ₹5,299/person · Non-stop",
    countTarget: 612,
    countSuffix: "flights GOI → DEL · May 19",
    subs: ["Filtering by date · May 19", "Sorting by price & stops", "Confirming connection times"],
  },
  {
    Icon: CurrencyInr,
    label: "Running budget check",
    text: "Assembling itinerary & running budget check",
    result: "₹62,896 total · ₹17,104 under budget",
    countTarget: 62896,
    countSuffix: "total cost calculated",
    subs: ["Summing flight + hotel costs", "Applying loyalty discounts", "Checking against ₹80k budget"],
  },
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
  { city: "Bali, Indonesia", img: "/popular-bali.png" },
  { city: "Santorini, Greece", img: "/popular-greece.png" },
  { city: "Kyoto, Japan", img: "/popular-japan.png" },
  { city: "Patagonia, Argentina", img: "/popular-argentina.png" },
];

type InspirationItem = {
  type: "BLOG" | "VIDEO" | "ITINERARY";
  source: string;
  title: string;
  sub: string;
  img: string;
  tags: string[];
  href: string;
  location: string;
  creator: string;
  creatorAvatar: string;
  placeCount: number;
};

const INSPIRATION: InspirationItem[] = [
  {
    type: "BLOG",
    source: "Lonely Planet",
    title: "3 Perfect Days in Bali",
    sub: "An itinerary for first-time visitors navigating temples, rice terraces and surf.",
    img: "/all1.png",
    tags: ["#bali", "#indonesia", "#firsttrip"],
    href: "https://www.lonelyplanet.com/articles/best-things-to-do-in-bali",
    location: "Bali, Indonesia",
    creator: "Lonely Planet",
    creatorAvatar: "/all4.png",
    placeCount: 7,
  },
  {
    type: "VIDEO",
    source: "Mark Wiens · YouTube",
    title: "Ultimate Bangkok Street Food Tour",
    sub: "Eat your way through 12 legendary stalls in one day.",
    img: "/all2.png",
    tags: ["#bangkok", "#foodie", "#streetfood"],
    href: "https://www.youtube.com/watch?v=3S7bRzdxULg",
    location: "Bangkok, Thailand",
    creator: "Mark Wiens",
    creatorAvatar: "/all5.png",
    placeCount: 12,
  },
  {
    type: "ITINERARY",
    source: "TripAdvisor",
    title: "10 Days Across the Amalfi Coast",
    sub: "Cliff towns, hidden coves and the best limoncello stops on the drive.",
    img: "/all3.png",
    tags: ["#italy", "#amalfi", "#roadtrip"],
    href: "https://www.tripadvisor.com/Tourism-g187779-Amalfi_Province_of_Salerno_Campania-Vacations.html",
    location: "Amalfi Coast, Italy",
    creator: "TripAdvisor",
    creatorAvatar: "/all6.png",
    placeCount: 9,
  },
  {
    type: "BLOG",
    source: "Condé Nast Traveler",
    title: "Europe's Most Scenic Train Journeys",
    sub: "From the Glacier Express to the West Highland Line — windows worth booking a seat for.",
    img: "/all4.png",
    tags: ["#europe", "#train", "#scenic"],
    href: "https://www.cntraveler.com/gallery/most-scenic-train-rides-in-europe",
    location: "Europe",
    creator: "Condé Nast",
    creatorAvatar: "/all1.png",
    placeCount: 5,
  },
  {
    type: "VIDEO",
    source: "Lost LeBlancs · YouTube",
    title: "Hidden Gems of Patagonia",
    sub: "Torres del Paine trails and campsites that most tourists never find.",
    img: "/all5.png",
    tags: ["#patagonia", "#hiking", "#offbeat"],
    href: "https://www.youtube.com/watch?v=Dm4MkTqn_9M",
    location: "Patagonia, Chile",
    creator: "Lost LeBlancs",
    creatorAvatar: "/all2.png",
    placeCount: 6,
  },
  {
    type: "ITINERARY",
    source: "Travel + Leisure",
    title: "Best Ryokans in Japan",
    sub: "Six traditional inns with kaiseki dinners, onsen baths and impeccable service.",
    img: "/all6.png",
    tags: ["#japan", "#ryokan", "#luxury"],
    href: "https://www.travelandleisure.com/hotels/best-ryokans-japan",
    location: "Japan",
    creator: "Travel + Leisure",
    creatorAvatar: "/all3.png",
    placeCount: 6,
  },
];

const COMMUNITY = [
  {
    user: "Anika S.",
    avatar: "/all1.png",
    title: "A hidden beach in Nusa Penida",
    img: "/scenary.png",
  },
  {
    user: "Rahul K.",
    avatar: "/all3.png",
    title: "Best sunset spot in Uluwatu",
    img: "/community1.png",
  },
  {
    user: "Priya M.",
    avatar: "/all5.png",
    title: "Solo trip through Vietnam",
    img: "/community2.png",
  },
];

/* ── Itinerary data ──────────────────────────────────────── */
type ActivityType = "hotel" | "beach" | "food" | "nature" | "shopping" | "culture" | "dance" | "trek" | "flight" | "sunset" | "spa" | "walk";
interface DayActivity { time: string; name: string; type: ActivityType; lat?: number; lng?: number; img?: string; blurb?: string; mentionedBy?: number }
interface PlaceReview { author: string; avatar: string; rating: number; text: string; date: string }
interface PlaceGuide { title: string; author: string; img: string; readTime: string }
interface PlaceStay { name: string; sub: string; rating: number; price: string; img: string }
interface PlaceRestaurant { name: string; cuisine: string; rating: number; price: string; img: string }
interface PlaceThing { name: string; sub: string; mentions: number; img: string }
interface PlaceDetail {
  description: string; weather: string; temp: string;
  highlights: string[];
  reviews: PlaceReview[];
  region?: string;
  mentionedBy?: number;
  recommenderAvatars?: string[];
  gallery?: string[];
  guides?: PlaceGuide[];
  stays?: PlaceStay[];
  restaurants?: PlaceRestaurant[];
  thingsToDo?: PlaceThing[];
}
interface DayPlan {
  day: number; location: string; lat: number; lng: number;
  img: string; tag: string;
  activities: DayActivity[];
  alternatives: string[][];
  detail: PlaceDetail;
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

/* Per-location catalog data (shared across day plans) */
const PLACE_CATALOG: Record<string, {
  region: string;
  mentionedBy: number;
  recommenderAvatars: string[];
  gallery: string[];
  guides: PlaceGuide[];
  stays: PlaceStay[];
  restaurants: PlaceRestaurant[];
  thingsToDo: PlaceThing[];
}> = {
  Seminyak: {
    region: "South Bali, Indonesia",
    mentionedBy: 312,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=47","https://i.pravatar.cc/40?img=12","https://i.pravatar.cc/40?img=32","https://i.pravatar.cc/40?img=5"],
    gallery: ["https://picsum.photos/seed/sem-1/600/400","https://picsum.photos/seed/sem-2/600/400","https://picsum.photos/seed/sem-3/600/400","https://picsum.photos/seed/sem-4/600/400","https://picsum.photos/seed/sem-5/600/400"],
    guides: [
      { title: "Where to find Seminyak's best sunsets", author: "Lonely Planet", img: "https://picsum.photos/seed/g-sem-1/300/200", readTime: "6 min" },
      { title: "A first-timer's guide to Seminyak nightlife", author: "Condé Nast", img: "https://picsum.photos/seed/g-sem-2/300/200", readTime: "8 min" },
      { title: "Boutique shopping on Jalan Kayu Aya", author: "T+L", img: "https://picsum.photos/seed/g-sem-3/300/200", readTime: "5 min" },
    ],
    stays: [
      { name: "The Legian Bali", sub: "Beachfront · 5★", rating: 4.8, price: "₹14,200/nt", img: "https://picsum.photos/seed/s-sem-1/300/220" },
      { name: "Katamama Suites", sub: "Boutique · 5★", rating: 4.9, price: "₹12,400/nt", img: "https://picsum.photos/seed/s-sem-2/300/220" },
      { name: "W Bali Seminyak", sub: "Design · 5★", rating: 4.7, price: "₹11,200/nt", img: "https://picsum.photos/seed/s-sem-3/300/220" },
    ],
    restaurants: [
      { name: "Sardine", cuisine: "Seafood · Modern Indonesian", rating: 4.8, price: "₹₹₹", img: "https://picsum.photos/seed/r-sem-1/300/220" },
      { name: "Merah Putih", cuisine: "Heritage Indonesian", rating: 4.7, price: "₹₹₹", img: "https://picsum.photos/seed/r-sem-2/300/220" },
      { name: "La Lucciola", cuisine: "Italian · Beachfront", rating: 4.6, price: "₹₹", img: "https://picsum.photos/seed/r-sem-3/300/220" },
    ],
    thingsToDo: [
      { name: "Seminyak Beach sunset walk", sub: "Free · 90 min", mentions: 184, img: "https://picsum.photos/seed/t-sem-1/300/220" },
      { name: "Petitenget Temple visit", sub: "Free · 30 min", mentions: 92, img: "https://picsum.photos/seed/t-sem-2/300/220" },
      { name: "Surfing lesson at Echo Beach", sub: "₹1,800 · 2h", mentions: 76, img: "https://picsum.photos/seed/t-sem-3/300/220" },
    ],
  },
  Ubud: {
    region: "Central Bali, Indonesia",
    mentionedBy: 428,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=70","https://i.pravatar.cc/40?img=23","https://i.pravatar.cc/40?img=44","https://i.pravatar.cc/40?img=8"],
    gallery: ["https://picsum.photos/seed/ub-1/600/400","https://picsum.photos/seed/ub-2/600/400","https://picsum.photos/seed/ub-3/600/400","https://picsum.photos/seed/ub-4/600/400","https://picsum.photos/seed/ub-5/600/400"],
    guides: [
      { title: "The complete Ubud rice terrace itinerary", author: "Lonely Planet", img: "https://picsum.photos/seed/g-ub-1/300/200", readTime: "9 min" },
      { title: "Best art galleries and craft markets in Ubud", author: "Travel + Leisure", img: "https://picsum.photos/seed/g-ub-2/300/200", readTime: "6 min" },
      { title: "A vegan food crawl through central Ubud", author: "Eater", img: "https://picsum.photos/seed/g-ub-3/300/200", readTime: "7 min" },
    ],
    stays: [
      { name: "Alaya Resort Ubud", sub: "Pool villa · 4★", rating: 4.7, price: "₹6,200/nt", img: "https://picsum.photos/seed/s-ub-1/300/220" },
      { name: "COMO Uma Ubud", sub: "Wellness · 5★", rating: 4.8, price: "₹13,400/nt", img: "https://picsum.photos/seed/s-ub-2/300/220" },
      { name: "Mandapa, A Ritz-Carlton Reserve", sub: "Riverside · 5★", rating: 4.9, price: "₹26,000/nt", img: "https://picsum.photos/seed/s-ub-3/300/220" },
    ],
    restaurants: [
      { name: "Locavore", cuisine: "Tasting menu · Modern", rating: 4.9, price: "₹₹₹₹", img: "https://picsum.photos/seed/r-ub-1/300/220" },
      { name: "Hujan Locale", cuisine: "Indonesian heritage", rating: 4.7, price: "₹₹", img: "https://picsum.photos/seed/r-ub-2/300/220" },
      { name: "Yellow Flower Café", cuisine: "Vegan brunch", rating: 4.8, price: "₹", img: "https://picsum.photos/seed/r-ub-3/300/220" },
    ],
    thingsToDo: [
      { name: "Tegallalang rice terrace walk", sub: "₹600 · 2h", mentions: 287, img: "https://picsum.photos/seed/t-ub-1/300/220" },
      { name: "Sacred Monkey Forest", sub: "₹500 · 1.5h", mentions: 198, img: "https://picsum.photos/seed/t-ub-2/300/220" },
      { name: "Kecak fire dance · Ubud Palace", sub: "₹600 · 1h", mentions: 156, img: "https://picsum.photos/seed/t-ub-3/300/220" },
    ],
  },
  Kintamani: {
    region: "Bangli Regency, Bali",
    mentionedBy: 198,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=15","https://i.pravatar.cc/40?img=44","https://i.pravatar.cc/40?img=8","https://i.pravatar.cc/40?img=29"],
    gallery: ["https://picsum.photos/seed/kt-1/600/400","https://picsum.photos/seed/kt-2/600/400","https://picsum.photos/seed/kt-3/600/400","https://picsum.photos/seed/kt-4/600/400"],
    guides: [
      { title: "Mount Batur sunrise trek — what to know", author: "Outside", img: "https://picsum.photos/seed/g-kt-1/300/200", readTime: "8 min" },
      { title: "Caldera-rim cafés worth the drive", author: "Eater", img: "https://picsum.photos/seed/g-kt-2/300/200", readTime: "5 min" },
    ],
    stays: [
      { name: "Bali Sunrise Camp", sub: "Tents · base camp", rating: 4.6, price: "₹2,800/nt", img: "https://picsum.photos/seed/s-kt-1/300/220" },
      { name: "Lakeview Hotel & Restaurant", sub: "Caldera-rim · 3★", rating: 4.4, price: "₹3,400/nt", img: "https://picsum.photos/seed/s-kt-2/300/220" },
    ],
    restaurants: [
      { name: "Kintamani Ulun Danu Café", cuisine: "Buffet · lake view", rating: 4.5, price: "₹₹", img: "https://picsum.photos/seed/r-kt-1/300/220" },
      { name: "Montana del Café", cuisine: "Coffee · highland views", rating: 4.7, price: "₹", img: "https://picsum.photos/seed/r-kt-2/300/220" },
    ],
    thingsToDo: [
      { name: "Mount Batur sunrise trek", sub: "₹3,200 · 4h", mentions: 187, img: "https://picsum.photos/seed/t-kt-1/300/220" },
      { name: "Banjar hot springs", sub: "₹500 · 90 min", mentions: 88, img: "https://picsum.photos/seed/t-kt-2/300/220" },
      { name: "Caldera-rim swing", sub: "₹1,200 · 30 min", mentions: 64, img: "https://picsum.photos/seed/t-kt-3/300/220" },
    ],
  },
  Uluwatu: {
    region: "Bukit Peninsula, Bali",
    mentionedBy: 264,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=29","https://i.pravatar.cc/40?img=60","https://i.pravatar.cc/40?img=36","https://i.pravatar.cc/40?img=18"],
    gallery: ["https://picsum.photos/seed/ul-1/600/400","https://picsum.photos/seed/ul-2/600/400","https://picsum.photos/seed/ul-3/600/400","https://picsum.photos/seed/ul-4/600/400","https://picsum.photos/seed/ul-5/600/400"],
    guides: [
      { title: "Uluwatu cliff temples and sunset rituals", author: "Lonely Planet", img: "https://picsum.photos/seed/g-ul-1/300/200", readTime: "7 min" },
      { title: "Surfer's guide to the Bukit", author: "Stab Mag", img: "https://picsum.photos/seed/g-ul-2/300/200", readTime: "10 min" },
      { title: "Where to eat seafood in Jimbaran", author: "Eater", img: "https://picsum.photos/seed/g-ul-3/300/200", readTime: "6 min" },
    ],
    stays: [
      { name: "Bulgari Resort Bali", sub: "Cliff villa · 5★", rating: 4.9, price: "₹48,000/nt", img: "https://picsum.photos/seed/s-ul-1/300/220" },
      { name: "Six Senses Uluwatu", sub: "Ocean view · 5★", rating: 4.8, price: "₹32,000/nt", img: "https://picsum.photos/seed/s-ul-2/300/220" },
      { name: "Anantara Uluwatu", sub: "Cliffside suites · 5★", rating: 4.7, price: "₹18,400/nt", img: "https://picsum.photos/seed/s-ul-3/300/220" },
    ],
    restaurants: [
      { name: "Single Fin", cuisine: "Cliff bar · global", rating: 4.7, price: "₹₹", img: "https://picsum.photos/seed/r-ul-1/300/220" },
      { name: "Menega Café Jimbaran", cuisine: "Beachside seafood BBQ", rating: 4.5, price: "₹₹", img: "https://picsum.photos/seed/r-ul-2/300/220" },
      { name: "Suka Espresso", cuisine: "Australian-style brunch", rating: 4.8, price: "₹", img: "https://picsum.photos/seed/r-ul-3/300/220" },
    ],
    thingsToDo: [
      { name: "Pura Luhur Uluwatu", sub: "₹500 · 90 min", mentions: 241, img: "https://picsum.photos/seed/t-ul-1/300/220" },
      { name: "Kecak fire dance at sunset", sub: "₹600 · 1h", mentions: 198, img: "https://picsum.photos/seed/t-ul-2/300/220" },
      { name: "Padang Padang beach swim", sub: "Free · 2h", mentions: 142, img: "https://picsum.photos/seed/t-ul-3/300/220" },
    ],
  },
  "Nusa Dua": {
    region: "South Bali, Indonesia",
    mentionedBy: 156,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=41","https://i.pravatar.cc/40?img=67","https://i.pravatar.cc/40?img=18","https://i.pravatar.cc/40?img=70"],
    gallery: ["https://picsum.photos/seed/nd-1/600/400","https://picsum.photos/seed/nd-2/600/400","https://picsum.photos/seed/nd-3/600/400","https://picsum.photos/seed/nd-4/600/400"],
    guides: [
      { title: "The luxury resort guide to Nusa Dua", author: "Condé Nast", img: "https://picsum.photos/seed/g-nd-1/300/200", readTime: "6 min" },
      { title: "Best spa rituals in South Bali", author: "T+L", img: "https://picsum.photos/seed/g-nd-2/300/200", readTime: "5 min" },
    ],
    stays: [
      { name: "The St. Regis Bali", sub: "Lagoon · 5★", rating: 4.9, price: "₹38,000/nt", img: "https://picsum.photos/seed/s-nd-1/300/220" },
      { name: "Mulia Resort Nusa Dua", sub: "Beachfront · 5★", rating: 4.7, price: "₹24,000/nt", img: "https://picsum.photos/seed/s-nd-2/300/220" },
      { name: "Conrad Bali", sub: "Family · 5★", rating: 4.6, price: "₹18,000/nt", img: "https://picsum.photos/seed/s-nd-3/300/220" },
    ],
    restaurants: [
      { name: "Bumbu Bali", cuisine: "Authentic Balinese", rating: 4.8, price: "₹₹", img: "https://picsum.photos/seed/r-nd-1/300/220" },
      { name: "Soleil at The Mulia", cuisine: "Mediterranean · pool-side", rating: 4.6, price: "₹₹₹", img: "https://picsum.photos/seed/r-nd-2/300/220" },
    ],
    thingsToDo: [
      { name: "Waterblow at Nusa Dua", sub: "Free · 1h", mentions: 112, img: "https://picsum.photos/seed/t-nd-1/300/220" },
      { name: "Balinese spa ritual", sub: "₹1,800 · 90 min", mentions: 96, img: "https://picsum.photos/seed/t-nd-2/300/220" },
      { name: "Beach SUP & kayak", sub: "₹1,200 · 2h", mentions: 64, img: "https://picsum.photos/seed/t-nd-3/300/220" },
    ],
  },
};

/* Per-stop rich detail used by the Stop detail panel. */
interface StopFact { label: string; value: string }
interface StopDetail {
  description: string;
  gallery: string[];
  facts: StopFact[];
  mustOrder?: string[];     // food
  bestVantage?: string;     // sunset / view
  rules?: string[];         // culture / temple
  whatToBring?: string[];   // trek / nature
  amenities?: string[];     // hotel / spa
  whatToBuy?: string[];     // shopping
  showtimes?: string[];     // dance / show
  tips?: string[];          // generic
  reviews: PlaceReview[];
  mentionedBy: number;
  recommenderAvatars: string[];
}

const STOP_DETAILS: Record<string, StopDetail> = {
  "Check-in at Taj Fort Aguada": {
    description: "Heritage 5★ resort built into a 17th-century Portuguese fort, perched above Sinquerim beach. Sea-view rooms, breakfast included, and a private stretch of sand.",
    gallery: ["https://picsum.photos/seed/sd-taj-1/600/400","https://picsum.photos/seed/sd-taj-2/600/400","https://picsum.photos/seed/sd-taj-3/600/400","https://picsum.photos/seed/sd-taj-4/600/400"],
    facts: [
      { label: "Check-in", value: "from 14:00" },
      { label: "Rating", value: "★ 4.8 / 5" },
      { label: "Stay", value: "4 nights" },
      { label: "Includes", value: "Breakfast" },
    ],
    amenities: ["Private beach access", "Spa & yoga deck", "3 swimming pools", "Kids' club", "Airport transfer"],
    tips: ["Ask reception for the sea-view upgrade — usually free off-season", "Sunset cocktails on the fort wall start at 17:30"],
    reviews: [
      { author: "Priya M.", avatar: "https://i.pravatar.cc/40?img=47", rating: 5, text: "The fort views from the pool deck are unbeatable. Service is gracious without being stiff.", date: "Mar 2025" },
      { author: "Arjun K.", avatar: "https://i.pravatar.cc/40?img=12", rating: 5, text: "Worth every rupee. The breakfast spread alone justifies the rate.", date: "Jan 2025" },
    ],
    mentionedBy: 142,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=47","https://i.pravatar.cc/40?img=12","https://i.pravatar.cc/40?img=32"],
  },
  "Seminyak Beach sunset": {
    description: "The most photographed sunset strip on the island. Soft black sand, beach beds at the bars, and an unbroken horizon over the Indian Ocean.",
    gallery: ["https://picsum.photos/seed/sd-sun-1/600/400","https://picsum.photos/seed/sd-sun-2/600/400","https://picsum.photos/seed/sd-sun-3/600/400","https://picsum.photos/seed/sd-sun-4/600/400"],
    facts: [
      { label: "Best time", value: "16:30 – 18:30" },
      { label: "Sunset", value: "approx 18:14" },
      { label: "Cost", value: "Free" },
      { label: "Crowd", value: "Moderate" },
    ],
    bestVantage: "Get a beanbag at La Plancha or Ku De Ta about an hour before sunset. Walk 200m north for an emptier stretch with the same view.",
    tips: ["Order the coconut before the sun drops — service slows down", "Bring a light layer, the sea breeze cools fast at dusk"],
    reviews: [
      { author: "Nadia R.", avatar: "https://i.pravatar.cc/40?img=5", rating: 5, text: "We moved our flight just to keep this in. Worth it.", date: "Apr 2025" },
      { author: "Marcus T.", avatar: "https://i.pravatar.cc/40?img=70", rating: 4, text: "Stunning, but the beanbag bars charge a minimum spend — go in knowing that.", date: "Mar 2025" },
    ],
    mentionedBy: 184,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=5","https://i.pravatar.cc/40?img=70","https://i.pravatar.cc/40?img=23"],
  },
  "Dinner at Sardine Restaurant": {
    description: "Sardine is built around a working rice paddy lit by lanterns at night. The kitchen serves modern Indonesian seafood from the Jimbaran auction.",
    gallery: ["https://picsum.photos/seed/sd-sar-1/600/400","https://picsum.photos/seed/sd-sar-2/600/400","https://picsum.photos/seed/sd-sar-3/600/400"],
    facts: [
      { label: "Cuisine", value: "Modern Indonesian seafood" },
      { label: "Price", value: "₹₹₹ · ~₹2,000pp" },
      { label: "Hours", value: "18:00 – 23:00" },
      { label: "Dress", value: "Smart casual" },
    ],
    mustOrder: ["Charcoal-grilled mahi-mahi", "Black tiger prawns sambal matah", "Ubud spinach with garlic", "Pandan crème brûlée"],
    tips: ["Book at least 48h ahead, and request a paddy-side table", "Skip the wine list — the cocktail menu is much stronger"],
    reviews: [
      { author: "Isha M.", avatar: "https://i.pravatar.cc/40?img=41", rating: 5, text: "Genuinely one of the best meals of our trip. Order the prawns.", date: "Apr 2025" },
      { author: "Chris A.", avatar: "https://i.pravatar.cc/40?img=67", rating: 4, text: "Romantic setting, fish was perfect, dessert was just OK.", date: "Feb 2025" },
    ],
    mentionedBy: 128,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=41","https://i.pravatar.cc/40?img=67","https://i.pravatar.cc/40?img=18"],
  },
  "Tegallalang rice terrace trek": {
    description: "UNESCO subak terraces sculpted into the hillside. The 90-minute loop passes carved Hindu shrines and family-run coffee gardens.",
    gallery: ["https://picsum.photos/seed/sd-teg-1/600/400","https://picsum.photos/seed/sd-teg-2/600/400","https://picsum.photos/seed/sd-teg-3/600/400","https://picsum.photos/seed/sd-teg-4/600/400"],
    facts: [
      { label: "Duration", value: "90 min loop" },
      { label: "Difficulty", value: "Easy · 2 km" },
      { label: "Best time", value: "07:00 – 09:00" },
      { label: "Entry", value: "₹600pp" },
    ],
    whatToBring: ["Sunscreen + cap", "Water bottle", "Insect repellent", "₹1,000 cash for shrine donations"],
    tips: ["Arrive by 8am — the path gets crowded by 10:00", "The Bali Swing photo-stop is at the southern end of the loop"],
    reviews: [
      { author: "Nadia R.", avatar: "https://i.pravatar.cc/40?img=5", rating: 5, text: "Did it at 7am with no crowds — felt almost spiritual.", date: "Apr 2025" },
      { author: "Marcus T.", avatar: "https://i.pravatar.cc/40?img=70", rating: 4, text: "Beautiful but very steep on the back path — wear real shoes.", date: "Mar 2025" },
    ],
    mentionedBy: 287,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=5","https://i.pravatar.cc/40?img=70","https://i.pravatar.cc/40?img=23","https://i.pravatar.cc/40?img=44"],
  },
  "Ubud Monkey Forest": {
    description: "A sacred sanctuary with three temples and around 700 long-tailed macaques. The path winds past mossy banyan roots and the Holy Spring Bathing Temple.",
    gallery: ["https://picsum.photos/seed/sd-mky-1/600/400","https://picsum.photos/seed/sd-mky-2/600/400","https://picsum.photos/seed/sd-mky-3/600/400"],
    facts: [
      { label: "Duration", value: "1.5 h" },
      { label: "Entry", value: "₹500pp" },
      { label: "Hours", value: "08:30 – 17:30" },
      { label: "Crowd", value: "High midday" },
    ],
    rules: ["Don't carry food or water bottles in bags", "Hide loose jewellery and sunglasses", "Avoid eye contact and don't smile at the macaques", "Move slowly and don't run"],
    reviews: [
      { author: "Anika S.", avatar: "https://i.pravatar.cc/40?img=23", rating: 4, text: "Adorable but mischievous. They took my granola bar through a zipped pocket.", date: "Feb 2025" },
    ],
    mentionedBy: 198,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=23","https://i.pravatar.cc/40?img=44","https://i.pravatar.cc/40?img=8"],
  },
  "Ubud Market craft shopping": {
    description: "A two-storey market with woodwork, batiks, silver jewellery and rattan baskets. Bargain politely — the asking price is usually 2-3× the going rate.",
    gallery: ["https://picsum.photos/seed/sd-mkt-1/600/400","https://picsum.photos/seed/sd-mkt-2/600/400","https://picsum.photos/seed/sd-mkt-3/600/400"],
    facts: [
      { label: "Hours", value: "06:00 – 18:00" },
      { label: "Best time", value: "Mornings" },
      { label: "Bargain", value: "Start at 40%" },
      { label: "ATMs", value: "Outside east gate" },
    ],
    whatToBuy: ["Hand-carved teak figurines", "Hand-block-printed batik fabric", "Sterling silver from Celuk artisans", "Coconut-shell bowls and spoons", "Rattan handbags"],
    tips: ["The upper floor has the better prices — most tourists never climb up", "Walk away if a price feels off — they'll usually call you back"],
    reviews: [
      { author: "Marcus T.", avatar: "https://i.pravatar.cc/40?img=70", rating: 5, text: "Got a beautiful batik runner for ₹450 after starting at ₹1,400.", date: "Mar 2025" },
    ],
    mentionedBy: 134,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=70","https://i.pravatar.cc/40?img=8","https://i.pravatar.cc/40?img=23"],
  },
  "Traditional Kecak fire dance": {
    description: "100-voice chanted Ramayana ritual at sunset. No instruments — just bodies, voices, and a ring of fire. One of Bali's defining cultural experiences.",
    gallery: ["https://picsum.photos/seed/sd-kec-1/600/400","https://picsum.photos/seed/sd-kec-2/600/400","https://picsum.photos/seed/sd-kec-3/600/400"],
    facts: [
      { label: "Duration", value: "60 min" },
      { label: "Entry", value: "₹600pp" },
      { label: "Start", value: "18:00 daily" },
      { label: "Seating", value: "Open-air, terraced" },
    ],
    showtimes: ["18:00 — gates open", "18:30 — performance begins", "19:30 — fire ritual finale"],
    tips: ["Arrive 30 min early for a front-row seat", "Bring a sarong or cushion — stone seats get hard fast"],
    reviews: [
      { author: "Leila H.", avatar: "https://i.pravatar.cc/40?img=29", rating: 5, text: "Goosebumps from the first chant. Don't miss this.", date: "Feb 2025" },
    ],
    mentionedBy: 156,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=29","https://i.pravatar.cc/40?img=60","https://i.pravatar.cc/40?img=36"],
  },
  "Mount Batur sunrise trek": {
    description: "A pre-dawn climb up an active volcano to watch the sun rise above a sea of clouds. Roughly 2 hours up, lunar landscape at the summit, and a hot breakfast cooked by steam vents.",
    gallery: ["https://picsum.photos/seed/sd-bat-1/600/400","https://picsum.photos/seed/sd-bat-2/600/400","https://picsum.photos/seed/sd-bat-3/600/400","https://picsum.photos/seed/sd-bat-4/600/400"],
    facts: [
      { label: "Duration", value: "4 h round trip" },
      { label: "Difficulty", value: "Moderate · 1717m" },
      { label: "Start", value: "Pickup at 02:00" },
      { label: "Cost", value: "₹3,200pp · with guide" },
    ],
    whatToBring: ["Layered clothing (5°C at the summit)", "Sturdy walking shoes", "Headlamp + spare batteries", "Hot drink for the top", "Light snack — guides serve breakfast"],
    tips: ["Book a private guide — the group treks get strung out on the steep section", "Don't bring a tripod — too windy at the rim"],
    reviews: [
      { author: "Rohit V.", avatar: "https://i.pravatar.cc/40?img=15", rating: 5, text: "Hardest 90 minutes of the trip and the best sunrise of my life.", date: "Apr 2025" },
    ],
    mentionedBy: 187,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=15","https://i.pravatar.cc/40?img=44","https://i.pravatar.cc/40?img=8"],
  },
  "Kintamani volcano viewpoint": {
    description: "Caldera-rim panorama with an active volcano and crater lake. Coffee shacks line the road — most have terrace tables that hang over the edge.",
    gallery: ["https://picsum.photos/seed/sd-kvp-1/600/400","https://picsum.photos/seed/sd-kvp-2/600/400","https://picsum.photos/seed/sd-kvp-3/600/400"],
    facts: [
      { label: "Duration", value: "30–60 min" },
      { label: "Best time", value: "10:00 – 11:30" },
      { label: "Cost", value: "Free · café spend" },
      { label: "Weather", value: "Cool · 18°C" },
    ],
    bestVantage: "Stop at Montana del Café — the back terrace has the cleanest line of sight to the crater. Avoid the first viewpoint on the road, it's a tour-bus magnet.",
    reviews: [
      { author: "Camille B.", avatar: "https://i.pravatar.cc/40?img=44", rating: 4, text: "Quick stop, but the coffee was excellent and the view huge.", date: "Jan 2025" },
    ],
    mentionedBy: 92,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=44","https://i.pravatar.cc/40?img=15"],
  },
  "Banjar hot springs soak": {
    description: "Three geothermal pools in a tropical garden. Water flows from carved naga (serpent) spouts at 38°C — perfect for tired legs after the volcano hike.",
    gallery: ["https://picsum.photos/seed/sd-bj-1/600/400","https://picsum.photos/seed/sd-bj-2/600/400","https://picsum.photos/seed/sd-bj-3/600/400"],
    facts: [
      { label: "Duration", value: "60–90 min" },
      { label: "Entry", value: "₹500pp" },
      { label: "Hours", value: "08:00 – 18:00" },
      { label: "Water", value: "38°C · sulphuric" },
    ],
    amenities: ["Changing rooms", "Lockers (₹100)", "Café upstairs", "Towel rental"],
    reviews: [
      { author: "Camille B.", avatar: "https://i.pravatar.cc/40?img=44", rating: 4, text: "Exactly what we needed after Batur. Slightly egg-y smell but you stop noticing.", date: "Jan 2025" },
    ],
    mentionedBy: 88,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=44","https://i.pravatar.cc/40?img=15"],
  },
  "Local warung dinner in Ubud": {
    description: "Family-run kitchen serving daily-rotating Balinese dishes. No menu — point at the warmer, take a plate, eat at communal teak benches.",
    gallery: ["https://picsum.photos/seed/sd-war-1/600/400","https://picsum.photos/seed/sd-war-2/600/400","https://picsum.photos/seed/sd-war-3/600/400"],
    facts: [
      { label: "Cuisine", value: "Home-style Balinese" },
      { label: "Price", value: "~₹250pp" },
      { label: "Hours", value: "11:00 – 21:00" },
      { label: "Cash only", value: "Yes" },
    ],
    mustOrder: ["Babi guling (suckling pig)", "Nasi campur", "Sate lilit (lemongrass skewers)", "Es daluman (green-jelly drink)"],
    tips: ["Go before 19:00 — dishes run out by 20:00", "If they're sold out of babi guling, the chicken sambal matah is the next best"],
    reviews: [
      { author: "Anika S.", avatar: "https://i.pravatar.cc/40?img=23", rating: 5, text: "₹260 for the best Balinese meal of our trip. Eat where the locals do.", date: "Feb 2025" },
    ],
    mentionedBy: 76,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=23","https://i.pravatar.cc/40?img=44"],
  },
  "Uluwatu Temple clifftop walk": {
    description: "Pura Luhur perches 70m above the Indian Ocean on a sheer limestone cliff. The path runs along the rim past wild macaques and ocean spray.",
    gallery: ["https://picsum.photos/seed/sd-ul-1/600/400","https://picsum.photos/seed/sd-ul-2/600/400","https://picsum.photos/seed/sd-ul-3/600/400","https://picsum.photos/seed/sd-ul-4/600/400"],
    facts: [
      { label: "Duration", value: "90 min" },
      { label: "Entry", value: "₹500pp · sarong incl." },
      { label: "Hours", value: "07:00 – 19:00" },
      { label: "Cliff height", value: "70 m" },
    ],
    rules: ["Sarong required (free at gate)", "Don't carry food, water, or shiny accessories", "Stay on the path — cliff edge has no rails", "Photography is OK; no flash inside the inner sanctum"],
    bestVantage: "Walk past the main temple to the southern lookout — fewer tourists and the cleaner photo line.",
    reviews: [
      { author: "Leila H.", avatar: "https://i.pravatar.cc/40?img=29", rating: 5, text: "A monkey took my sunglasses straight off my head. I laughed about it for the rest of the trip.", date: "Feb 2025" },
    ],
    mentionedBy: 241,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=29","https://i.pravatar.cc/40?img=60","https://i.pravatar.cc/40?img=36"],
  },
  "Padang Padang beach swim": {
    description: "A tucked-away cove reached through a slit in the limestone. Turquoise water, a perfect right-hand point break, and quieter than Kuta or Seminyak.",
    gallery: ["https://picsum.photos/seed/sd-pad-1/600/400","https://picsum.photos/seed/sd-pad-2/600/400","https://picsum.photos/seed/sd-pad-3/600/400"],
    facts: [
      { label: "Duration", value: "2 h" },
      { label: "Entry", value: "Free" },
      { label: "Water", value: "Calm · clear" },
      { label: "Surf", value: "Right-hand reef" },
    ],
    amenities: ["Sun-bed rental (₹150)", "Beach café", "Showers", "Lifeguard 09:00–17:00"],
    tips: ["Go before 11:00 to find a free patch of sand", "The path down is via stone steps — hold the rail"],
    reviews: [
      { author: "Tom W.", avatar: "https://i.pravatar.cc/40?img=60", rating: 5, text: "Spectacular — turquoise water, perfect waves, postcard scenery.", date: "Apr 2025" },
    ],
    mentionedBy: 142,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=60","https://i.pravatar.cc/40?img=29","https://i.pravatar.cc/40?img=18"],
  },
  "Kecak dance at Uluwatu": {
    description: "An open-air amphitheatre on the cliff edge — the chant begins as the sun touches the horizon. The fire ritual finale is one of Bali's signature images.",
    gallery: ["https://picsum.photos/seed/sd-kec2-1/600/400","https://picsum.photos/seed/sd-kec2-2/600/400","https://picsum.photos/seed/sd-kec2-3/600/400"],
    facts: [
      { label: "Duration", value: "60 min" },
      { label: "Start", value: "18:00 daily" },
      { label: "Entry", value: "₹600pp" },
      { label: "Seating", value: "Stone steps" },
    ],
    showtimes: ["17:30 — gates open", "18:00 — chanting begins", "18:50 — fire dance finale"],
    tips: ["Get there 45 min early for centre-front seats", "Bring something to sit on — the stone is rough"],
    reviews: [
      { author: "Leila H.", avatar: "https://i.pravatar.cc/40?img=29", rating: 5, text: "Best ₹600 I spent on the entire trip.", date: "Feb 2025" },
    ],
    mentionedBy: 198,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=29","https://i.pravatar.cc/40?img=60","https://i.pravatar.cc/40?img=36"],
  },
  "Seafood dinner at Jimbaran Bay": {
    description: "A line of beachfront BBQ shacks where you pick your fish from a chilled display, then eat it on the sand with toes in cool water.",
    gallery: ["https://picsum.photos/seed/sd-jim-1/600/400","https://picsum.photos/seed/sd-jim-2/600/400","https://picsum.photos/seed/sd-jim-3/600/400"],
    facts: [
      { label: "Cuisine", value: "Beach BBQ seafood" },
      { label: "Price", value: "₹₹ · ~₹1,400pp" },
      { label: "Hours", value: "17:30 – 23:00" },
      { label: "Reserve", value: "Front-row tables" },
    ],
    mustOrder: ["Whole grilled snapper with sambal matah", "Coconut-husk grilled prawns", "Steamed clams in lemongrass broth", "Grilled corn with chili-lime butter"],
    tips: ["Menega Café and Bawang Merah are the most reliable shacks", "Tide rises after 21:00 — book a back row if you don't want feet wet"],
    reviews: [
      { author: "Tom W.", avatar: "https://i.pravatar.cc/40?img=60", rating: 5, text: "Sun setting, fish on a coconut grill, kids running on the sand. Perfect.", date: "Apr 2025" },
    ],
    mentionedBy: 134,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=60","https://i.pravatar.cc/40?img=18","https://i.pravatar.cc/40?img=41"],
  },
  "Nusa Dua beach morning walk": {
    description: "Five kilometres of calm, white-sand beach with a shaded promenade. Most resorts open their gates so you can walk the full stretch.",
    gallery: ["https://picsum.photos/seed/sd-nd-1/600/400","https://picsum.photos/seed/sd-nd-2/600/400","https://picsum.photos/seed/sd-nd-3/600/400"],
    facts: [
      { label: "Duration", value: "60–90 min" },
      { label: "Distance", value: "5 km loop" },
      { label: "Best time", value: "06:30 – 08:30" },
      { label: "Cost", value: "Free" },
    ],
    tips: ["Start at the Waterblow lookout for the best photos", "The Conrad's beach café opens at 07:00 if you want a coffee mid-walk"],
    reviews: [
      { author: "Chris A.", avatar: "https://i.pravatar.cc/40?img=67", rating: 4, text: "Calm, clean, perfect for an easy morning before the flight.", date: "Feb 2025" },
    ],
    mentionedBy: 88,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=67","https://i.pravatar.cc/40?img=41","https://i.pravatar.cc/40?img=18"],
  },
  "Balinese spa & massage": {
    description: "Coconut oil and rice-paste rituals rooted in centuries of Balinese healing. The 90-minute treatment includes a flower bath and ginger tea.",
    gallery: ["https://picsum.photos/seed/sd-spa-1/600/400","https://picsum.photos/seed/sd-spa-2/600/400","https://picsum.photos/seed/sd-spa-3/600/400"],
    facts: [
      { label: "Duration", value: "90 min" },
      { label: "Cost", value: "₹1,800pp" },
      { label: "Hours", value: "09:00 – 21:00" },
      { label: "Booking", value: "Same-day OK" },
    ],
    amenities: ["Steam room", "Flower bath", "Herbal tea lounge", "Outdoor garden treatment rooms"],
    tips: ["Ask for the boreh body scrub if you have any sunburn — it's magical", "Don't book within 90 min of dinner — meal feels heavy after"],
    reviews: [
      { author: "Mia L.", avatar: "https://i.pravatar.cc/40?img=18", rating: 5, text: "Skin felt amazing for days after.", date: "Jan 2025" },
    ],
    mentionedBy: 96,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=18","https://i.pravatar.cc/40?img=41","https://i.pravatar.cc/40?img=67"],
  },
  "Farewell lunch at Bumbu Bali": {
    description: "Chef Heinz von Holzen's love letter to Balinese cuisine. Authentic rijsttafel served on traditional banana-leaf platters in a teak pavilion.",
    gallery: ["https://picsum.photos/seed/sd-bb-1/600/400","https://picsum.photos/seed/sd-bb-2/600/400","https://picsum.photos/seed/sd-bb-3/600/400"],
    facts: [
      { label: "Cuisine", value: "Authentic Balinese" },
      { label: "Price", value: "₹₹ · ~₹1,200pp" },
      { label: "Hours", value: "11:00 – 22:00" },
      { label: "Reserve", value: "24h ahead" },
    ],
    mustOrder: ["Rijsttafel (Balinese tasting platter)", "Bebek betutu (slow-cooked duck)", "Sate lilit", "Black-rice pudding with palm sugar"],
    tips: ["Cooking-class option is excellent — book 2 days ahead", "Ask for a pavilion seat, not the indoor dining room"],
    reviews: [
      { author: "Isha M.", avatar: "https://i.pravatar.cc/40?img=41", rating: 5, text: "The most authentic Balinese meal we had — and the cooking class is a highlight.", date: "Apr 2025" },
    ],
    mentionedBy: 112,
    recommenderAvatars: ["https://i.pravatar.cc/40?img=41","https://i.pravatar.cc/40?img=67","https://i.pravatar.cc/40?img=18"],
  },
  "Depart from Ngurah Rai Airport": {
    description: "Bali's international gateway (DPS). Allow 2.5 hours for international departures — the airport gets jammed in the late evening.",
    gallery: ["https://picsum.photos/seed/sd-air-1/600/400","https://picsum.photos/seed/sd-air-2/600/400"],
    facts: [
      { label: "Code", value: "DPS" },
      { label: "Drive", value: "~45 min from Nusa Dua" },
      { label: "Departures", value: "Terminal 2 · International" },
      { label: "Lounge", value: "Plaza Premium · ₹2,400" },
    ],
    tips: ["Use the Premium lounge — beats the food court by a mile", "Last duty-free wing has the best coffee (Ngurah Brew)"],
    reviews: [],
    mentionedBy: 0,
    recommenderAvatars: [],
  },
};

const ACTIVITY_BLURBS: Record<string, { blurb: string; mentioned: number }> = {
  "Check-in at Taj Fort Aguada": { blurb: "Heritage cliff-top resort. Sea-view rooms, breakfast included.", mentioned: 142 },
  "Seminyak Beach sunset": { blurb: "The most photographed sunset strip on the island.", mentioned: 184 },
  "Dinner at Sardine Restaurant": { blurb: "Lakeside fine-dining built around a working rice paddy.", mentioned: 128 },
  "Tegallalang rice terrace trek": { blurb: "UNESCO subak terraces — best photos at 8am with no crowds.", mentioned: 287 },
  "Ubud Monkey Forest": { blurb: "Sacred sanctuary with three temples and 700 macaques.", mentioned: 198 },
  "Ubud Market craft shopping": { blurb: "Bargain-friendly stalls of woodwork, batiks and silver.", mentioned: 134 },
  "Traditional Kecak fire dance": { blurb: "100-voice chanted Ramayana ritual at dusk.", mentioned: 156 },
  "Mount Batur sunrise trek": { blurb: "Pre-dawn climb to watch the sun rise above the clouds.", mentioned: 187 },
  "Kintamani volcano viewpoint": { blurb: "Caldera-rim panorama with active volcano and crater lake.", mentioned: 92 },
  "Banjar hot springs soak": { blurb: "Three geothermal pools surrounded by tropical jungle.", mentioned: 88 },
  "Local warung dinner in Ubud": { blurb: "Family-run kitchens — try babi guling and nasi campur.", mentioned: 76 },
  "Uluwatu Temple clifftop walk": { blurb: "70m sea-cliff temple — keep your sunglasses out of monkey reach.", mentioned: 241 },
  "Padang Padang beach swim": { blurb: "Turquoise water and a perfect right-hand point break.", mentioned: 142 },
  "Kecak dance at Uluwatu": { blurb: "Open-air amphitheatre with the sun setting behind the chant.", mentioned: 198 },
  "Seafood dinner at Jimbaran Bay": { blurb: "Beachfront BBQ shacks — toes-in-sand, fish on coconut husks.", mentioned: 134 },
  "Nusa Dua beach morning walk": { blurb: "5km of calm white-sand beach with shaded promenade.", mentioned: 88 },
  "Balinese spa & massage": { blurb: "Coconut-oil and rice-paste rituals — book the 90-min treatment.", mentioned: 96 },
  "Farewell lunch at Bumbu Bali": { blurb: "Authentic Balinese rijsttafel by chef Heinz von Holzen.", mentioned: 112 },
  "Depart from Ngurah Rai Airport": { blurb: "Allow 2.5h before international departure.", mentioned: 0 },
};

const BALI_PLAN: DayPlan[] = [
  {
    day: 1, location: "Seminyak", lat: -8.692, lng: 115.165,
    img: "https://picsum.photos/seed/seminyak-beach/600/400",
    tag: "Arrival & Beach",
    activities: [
      { time: "14:00", name: "Check-in at Taj Fort Aguada", type: "hotel", lat: -8.6905, lng: 115.1685, img: "https://picsum.photos/seed/d1-hotel/120/120" },
      { time: "16:30", name: "Seminyak Beach sunset", type: "sunset", lat: -8.6938, lng: 115.1572, img: "https://picsum.photos/seed/d1-sunset/120/120" },
      { time: "19:30", name: "Dinner at Sardine Restaurant", type: "food", lat: -8.6826, lng: 115.1654, img: "https://picsum.photos/seed/d1-food/120/120" },
    ],
    alternatives: [
      ["Echo Beach surfing session", "Legian Beach walk", "Petitenget Beach"],
      ["La Lucciola sunset dinner", "Ku De Ta rooftop", "Merah Putih fine dining"],
    ],
    detail: {
      description: "Seminyak is Bali's most stylish beach destination — boutique hotels, world-class restaurants, and uncrowded sunsets. The vibe is chic but relaxed.",
      weather: "Sunny", temp: "29°C",
      highlights: ["Best sunsets in Bali", "Upscale dining scene", "Boutique shopping strips"],
      reviews: [
        { author: "Priya M.", avatar: "https://i.pravatar.cc/40?img=47", rating: 5, text: "The sunset at Seminyak Beach was absolutely magical. Sardine Restaurant exceeded every expectation — go for the lakeside table!", date: "Mar 2025" },
        { author: "Arjun K.", avatar: "https://i.pravatar.cc/40?img=12", rating: 5, text: "Perfect first day. The beach vibe here is completely different from Kuta — so much more relaxed and beautiful.", date: "Jan 2025" },
        { author: "Sarah L.", avatar: "https://i.pravatar.cc/40?img=32", rating: 4, text: "Loved the boutique shopping scene. Petitenget Beach is quieter and honestly better than the main strip.", date: "Feb 2025" },
      ],
    },
  },
  {
    day: 2, location: "Ubud", lat: -8.508, lng: 115.259,
    img: "https://picsum.photos/seed/ubud-rice/600/400",
    tag: "Culture & Rice Terraces",
    activities: [
      { time: "08:00", name: "Tegallalang rice terrace trek", type: "trek", lat: -8.4310, lng: 115.2790, img: "https://picsum.photos/seed/d2-trek/120/120" },
      { time: "11:00", name: "Ubud Monkey Forest", type: "nature", lat: -8.5188, lng: 115.2587, img: "https://picsum.photos/seed/d2-nature/120/120" },
      { time: "14:00", name: "Ubud Market craft shopping", type: "shopping", lat: -8.5069, lng: 115.2625, img: "https://picsum.photos/seed/d2-shop/120/120" },
      { time: "18:00", name: "Traditional Kecak fire dance", type: "dance", lat: -8.5065, lng: 115.2630, img: "https://picsum.photos/seed/d2-dance/120/120" },
    ],
    alternatives: [
      ["Sacred Monkey Forest Sanctuary", "Campuhan Ridge Walk", "Goa Gajah temple"],
      ["Ubud Palace", "Puri Saren Royal Palace", "Tirta Empul holy spring"],
    ],
    detail: {
      description: "The cultural heart of Bali. Ubud sits among terraced rice paddies and is home to galleries, temples, and the island's most celebrated traditional arts.",
      weather: "Partly cloudy", temp: "26°C",
      highlights: ["UNESCO rice terraces", "Kecak fire dance at sunset", "200+ art galleries"],
      reviews: [
        { author: "Nadia R.", avatar: "https://i.pravatar.cc/40?img=5", rating: 5, text: "Tegallalang at 8am with no crowds was breathtaking. The Kecak dance at dusk is unlike anything I've ever seen — emotional and incredible.", date: "Apr 2025" },
        { author: "Marcus T.", avatar: "https://i.pravatar.cc/40?img=70", rating: 5, text: "Ubud Market is the best place for authentic Balinese crafts. Bargain hard but be fair — amazing quality goods.", date: "Mar 2025" },
        { author: "Anika S.", avatar: "https://i.pravatar.cc/40?img=23", rating: 4, text: "The Monkey Forest is fun but go early. Campuhan Ridge Walk at sunrise is an underrated gem most tourists skip.", date: "Feb 2025" },
      ],
    },
  },
  {
    day: 3, location: "Kintamani", lat: -8.239, lng: 115.375,
    img: "https://picsum.photos/seed/kintamani-volcano/600/400",
    tag: "Volcano & Hot Springs",
    activities: [
      { time: "07:00", name: "Mount Batur sunrise trek", type: "trek", lat: -8.2419, lng: 115.3756, img: "https://picsum.photos/seed/d3-batur/120/120" },
      { time: "11:00", name: "Kintamani volcano viewpoint", type: "trek", lat: -8.2452, lng: 115.3534, img: "https://picsum.photos/seed/d3-volcano/120/120" },
      { time: "14:00", name: "Banjar hot springs soak", type: "beach", lat: -8.2280, lng: 115.3400, img: "https://picsum.photos/seed/d3-springs/120/120" },
      { time: "18:30", name: "Local warung dinner in Ubud", type: "food", lat: -8.5070, lng: 115.2630, img: "https://picsum.photos/seed/d3-warung/120/120" },
    ],
    alternatives: [
      ["Lake Batur boat ride", "Bali Swing experience", "Jatiluwih rice terraces"],
      ["Lovina dolphin sunrise tour", "North Bali temple circuit", "Gitgit waterfall"],
    ],
    detail: {
      description: "Kintamani sits on the rim of an ancient caldera with Mount Batur rising from a crater lake. The sunrise trek is one of Southeast Asia's most iconic experiences.",
      weather: "Cool & misty", temp: "18°C",
      highlights: ["Sunrise above the clouds", "Active volcano trek", "Geothermal hot springs"],
      reviews: [
        { author: "Rohit V.", avatar: "https://i.pravatar.cc/40?img=15", rating: 5, text: "The Batur sunrise trek was the highlight of our entire Bali trip. Start at 4am, watch the sun rise above the clouds — completely worth it.", date: "Apr 2025" },
        { author: "Camille B.", avatar: "https://i.pravatar.cc/40?img=44", rating: 4, text: "Banjar hot springs is perfectly warm and surrounded by lush jungle. Great way to recover after the morning trek.", date: "Jan 2025" },
        { author: "Dev P.", avatar: "https://i.pravatar.cc/40?img=8", rating: 5, text: "Don't miss the caldera viewpoint — the lake inside the volcano is surreal. Hire a local guide for the full story.", date: "Mar 2025" },
      ],
    },
  },
  {
    day: 4, location: "Uluwatu", lat: -8.829, lng: 115.085,
    img: "https://picsum.photos/seed/uluwatu-cliff/600/400",
    tag: "Cliffs & Temples",
    activities: [
      { time: "10:00", name: "Uluwatu Temple clifftop walk", type: "culture", lat: -8.8290, lng: 115.0850, img: "https://picsum.photos/seed/d4-temple/120/120" },
      { time: "12:30", name: "Padang Padang beach swim", type: "beach", lat: -8.8118, lng: 115.1043, img: "https://picsum.photos/seed/d4-beach/120/120" },
      { time: "17:30", name: "Kecak dance at Uluwatu", type: "dance", lat: -8.8295, lng: 115.0848, img: "https://picsum.photos/seed/d4-kecak/120/120" },
      { time: "20:00", name: "Seafood dinner at Jimbaran Bay", type: "food", lat: -8.7900, lng: 115.1620, img: "https://picsum.photos/seed/d4-seafood/120/120" },
    ],
    alternatives: [
      ["Bingin Beach surf lesson", "Balangan Beach", "Single Fin cliff bar"],
      ["Nusa Dua water sports", "GWK Cultural Park", "Garuda Wisnu Kencana statue"],
    ],
    detail: {
      description: "Uluwatu sits on Bali's southwestern tip — dramatic sea cliffs, world-famous surf breaks, and the ancient Pura Luhur temple perched 70 metres above the ocean.",
      weather: "Sunny & breezy", temp: "30°C",
      highlights: ["70m sea cliff temple", "Indo's best surf", "Jimbaran beachfront dining"],
      reviews: [
        { author: "Leila H.", avatar: "https://i.pravatar.cc/40?img=29", rating: 5, text: "The Kecak dance at Uluwatu with the sun setting behind the ocean cliffs is one of those moments you'll never forget. Buy tickets early!", date: "Feb 2025" },
        { author: "Tom W.", avatar: "https://i.pravatar.cc/40?img=60", rating: 5, text: "Padang Padang is spectacular — turquoise water, perfect waves. The Jimbaran seafood BBQ on the beach at night was a perfect ending.", date: "Apr 2025" },
        { author: "Shreya N.", avatar: "https://i.pravatar.cc/40?img=36", rating: 4, text: "Watch out for the monkeys at the temple — they'll snatch your glasses! But the views from the cliff are absolutely worth it.", date: "Mar 2025" },
      ],
    },
  },
  {
    day: 5, location: "Nusa Dua", lat: -8.792, lng: 115.231,
    img: "https://picsum.photos/seed/nusa-dua-beach/600/400",
    tag: "Relaxation & Departure",
    activities: [
      { time: "09:00", name: "Nusa Dua beach morning walk", type: "walk", lat: -8.7920, lng: 115.2310, img: "https://picsum.photos/seed/d5-walk/120/120" },
      { time: "10:30", name: "Balinese spa & massage", type: "spa", lat: -8.7965, lng: 115.2275, img: "https://picsum.photos/seed/d5-spa/120/120" },
      { time: "13:00", name: "Farewell lunch at Bumbu Bali", type: "food", lat: -8.7870, lng: 115.2230, img: "https://picsum.photos/seed/d5-lunch/120/120" },
      { time: "17:00", name: "Depart from Ngurah Rai Airport", type: "flight", lat: -8.7467, lng: 115.1668, img: "https://picsum.photos/seed/d5-airport/120/120" },
    ],
    alternatives: [
      ["Waterblow Nusa Dua", "Benoa Bay water sports", "South Kuta beach morning"],
      ["Seminyak last-minute shopping", "Made's Warung farewell dinner", "Airport lounge"],
    ],
    detail: {
      description: "Nusa Dua is Bali's luxury resort enclave — pristine white sand beaches, calm turquoise waters, and world-class spas. The perfect way to end your trip.",
      weather: "Sunny", temp: "31°C",
      highlights: ["Calm lagoon beaches", "5-star spa treatments", "Waterblow rock formation"],
      reviews: [
        { author: "Isha M.", avatar: "https://i.pravatar.cc/40?img=41", rating: 5, text: "Bumbu Bali serves the most authentic Balinese food I've ever tasted. Book the cooking class if you can — incredible host family.", date: "Apr 2025" },
        { author: "Chris A.", avatar: "https://i.pravatar.cc/40?img=67", rating: 4, text: "Great final day — the beach is calm and clean, perfect for a morning swim. Waterblow is dramatic when the tide is in.", date: "Feb 2025" },
        { author: "Mia L.", avatar: "https://i.pravatar.cc/40?img=18", rating: 5, text: "The traditional Balinese spa was the perfect send-off. They use local coconut oil and rice paste — skin felt amazing for days after.", date: "Jan 2025" },
      ],
    },
  },
].map(d => {
  const cat = PLACE_CATALOG[d.location];
  return cat ? {
    ...d,
    activities: d.activities.map(a => {
      const ab = ACTIVITY_BLURBS[a.name];
      return ab ? { ...a, blurb: ab.blurb, mentionedBy: ab.mentioned } : a;
    }),
    detail: {
      ...d.detail,
      region: cat.region,
      mentionedBy: cat.mentionedBy,
      recommenderAvatars: cat.recommenderAvatars,
      gallery: cat.gallery,
      guides: cat.guides,
      stays: cat.stays,
      restaurants: cat.restaurants,
      thingsToDo: cat.thingsToDo,
    },
  } : d;
}) as DayPlan[];

/* ── Star rating ─────────────────────────────────────────── */
function StarRating({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= rating ? "#FF4F17" : "#e5e7eb"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
    </span>
  );
}


/* ── Segment swap panel ─────────────────────────────────── */
type SegmentId = "flight-out" | "hotel" | "flight-return";
const SEGMENT_ALTS: Record<SegmentId, { label: string; detail: string; price: string; saving?: string }[]> = {
  "flight-out": [
    { label: "IndiGo 6E-2241", detail: "06:25 DEL→DPS · Non-stop · 5h 45m", price: "₹9,798", saving: "Current" },
    { label: "Air Asia I5-764", detail: "09:10 DEL→DPS · 1 stop · 7h 20m", price: "₹7,200", saving: "Save ₹2,598" },
    { label: "Vistara UK-107", detail: "14:30 DEL→DPS · Non-stop · 5h 45m", price: "₹12,400" },
  ],
  "hotel": [
    { label: "Taj Fort Aguada · 5★", detail: "Seminyak · Breakfast incl. · 4 nights", price: "₹34,000", saving: "Current" },
    { label: "Alaya Resort · 4★", detail: "Ubud · Pool villa · 4 nights", price: "₹24,000", saving: "Save ₹10,000" },
    { label: "Katamama · 5★", detail: "Seminyak · All-inclusive · 4 nights", price: "₹48,000" },
  ],
  "flight-return": [
    { label: "IndiGo 6E-2244", detail: "19:45 DPS→DEL · Non-stop · 5h 45m", price: "₹10,598", saving: "Current" },
    { label: "Air Asia I5-765", detail: "07:30 DPS→DEL · 1 stop · 8h 10m", price: "₹7,800", saving: "Save ₹2,798" },
    { label: "Vistara UK-108", detail: "22:00 DPS→DEL · Non-stop · 5h 40m", price: "₹13,200" },
  ],
};

const BUDGET_OVERRUN_SCENARIOS = [
  { segment: "Hotel", item: "Taj Fort Aguada · 5★", over: "₹8,000", fix: "Switch to Alaya Resort · 4★ (Save ₹10,000)" },
  { segment: "Flights", item: "Vistara outbound", over: "₹2,600", fix: "Switch to Air Asia I5-764 (Save ₹2,598)" },
];

const CONFLICT_SCENARIOS: TravellerVote[] = [
  {
    travellerA: "You", travellerB: "Rohan",
    options: ["🏖️ Beach relaxation days", "🏛️ Culture & temples tour"],
    voteA: "🏖️ Beach relaxation days", voteB: "🏛️ Culture & temples tour",
  },
  {
    travellerA: "You", travellerB: "Rohan",
    options: ["🍽️ Fine dining each night", "🥘 Street food & local spots"],
    voteA: null, voteB: "🥘 Street food & local spots",
  },
];

function SegmentSwapPanel({ segmentId, onClose, onSwap }: { segmentId: SegmentId; onClose: () => void; onSwap: (label: string, price: string) => void }) {
  const alts = SEGMENT_ALTS[segmentId];
  const [picked, setPicked] = useState<string | null>(null);

  const title = segmentId === "flight-out" ? "Outbound flight"
    : segmentId === "hotel" ? "Hotel"
    : "Return flight";

  return (
    <div className="bg-[#fafafa] border border-[#efefef] rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#f0f0f0]">
        <p className="text-[12px] font-bold text-[#1a1a1a] uppercase tracking-wide">Swap {title}</p>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#f0f0f0] transition-colors">
          <X size={12} className="text-ct-text-muted" />
        </button>
      </div>
      <div className="p-3 space-y-2">
        {alts.map((alt, i) => {
          const isCurrent = alt.saving === "Current";
          const isSelected = picked === alt.label;
          return (
            <button
              key={i}
              onClick={() => { if (!isCurrent) { setPicked(alt.label); setTimeout(() => { onSwap(alt.label, alt.price); onClose(); }, 350); } }}
              disabled={isCurrent}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all",
                isCurrent ? "border-[#1a1a1a] bg-white cursor-default"
                  : isSelected ? "border-[#FF4F17] bg-[#fff5f2]"
                  : "border-[#e8e8e8] bg-white hover:border-[#FF4F17]/40 hover:bg-[#fff9f7] group"
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[12px] font-bold text-[#1a1a1a]">{alt.label}</p>
                  {isCurrent && <span className="text-[9px] font-bold text-[#1a1a1a] bg-[#ebebeb] px-1.5 py-0.5 rounded-full">Current</span>}
                  {alt.saving && !isCurrent && <span className="text-[9px] font-bold text-[#22c55e] bg-[#dcfce7] border border-[#dcfce7] px-1.5 py-0.5 rounded-full">{alt.saving}</span>}
                </div>
                <p className="text-[10.5px] text-ct-text-muted mt-0.5">{alt.detail}</p>
              </div>
              <p className={cn("text-[13px] font-bold shrink-0", isSelected ? "text-[#FF4F17]" : "text-[#1a1a1a]")}>{alt.price}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Budget alert ────────────────────────────────────────── */
function BudgetAlert({ onFix, onDismiss }: { onFix: (fix: string) => void; onDismiss: () => void }) {
  const [fixApplied, setFixApplied] = useState<string | null>(null);
  return (
    <div className="bg-[#fef3c7] border border-ct-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ct-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-[#f59e0b] flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black">!</span>
          </div>
          <p className="text-[12px] font-bold text-ct-text">Over budget by ₹10,600</p>
        </div>
        <button onClick={onDismiss} className="text-ct-text-muted hover:text-ct-text transition-colors"><X size={13} /></button>
      </div>
      <div className="px-4 py-3 space-y-2.5">
        <p className="text-[11.5px] text-ct-text-secondary">Your budget is ₹80,000. Two items are pushing costs up — pick a fix:</p>
        {BUDGET_OVERRUN_SCENARIOS.map((s, i) => (
          <div key={i} className={cn(
            "flex items-start gap-3 p-3 rounded-xl border transition-all",
            fixApplied === s.fix ? "border-[#22c55e] bg-[#dcfce7]" : "border-ct-border bg-white"
          )}>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-ct-text">{s.segment} · {s.item}</p>
              <p className="text-[10px] text-ct-text-muted mt-0.5">+{s.over} over limit</p>
              <p className="text-[10.5px] text-ct-text font-medium mt-1">Fix: {s.fix}</p>
            </div>
            {fixApplied === s.fix ? (
              <span className="text-[10px] font-bold text-[#22c55e] shrink-0 mt-0.5">Applied ✓</span>
            ) : (
              <button
                onClick={() => { setFixApplied(s.fix); onFix(s.fix); }}
                className="shrink-0 text-[10.5px] font-bold text-[#FF4F17] border border-[#FF4F17]/30 bg-[#fff2ee] px-2.5 py-1 rounded-full hover:bg-[#ffd4c4] transition-colors mt-0.5"
              >
                Apply
              </button>
            )}
          </div>
        ))}
        <button className="w-full text-[11px] font-semibold text-ct-text-secondary border border-ct-border py-2 rounded-xl hover:bg-ct-surface-subtle transition-colors">
          Adjust my budget instead →
        </button>
      </div>
    </div>
  );
}

/* ── Mid-booking change warning ─────────────────────────── */
function BookingChangeWarning({ onResolve }: { onResolve: (id: string, action: "keep" | "rebook") => void }) {
  const [resolved, setResolved] = useState<Record<string, "keep" | "rebook">>({});
  const bookings: BookingItem[] = [
    { id: "flight-out", label: "IndiGo 6E-2241 · DEL→DPS", detail: "May 15 · 06:25 — seat selection locked", price: "₹9,798", status: "at-risk" },
    { id: "hotel", label: "Taj Fort Aguada · 4 nights", detail: "May 15–19 · Check-in must update", price: "₹34,000", status: "at-risk" },
    { id: "flight-return", label: "IndiGo 6E-2244 · DPS→DEL", detail: "May 19 · 19:45 — unaffected", price: "₹10,598", status: "confirmed" },
  ];

  return (
    <div className="bg-white border border-[#fee2e2] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-[#fee2e2] border-b border-[#fee2e2]">
        <div className="w-5 h-5 rounded-full bg-[#ef4444] flex items-center justify-center shrink-0">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
        </div>
        <p className="text-[12px] font-bold text-ct-text">Date change affects 2 bookings</p>
      </div>
      <div className="p-4 space-y-2">
        {bookings.map(b => {
          const res = resolved[b.id];
          return (
            <div key={b.id} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all",
              b.status === "confirmed" ? "border-[#dcfce7] bg-[#dcfce7]"
                : res === "rebook" ? "border-[#dbeafe] bg-[#dbeafe]"
                : res === "keep" ? "border-ct-border bg-ct-surface-subtle"
                : "border-[#fee2e2] bg-white"
            )}>
              <div className={cn("w-2 h-2 rounded-full shrink-0",
                b.status === "confirmed" ? "bg-[#22c55e]"
                  : res ? "bg-ct-text-muted" : "bg-[#ef4444] animate-pulse")} />
              <div className="min-w-0 flex-1">
                <p className="text-[11.5px] font-semibold text-ct-text">{b.label}</p>
                <p className="text-[10px] text-ct-text-muted">{b.detail}</p>
              </div>
              <p className="text-[11px] font-bold text-ct-text shrink-0">{b.price}</p>
              {b.status === "at-risk" && !res && (
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => { setResolved(r => ({ ...r, [b.id]: "rebook" })); onResolve(b.id, "rebook"); }}
                    className="text-[10px] font-bold text-white bg-ct-text px-2 py-0.5 rounded-full hover:bg-ct-action-hover transition-colors">
                    Rebook
                  </button>
                  <button onClick={() => { setResolved(r => ({ ...r, [b.id]: "keep" })); onResolve(b.id, "keep"); }}
                    className="text-[10px] font-semibold text-ct-text-secondary border border-ct-border px-2 py-0.5 rounded-full hover:bg-ct-surface-subtle transition-colors">
                    Keep
                  </button>
                </div>
              )}
              {b.status === "at-risk" && res && (
                <span className="text-[9.5px] font-bold text-ct-text-muted bg-ct-surface-deep px-2 py-0.5 rounded-full shrink-0">
                  {res === "rebook" ? "Rebooking…" : "Keeping"}
                </span>
              )}
              {b.status === "confirmed" && (
                <span className="text-[9.5px] font-bold text-[#22c55e] shrink-0">Safe ✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Conflicting preferences ─────────────────────────────── */
function ConflictResolver() {
  const [votes, setVotes] = useState<(string | null)[]>([null, null]);
  const [resolved, setResolved] = useState<string[]>([]);
  const conflicts = CONFLICT_SCENARIOS;

  function vote(conflictIdx: number, option: string) {
    const updated = [...votes];
    updated[conflictIdx] = option;
    setVotes(updated);
    const conflict = conflicts[conflictIdx];
    const otherVote = conflictIdx === 0 ? conflict.voteB : conflict.voteA;
    if (option === otherVote) {
      setResolved(r => [...r, String(conflictIdx)]);
    }
  }

  const pending = conflicts.filter((_, i) => !resolved.includes(String(i)));
  if (pending.length === 0) return null;

  const conflict = pending[0];
  const conflictIdx = conflicts.indexOf(conflict);

  return (
    <div className="bg-white border border-ct-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-ct-surface-subtle border-b border-ct-border">
        <div className="flex -space-x-1">
          {["img=47","img=12"].map((s, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={`https://i.pravatar.cc/24?${s}`} className="w-6 h-6 rounded-full border-2 border-white object-cover" alt="" />
          ))}
        </div>
        <p className="text-[12px] font-bold text-ct-text">Conflicting preferences</p>
        <span className="ml-auto text-[10px] font-semibold text-[#FF4F17] bg-[#fff2ee] border border-[#ffd4c4] px-2 py-0.5 rounded-full">
          {pending.length} unresolved
        </span>
      </div>
      <div className="px-4 py-3.5 space-y-3">
        <div>
          <p className="text-[11px] text-ct-text-muted mb-0.5">
            <span className="font-semibold text-ct-text">{conflict.travellerB}</span> has already voted
          </p>
          <p className="text-[13px] font-bold text-ct-text">What&apos;s your preference?</p>
        </div>
        <div className="space-y-2">
          {conflict.options.map(opt => {
            const rohanPicked = opt === (conflictIdx === 0 ? conflict.voteB : conflict.voteA);
            const iPicked = votes[conflictIdx] === opt;
            const isMatch = iPicked && rohanPicked;
            return (
              <button
                key={opt}
                onClick={() => vote(conflictIdx, opt)}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all",
                  isMatch ? "border-[#FF4F17] bg-[#fff2ee]"
                    : iPicked ? "border-ct-border-strong bg-ct-surface-raised"
                    : "border-ct-border bg-white hover:border-ct-border-medium hover:bg-ct-surface-subtle"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ct-text">{opt}</p>
                  {rohanPicked && (
                    <p className="text-[10px] text-[#FF4F17] font-medium mt-0.5">
                      {conflict.travellerB} chose this
                    </p>
                  )}
                </div>
                <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                  iPicked ? "border-ct-border-strong bg-ct-text" : "border-ct-border-medium")}>
                  {iPicked && <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </button>
            );
          })}
        </div>
        {votes[conflictIdx] && votes[conflictIdx] !== (conflictIdx === 0 ? conflict.voteB : conflict.voteA) && (
          <div className="bg-ct-surface-subtle border border-ct-border rounded-xl px-3 py-2.5">
            <p className="text-[11px] text-ct-text-secondary font-medium">You and {conflict.travellerB} disagree. Choose a compromise:</p>
            <button className="mt-1.5 text-[11px] font-bold text-[#FF4F17] hover:underline">
              🤝 Let AI find a middle ground →
            </button>
          </div>
        )}
        {resolved.length > 0 && (
          <p className="text-[10px] text-[#22c55e] font-semibold">✓ {resolved.length} preference{resolved.length > 1 ? "s" : ""} matched</p>
        )}
      </div>
    </div>
  );
}

/* ── Plan result view ────────────────────────────────────── */
function PlanResultView({
  onSelectDay, selectedDay, planUpdating, days, setDays, onSwapHighlight, onLogChange,
}: {
  onSelectDay: (day: number) => void;
  selectedDay: number;
  planUpdating: boolean;
  days: DayPlan[];
  setDays: React.Dispatch<React.SetStateAction<DayPlan[]>>;
  onSwapHighlight: (day: number, activityName?: string) => void;
  onLogChange: (label: string, change: string) => void;
}) {
  const [customizingDayId, setCustomizingDayId] = useState<number | null>(null);
  const [swapSegment, setSwapSegment] = useState<SegmentId | null>(null);
  const [showBudgetAlert, setShowBudgetAlert] = useState(true);
  const [showChangeWarning, setShowChangeWarning] = useState(false);
  const [showConflict] = useState(true);
  const [prices, setPrices] = useState({ flights: "₹20,396", hotel: "₹34,000", experiences: "₹8,698" });
  const [totalOver, setTotalOver] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Trigger the booking-change warning whenever planUpdating fires
  useEffect(() => { if (planUpdating) setShowChangeWarning(true); }, [planUpdating]);

  function handleSwap(dayIdx: number, slotIdx: number, newActivity: string) {
    let prevName = "";
    setDays(prev => prev.map((d, i) =>
      i === dayIdx
        ? { ...d, activities: d.activities.map((a, j) => {
            if (j === slotIdx) { prevName = a.name; return { ...a, name: newActivity }; }
            return a;
          }) }
        : d
    ));
    onSwapHighlight(dayIdx + 1, newActivity);
    onLogChange(`Day ${dayIdx + 1} activity swap`, `${prevName || "Activity"} → ${newActivity}`);
  }

  function handleAdd(dayIdx: number, activity: { time: string; name: string; type: ActivityType }) {
    setDays(prev => prev.map((d, i) =>
      i === dayIdx
        ? { ...d, activities: [...d.activities, activity].sort((a, b) => a.time.localeCompare(b.time)) }
        : d
    ));
    onSwapHighlight(dayIdx + 1, activity.name);
    onLogChange(`Day ${dayIdx + 1} activity added`, `+ ${activity.name}`);
  }

  function handleRemove(dayIdx: number, slotIdx: number) {
    let removedName = "";
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      removedName = d.activities[slotIdx]?.name ?? "Activity";
      return { ...d, activities: d.activities.filter((_, j) => j !== slotIdx) };
    }));
    onLogChange(`Day ${dayIdx + 1} activity removed`, `− ${removedName}`);
  }

  function handleAddDay() {
    const lastDay = days[days.length - 1];
    const newDay: DayPlan = {
      ...lastDay,
      day: lastDay.day + 1,
      activities: lastDay.activities.filter(a => a.type !== "flight"),
    };
    setDays(prev => [...prev, newDay]);
    onLogChange("Day added", `Day ${newDay.day} added`);
  }

  function handleSkipDay() {
    if (days.length <= 1) return;
    const dayToRemove = days.find(d => d.day === selectedDay);
    if (!dayToRemove) return;
    setDays(prev => prev.filter(d => d.day !== selectedDay));
    onLogChange("Day removed", `Day ${selectedDay} removed`);
  }

  function handleSegmentSwap(label: string, price: string) {
    if (swapSegment === "hotel") {
      setPrices(p => ({ ...p, hotel: price }));
      onLogChange("Hotel swap", `Hotel → ${label}`);
    }
    if (swapSegment === "flight-out") {
      setPrices(p => ({ ...p, flights: `₹${(parseInt(price.replace(/[^0-9]/g, "")) + parseInt(prices.flights.replace(/[^0-9]/g, "")) / 2).toLocaleString()}` }));
      onLogChange("Flight swap", `Outbound → ${label}`);
    }
    if (swapSegment === "flight-return") {
      onLogChange("Flight swap", `Return → ${label}`);
    }
    setSwapSegment(null);
  }

  function handleBudgetFix() { setTotalOver(false); setShowBudgetAlert(false); }

  const activeDay = days.find(d => d.day === selectedDay);

  return (
    <div className="space-y-4">
      {/* ── Edge case: Mid-booking change warning ── */}
      {showChangeWarning && (
        <BookingChangeWarning onResolve={(id, action) => {
          if (action === "rebook") setTimeout(() => setShowChangeWarning(false), 1200);
        }} />
      )}

      {/* Header */}
      <div className={cn("flex items-center pt-4 justify-between transition-opacity duration-300", planUpdating && "opacity-50")}>
        <div>
          <p className="text-[18px] font-bold text-[#1a1a1a]">Here&apos;s your Bali Itinerary</p>
          <div className="flex items-center gap-2 mt-1">
            {/* <p className={cn("text-[13px] font-semibold", totalOver ? "text-[#ef4444]" : "text-ct-text-muted")}>
              {totalOver ? "₹90,496 · ₹10,496 over budget" : "₹72,896 · ₹7,104 under budget ✓"}
            </p> */}
            <span className="flex items-center gap-1 text-[11px] text-[#22c55e] font-semibold bg-[#dcfce7] border border-[#dcfce7] px-2 py-0.5 rounded-full">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#22c55e"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              4.8 · 127 saves
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3 py-1.5 rounded-full hover:bg-ct-surface-subtle transition-colors">Share</button>
        </div>
      </div>

      {/* Day cards horizontal scroll */}
      <div ref={scrollRef} className={cn("flex gap-3 overflow-x-auto pb-2 transition-opacity duration-300", planUpdating && "opacity-40 pointer-events-none")} style={{ scrollbarWidth: "none" }}>
        {days.map(d => (
          <button
            key={d.day}
            onClick={() => { onSelectDay(d.day); setCustomizingDayId(null); }}
            className={cn(
              "relative flex-none w-[190px] rounded-2xl overflow-hidden border transition-all text-left group shrink-0",
              selectedDay === d.day ? "border-gray-300" : "border-transparent hover:border-ct-border-medium",
            )}
          >
            <div className="relative w-full h-[100px] overflow-hidden bg-ct-surface-deep">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.img} alt={d.location} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-2 left-2.5">
                <span className="text-white text-[10px] font-bold opacity-70">Day {d.day}</span>
                <p className="text-white text-[12px] font-bold leading-tight">{d.location}</p>
              </div>
              {selectedDay === d.day && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </div>
            <div className="bg-white px-3 py-2">
              <p className="text-[10px] text-ct-text-muted">{d.tag}</p>
              <div className="mt-1.5 space-y-0.5">
                {d.activities.slice(0, 2).map((a, i) => (
                  <p key={i} className="text-[10.5px] text-ct-text-secondary flex items-center gap-1.5 leading-tight">
                    <ActivityIcon type={a.type} size={10} />
                    <span className="truncate">{a.name}</span>
                  </p>
                ))}
                {d.activities.length > 2 && <p className="text-[9.5px] text-ct-text-subtle">+{d.activities.length - 2} more</p>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected day detail */}
      {activeDay && (
        <div className="bg-white border border-ct-border rounded-2xl overflow-hidden">
          {/* Day header with hero image */}
          <div className="relative h-[120px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeDay.img} alt={activeDay.location} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 px-4 py-3 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">Day {activeDay.day}</p>
                  <p className="text-white text-[16px] font-bold leading-tight mt-0.5">{activeDay.location}</p>
                  <p className="text-white/70 text-[11px] mt-0.5">{activeDay.tag}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-2.5 py-1">
                  <span className="text-white text-[11px]">{activeDay.detail.weather}</span>
                  <span className="text-white font-bold text-[11px]">{activeDay.detail.temp}</span>
                </div>
              </div>
              <div className="flex gap-1.5">
                {activeDay.detail.highlights.map((h, i) => (
                  <span key={i} className="bg-white/20 backdrop-blur-sm text-white text-[9.5px] font-medium px-2 py-0.5 rounded-full border border-white/30">{h}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="px-4 pt-3 pb-2 border-b border-[#f5f5f5]">
            <p className="text-[12px] text-ct-text-secondary leading-relaxed">{activeDay.detail.description}</p>
          </div>

          {/* Activities */}
          <div className="px-4 py-3 border-b border-[#f5f5f5]">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[10px] font-bold text-ct-text-subtle uppercase tracking-widest">Activities</p>
              <button
                onClick={() => setCustomizingDayId(customizingDayId === activeDay.day ? null : activeDay.day)}
                className={cn(
                  "flex items-center gap-1.5 text-[10.5px] font-semibold px-3 py-1 rounded-full transition-colors border",
                  customizingDayId === activeDay.day
                    ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                    : "text-ct-text-secondary bg-ct-surface-subtle border-ct-border hover:bg-[#ebebeb]"
                )}
              >
                <PencilSimple size={10} />
                {customizingDayId === activeDay.day ? "Done" : "Customise"}
              </button>
            </div>
            <div className="space-y-2.5">
              {activeDay.activities.map((act, i) => {
                const dayIdx = days.findIndex(d => d.day === activeDay.day);
                return (
                  <div key={i} className="group flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#f5f5f5] flex items-center justify-center shrink-0">
                      <ActivityIcon type={act.type} size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight">{act.name}</p>
                      <p className="text-[10.5px] text-ct-text-subtle mt-0.5">{act.time}</p>
                    </div>
                    {act.type !== "flight" && act.type !== "hotel" && (
                      <button
                        onClick={() => handleRemove(dayIdx, i)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-[#fee2e2] flex items-center justify-center shrink-0 transition-opacity hover:bg-[#fecaca]"
                        title="Remove activity"
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inline customizer — expands below activities */}
          {customizingDayId === activeDay.day && (
            <div className="px-4 py-3 border-b border-[#f5f5f5] bg-[#fafafa]">
              <ActivitiesCustomizer
                day={activeDay}
                onSwap={handleSwap}
                onAdd={handleAdd}
                onClose={() => setCustomizingDayId(null)}
              />
            </div>
          )}

          {/* Compact social proof — full reviews are in the map panel */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex -space-x-1.5 shrink-0">
              {activeDay.detail.reviews.map((rev, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={rev.avatar} alt={rev.author} className="w-6 h-6 rounded-full border-2 border-white object-cover" />
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-1">
              <StarRating rating={5} />
              <span className="text-[11px] font-semibold text-[#1a1a1a]">4.8</span>
              <span className="text-[11px] text-ct-text-muted">· {activeDay.detail.reviews[0].author} and {activeDay.detail.reviews.length * 47} others visited</span>
            </div>
            {/* <button
              onClick={() => {}}
              className="shrink-0 text-[10.5px] font-semibold text-[#FF4F17] hover:underline"
            >
              See reviews →
            </button> */}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {/* <div className="flex gap-2 flex-wrap">
        {[
          { label: "Full breakdown", Icon: ListBullets, onClick: undefined },
          { label: "Add a day", Icon: Plus, onClick: handleAddDay },
          { label: "Change dates", Icon: CalendarBlank, onClick: undefined },
          { label: "Skip a day", Icon: SkipForward, onClick: handleSkipDay },
        ].map(({ label, Icon, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            className="flex items-center gap-1.5 text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3 py-1.5 rounded-full hover:bg-ct-surface-subtle hover:border-ct-border-medium transition-colors"
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div> */}
    </div>
  );
}

/* ── Rolling number ─────────────────────────────────────── */
function RollingNumber({ to, run }: { to: number; run: boolean }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run) return;
    const duration = 700;
    const ticks = 35;
    const ms = duration / ticks;
    let n = 0;
    const t = setInterval(() => {
      n++;
      setVal(Math.round((n / ticks) * to));
      if (n >= ticks) clearInterval(t);
    }, ms);
    return () => clearInterval(t);
  }, [run, to]);
  return <>{run ? val.toLocaleString("en-IN") : "0"}</>;
}

/* ── Planning animation ─────────────────────────────────── */
function PlanningMsg({ step }: { step: number }) {
  const allDone = step >= STEPS.length;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (allDone) {
      const t = setTimeout(() => setCollapsed(true), 1400);
      return () => clearTimeout(t);
    }
  }, [allDone]);

  return (
    <div>
      <style>{`
        @keyframes ct-fade-up {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ct-sub-in {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ct-step-in  { animation: ct-fade-up 0.35s ease-out both; }
        .ct-sub-item { animation: ct-sub-in 0.3s ease-out both; }
      `}</style>

      {/* Collapsed summary pill */}
      {allDone && collapsed ? (
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 w-full text-left group"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 text-ct-text-muted">
            <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1"/>
            <path d="M3.5 6.5l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-[11.5px] font-medium text-ct-text-muted flex-1">Done · {STEPS.length} steps completed</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-ct-text-disabled group-hover:text-ct-text-muted transition-colors">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      ) : (
        <>
          {/* "Done" header when expanded after completion */}
          {allDone && (
            <button
              onClick={() => setCollapsed(true)}
              className="flex items-center gap-2 mb-4 w-full text-left group"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 text-ct-text-muted">
                <circle cx="6.5" cy="6.5" r="6" stroke="currentColor" strokeWidth="1"/>
                <path d="M3.5 6.5l2 2 4-4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[11px] font-medium tracking-[0.07em] uppercase text-ct-text-muted flex-1 select-none">Done</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-ct-text-disabled group-hover:text-ct-text-muted transition-colors">
                <path d="M3 7.5l3-3 3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {/* In-progress dots header */}
          {!allDone && (
            <div className="flex items-center gap-2 mb-4">
              <span className="flex gap-[3px] items-center">
                {[0,1,2].map(i => (
                  <span key={i} className="w-[3px] h-[3px] rounded-full bg-[#bbb] animate-bounce" style={{ animationDelay: `${i * 160}ms` }} />
                ))}
              </span>
              <span className="text-[11px] font-medium tracking-[0.07em] uppercase text-ct-text-subtle select-none">Working on it</span>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-3">
            {STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              const pending = i > step;
              return (
                <div
                  key={i}
                  className={cn("ct-step-in transition-opacity duration-400", pending ? "opacity-20" : "opacity-100")}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <s.Icon
                      size={12}
                      className={cn(
                        "shrink-0 transition-colors duration-300",
                        done ? "text-ct-text-disabled" : active ? "text-ct-text-secondary" : "text-ct-text-disabled",
                      )}
                    />
                    <p className={cn(
                      "text-[12px] leading-snug font-medium flex-1 transition-colors duration-300",
                      done ? "text-ct-text-placeholder" : active ? "text-ct-text-secondary" : "text-ct-text-disabled",
                    )}>
                      {active ? (
                        <>{s.label} · <RollingNumber to={s.countTarget} run={active} /></>
                      ) : (
                        s.label
                      )}
                    </p>
                    {done && (
                      <svg width="11" height="11" viewBox="0 0 13 13" fill="none" className="shrink-0">
                        <path d="M2.5 6.5l3 3 5-5.5" stroke="#bbb" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Sub-activities — visible while active, collapse when done */}
                  <div className={cn(
                    "ml-5 overflow-hidden transition-all duration-500 ease-in-out",
                    active ? "max-h-24 opacity-100 mt-1" : "max-h-0 opacity-0 mt-0",
                  )}>
                    {s.subs.map((sub, j) => (
                      <p
                        key={j}
                        className="ct-sub-item text-[10.5px] text-ct-text-muted leading-relaxed"
                        style={{ animationDelay: `${j * 120}ms` }}
                      >
                        {sub}
                      </p>
                    ))}
                  </div>

                  {/* Result — visible when done */}
                  {done && (
                    <p className="mt-0.5 ml-5 text-[11.5px] text-ct-text-secondary font-medium ct-step-in">
                      {s.result}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </>
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

/* ── Trip cost breakdown (collapsible) ──────────────────── */
const BREAKDOWN_ROWS = [
  {
    id: "flights",
    Icon: AirplaneTilt,
    iconColor: "#1a6af4",
    title: "Flights",
    sub: "Delhi ⇌ Bali · May 15 – 19",
    price: "₹20,396",
    priceSub: "for 2 adults",
    detail: [
      { name: "IndiGo 6E-2241 · Outbound", note: "DEL → DPS · 06:25 · Non-stop · 5h 45m", price: "₹9,798" },
      { name: "IndiGo 6E-2244 · Return", note: "DPS → DEL · 19:45 · Non-stop · 5h 45m", price: "₹10,598" },
    ],
  },
  {
    id: "stay",
    Icon: Bed,
    iconColor: "#FF4F17",
    title: "Stay",
    sub: "Taj Fort Aguada · 4 nights",
    price: "₹34,000",
    priceSub: "total",
    detail: [
      { name: "Taj Fort Aguada Resort & Spa", note: "5★ · Seminyak · Breakfast incl.", price: "₹8,500/night" },
    ],
  },
  {
    id: "experiences",
    Icon: Compass,
    iconColor: "#14b8a6",
    title: "Top experiences",
    sub: "Handpicked activities for you",
    price: "₹8,698",
    priceSub: "total",
    detail: [
      { name: "Tegallalang trek", note: "Day 2 · 08:00 · Guided", price: "₹2,400" },
      { name: "Mt. Batur sunrise hike", note: "Day 3 · 04:00 · 2 pax", price: "₹3,200" },
      { name: "Uluwatu Kecak dance", note: "Day 4 · 17:30 · 1h", price: "₹1,500" },
      { name: "Balinese spa", note: "Day 5 · 10:30 · 90 min", price: "₹1,598" },
    ],
  },
];

function TripBreakdown() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="bg-white border border-ct-border rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-ct-border-light flex items-center justify-between bg-[#fafbfd]">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ct-text-subtle font-semibold">Trip total</p>
          <p className="text-[18px] font-bold text-[#1a1a1a] mt-0.5">₹63,094</p>
        </div>
        <div className="text-right">
          <p className="text-[10.5px] text-[#22c55e] font-semibold">₹16,906 under budget</p>
          <p className="text-[10px] text-ct-text-subtle mt-0.5">of ₹80,000</p>
        </div>
      </div>
      {BREAKDOWN_ROWS.map((row, i) => {
        const isOpen = open === row.id;
        return (
          <div key={row.id} className={cn("border-b border-ct-border-light", i === BREAKDOWN_ROWS.length - 1 && "border-b-0")}>
            <button
              onClick={() => setOpen(isOpen ? null : row.id)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#fafbfd] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#fafbfd] border border-ct-border-light flex items-center justify-center shrink-0">
                <row.Icon size={16} color={row.iconColor} weight="duotone" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#1a1a1a] leading-tight">{row.title}</p>
                <p className="text-[11px] text-ct-text-muted mt-0.5 truncate">{row.sub}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-bold text-[#1a1a1a]">{row.price}</p>
                <p className="text-[10px] text-ct-text-subtle">{row.priceSub}</p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className={cn("shrink-0 transition-transform duration-200", isOpen && "rotate-180")}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {isOpen && (
              <div className="px-4 pb-3 bg-[#fafbfd]">
                <div className="border-l-2 border-ct-border pl-3 space-y-2">
                  {row.detail.map((d, di) => (
                    <div key={di} className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-[#1a1a1a] leading-snug">{d.name}</p>
                        <p className="text-[10.5px] text-ct-text-muted mt-0.5">{d.note}</p>
                      </div>
                      <p className="text-[11px] text-ct-text-secondary font-semibold shrink-0">{d.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── PDF generator ──────────────────────────────────────── */
function downloadTripPDF(days: DayPlan[], chipCtx: ChipCtx | null) {
  const dest = chipCtx?.destination || "Bali, Indonesia";
  const dateStr = chipCtx?.dates.start
    ? `${fmtChipDate(chipCtx.dates.start)}${chipCtx.dates.end ? " – " + fmtChipDate(chipCtx.dates.end) : ""}`
    : "May 15 – 19, 2025";
  const travellers = chipCtx ? chipCtx.adults + chipCtx.children : 2;

  const totalBudget = "₹63,094";
  const budgetNote = "₹16,906 under budget";

  const activityTypeLabel: Record<string, string> = {
    hotel: "Stay", beach: "Beach", food: "Dining", nature: "Nature",
    shopping: "Shopping", culture: "Culture", dance: "Performance",
    trek: "Trek / Viewpoint", flight: "Flight", sunset: "Sunset",
    spa: "Spa", walk: "Walk",
  };

  const breakdownRows = [
    { title: "Flights", sub: "Delhi ⇌ Bali · Return · Non-stop", price: "₹20,396", details: [{ name: "IndiGo 6E-2241 — Outbound", note: "DEL → DPS · 06:25 · 5h 45m", price: "₹9,798" }, { name: "IndiGo 6E-2244 — Return", note: "DPS → DEL · 19:45 · 5h 45m", price: "₹10,598" }] },
    { title: "Accommodation", sub: "Taj Fort Aguada Resort · 4 nights", price: "₹34,000", details: [{ name: "Taj Fort Aguada Resort & Spa", note: "5★ · Seminyak · Breakfast included", price: "₹8,500/night" }] },
    { title: "Experiences", sub: "Handpicked activities", price: "₹8,698", details: [{ name: "Tegallalang trek", note: "Day 2 · Guided · 2 pax", price: "₹2,400" }, { name: "Mt. Batur sunrise hike", note: "Day 3 · 04:00 · 2 pax", price: "₹3,200" }, { name: "Uluwatu Kecak dance", note: "Day 4 · 17:30", price: "₹1,500" }, { name: "Balinese spa", note: "Day 5 · 90 min", price: "₹1,598" }] },
  ];

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${dest} Trip Plan</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 11pt;
    color: #1a1a1a;
    background: white;
    line-height: 1.5;
  }
  @page { size: A4; margin: 14mm 16mm; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  .page-wrap { max-width: 720px; margin: 0 auto; padding: 24px 0; }

  /* Header */
  .header { display: flex; align-items: flex-start; justify-content: space-between; padding-bottom: 20px; border-bottom: 2px solid #1a1a1a; margin-bottom: 28px; }
  .header-left .brand { font-size: 9pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #888; margin-bottom: 6px; }
  .header-left .dest { font-size: 26pt; font-weight: 800; color: #1a1a1a; line-height: 1.1; }
  .header-left .meta { font-size: 10pt; color: #555; margin-top: 6px; display: flex; gap: 16px; }
  .header-right { text-align: right; }
  .header-right .total-label { font-size: 9pt; color: #888; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
  .header-right .total { font-size: 22pt; font-weight: 800; color: #1a1a1a; line-height: 1.1; margin-top: 2px; }
  .header-right .saving { font-size: 9pt; font-weight: 600; color: #16a34a; margin-top: 3px; }

  /* Section title */
  .section-title { font-size: 8pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #888; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
  .section-title::after { content: ""; flex: 1; height: 1px; background: #e5e7eb; }

  /* Day cards */
  .day-section { margin-bottom: 20px; page-break-inside: avoid; }
  .day-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .day-badge { width: 26px; height: 26px; border-radius: 50%; background: #1a1a1a; color: white; font-size: 11pt; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .day-title { font-size: 14pt; font-weight: 800; color: #1a1a1a; }
  .day-tag { font-size: 9pt; color: #888; margin-left: 4px; font-weight: 500; }
  .activities-table { width: 100%; border-collapse: collapse; }
  .activities-table tr { border-bottom: 1px solid #f0f0f0; }
  .activities-table tr:last-child { border-bottom: none; }
  .activities-table td { padding: 7px 10px 7px 0; vertical-align: top; }
  .act-time { font-size: 9.5pt; color: #888; font-weight: 600; width: 52px; padding-right: 10px; padding-top: 2px; white-space: nowrap; }
  .act-dot { width: 8px; padding-top: 6px; }
  .act-dot-inner { width: 6px; height: 6px; border-radius: 50%; background: #FF4F17; }
  .act-name { font-size: 11pt; font-weight: 600; color: #1a1a1a; }
  .act-type { display: inline-block; font-size: 8pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #888; background: #f5f5f5; border-radius: 4px; padding: 1px 6px; margin-left: 6px; vertical-align: middle; }
  .act-blurb { font-size: 10pt; color: #666; margin-top: 2px; line-height: 1.4; }

  /* Highlights row */
  .highlights { display: flex; gap: 6px; flex-wrap: wrap; margin: 6px 0 14px 36px; }
  .highlight-pill { font-size: 8.5pt; color: #555; background: #f5f5f5; border-radius: 6px; padding: 3px 9px; }

  /* Separator */
  .section-gap { margin-bottom: 28px; }

  /* Breakdown */
  .breakdown-table { width: 100%; border-collapse: collapse; }
  .breakdown-row { border-bottom: 1px solid #f0f0f0; }
  .breakdown-row td { padding: 9px 0; vertical-align: top; }
  .breakdown-cat { font-size: 11pt; font-weight: 700; color: #1a1a1a; }
  .breakdown-sub { font-size: 9.5pt; color: #888; margin-top: 1px; }
  .breakdown-price { font-size: 11pt; font-weight: 700; color: #1a1a1a; text-align: right; white-space: nowrap; padding-left: 20px; }
  .breakdown-detail { padding: 6px 0 8px 0; background: #fafafa; }
  .breakdown-detail-row { display: flex; justify-content: space-between; font-size: 9.5pt; color: #555; padding: 2px 0; gap: 12px; }
  .breakdown-detail-name { font-weight: 500; }
  .breakdown-detail-note { color: #888; font-size: 9pt; margin-top: 1px; }
  .breakdown-detail-price { color: #1a1a1a; font-weight: 600; white-space: nowrap; }

  /* Total row */
  .total-row td { padding: 12px 0 6px; border-top: 2px solid #1a1a1a; }
  .total-row .breakdown-cat { font-size: 13pt; }
  .total-row .breakdown-price { font-size: 13pt; }

  /* Footer */
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
  .footer-left { font-size: 9pt; color: #888; }
  .footer-right { font-size: 9pt; color: #888; }
  .ct-orange { color: #FF4F17; }

  /* Print button */
  .print-btn { display: inline-flex; align-items: center; gap: 8px; background: #1a1a1a; color: white; font-family: -apple-system, sans-serif; font-size: 13px; font-weight: 600; padding: 10px 20px; border: none; border-radius: 9999px; cursor: pointer; margin-bottom: 24px; }
  .print-btn:hover { background: #333; }
</style>
</head>
<body>
<div class="page-wrap">

  <div class="no-print" style="margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
    <button class="print-btn" onclick="window.print()">
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M224,152v56a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V152a16,16,0,0,1,16-16H56V48A8,8,0,0,1,64,40H192a8,8,0,0,1,8,8v88h8A16,16,0,0,1,224,152ZM72,136H184V56H72Zm104,16H80a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16Z"/></svg>
      Save as PDF
    </button>
    <span style="font-size: 12px; color: #888;">Use your browser's Print dialog &rarr; Save as PDF</span>
  </div>

  <!-- Header -->
  <div class="header">
    <div class="header-left">
      <div class="brand">Cleartrip AI &middot; Trip Plan</div>
      <div class="dest">${dest}</div>
      <div class="meta">
        <span>${dateStr}</span>
        <span>${travellers} traveller${travellers !== 1 ? "s" : ""}</span>
        <span>${chipCtx?.cabinClass || "Economy"}</span>
      </div>
    </div>
    <div class="header-right">
      <div class="total-label">Trip Total</div>
      <div class="total">${totalBudget}</div>
      <div class="saving">${budgetNote}</div>
    </div>
  </div>

  <!-- Day plans -->
  <div class="section-title">Day-by-Day Itinerary</div>
  ${days.map(d => `
    <div class="day-section">
      <div class="day-header">
        <div class="day-badge">${d.day}</div>
        <div>
          <span class="day-title">${d.location}</span>
          <span class="day-tag">&mdash; ${d.tag}</span>
        </div>
      </div>
      <table class="activities-table">
        <tbody>
          ${d.activities.map(a => `
            <tr>
              <td class="act-time">${a.time}</td>
              <td class="act-dot"><div class="act-dot-inner"></div></td>
              <td>
                <div class="act-name">${a.name}<span class="act-type">${activityTypeLabel[a.type] || a.type}</span></div>
                ${a.blurb ? `<div class="act-blurb">${a.blurb}</div>` : ""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="highlights">
        ${d.detail.highlights.map(h => `<span class="highlight-pill">${h}</span>`).join("")}
      </div>
    </div>
  `).join("")}

  <div class="section-gap"></div>

  <!-- Cost Breakdown -->
  <div class="section-title">Cost Breakdown</div>
  <table class="breakdown-table">
    <tbody>
      ${breakdownRows.map(row => `
        <tr class="breakdown-row">
          <td>
            <div class="breakdown-cat">${row.title}</div>
            <div class="breakdown-sub">${row.sub}</div>
            ${row.details.map(d => `
              <div style="margin-top: 6px; padding-left: 0;">
                <div class="breakdown-detail-row">
                  <div>
                    <div class="breakdown-detail-name">${d.name}</div>
                    <div class="breakdown-detail-note">${d.note}</div>
                  </div>
                  <div class="breakdown-detail-price">${d.price}</div>
                </div>
              </div>
            `).join("")}
          </td>
          <td class="breakdown-price">${row.price}</td>
        </tr>
      `).join("")}
      <tr class="total-row">
        <td><div class="breakdown-cat">Total</div></td>
        <td class="breakdown-price">${totalBudget}</td>
      </tr>
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    <div class="footer-left">Generated by <strong>Cleartrip AI</strong> &middot; ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
    <div class="footer-right"><span class="ct-orange">cleartrip.com</span></div>
  </div>

</div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=820,height=900,scrollbars=yes");
  if (!win) return;
  win.document.write(htmlContent);
  win.document.close();
}

/* ── Save / Regenerate changes bar ─────────────────────────── */
function SaveChangesBar({
  changes, mode, onSave, onGenerate,
}: {
  changes: string[];
  mode: "save" | "generate";
  onSave: () => void;
  onGenerate: () => void;
}) {
  const SHOW = 5;
  const visible = changes.slice(-SHOW);
  const overflow = changes.length - SHOW;
  const isGenerate = mode === "generate";

  return (
    <div className={cn(
      "mb-2 bg-white rounded-2xl shadow-sm overflow-hidden border transition-colors",
      isGenerate ? "border-ct-orange/40 ring-1 ring-ct-orange/20" : "border-ct-border",
    )}>
      <div className="flex items-start gap-3 px-4 py-2.5">
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
          isGenerate ? "bg-ct-orange" : "bg-ct-orange",
        )}>
          {isGenerate ? (
            <ArrowsClockwise size={12} weight="bold" color="white" />
          ) : (
            <svg width="12" height="12" viewBox="0 0 256 256" fill="white">
              <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM80,64h96a8,8,0,0,1,0,16H80a8,8,0,0,1,0-16Zm48,128-48-40h20V120h56v32h20Z"/>
            </svg>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-ct-text leading-tight">
            {isGenerate
              ? "Trip details changed — plan needs regenerating"
              : `${changes.length} unsaved change${changes.length !== 1 ? "s" : ""}`}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {visible.map((c, i) => (
              <span
                key={i}
                className={cn(
                  "text-[10px] font-medium rounded-full px-2 py-0.5 truncate max-w-[200px]",
                  isGenerate
                    ? "text-ct-orange bg-[#fff3ef] border border-ct-orange/20"
                    : "text-ct-text-muted bg-ct-surface-subtle",
                )}
              >
                {c}
              </span>
            ))}
            {overflow > 0 && (
              <span className="text-[10px] font-medium text-ct-text-subtle bg-ct-surface-subtle rounded-full px-2 py-0.5">
                +{overflow} more
              </span>
            )}
          </div>
        </div>
        <button
          onClick={isGenerate ? onGenerate : onSave}
          className={cn(
            "shrink-0 flex items-center gap-1.5 text-[11.5px] font-semibold rounded-xl px-3 py-2 transition-colors mt-0.5",
            isGenerate
              ? "bg-ct-orange text-white hover:bg-[#e03d08]"
              : "bg-ct-text text-white hover:bg-ct-action",
          )}
        >
          {isGenerate ? (
            <>
              <ArrowsClockwise size={11} weight="bold" />
              Generate response
            </>
          ) : (
            <>
              <svg width="11" height="11" viewBox="0 0 256 256" fill="currentColor">
                <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM80,64h96a8,8,0,0,1,0,16H80a8,8,0,0,1,0-16Zm48,128-48-40h20V120h56v32h20Z"/>
              </svg>
              Save version
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Regen-preview message bubble (shown in chat after a top-level edit) ── */
function RegenPreview({ diffs }: { diffs: ChipDiff[] }) {
  return (
    <div className="bg-white border border-ct-orange/30 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <div className="w-5 h-5 rounded-md bg-ct-orange/10 flex items-center justify-center">
          <ArrowsClockwise size={11} weight="bold" className="text-ct-orange" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ct-orange">
          Trip detail changed
        </p>
      </div>
      <div className="px-4 pb-3 space-y-2">
        <p className="text-[13px] text-ct-text leading-snug">
          {diffs.length === 1
            ? "This is a top-level change — the whole plan will need to regenerate."
            : "These are top-level changes — the whole plan will need to regenerate."}
        </p>
        <div className="flex flex-col gap-1.5 pt-1">
          {diffs.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px]">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-ct-text-subtle w-[68px] shrink-0">
                {d.label}
              </span>
              <span className="text-ct-text-muted line-through truncate max-w-[140px]">
                {d.from || "—"}
              </span>
              <ArrowRight size={11} className="text-ct-orange shrink-0" weight="bold" />
              <span className="font-semibold text-ct-text truncate">
                {d.to || "—"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[11.5px] text-ct-text-muted pt-1 leading-relaxed">
          Flights, stays and activities will be reshuffled. Tap <span className="font-semibold text-ct-orange">Generate response</span> below to refresh.
        </p>
      </div>
    </div>
  );
}

/* ── Save-trip card ─────────────────────────────────────── */
function SaveTripCard({
  days, chipCtx, isUpdate = false, initialSaved = false, onSave,
}: {
  days: DayPlan[];
  chipCtx: ChipCtx | null;
  isUpdate?: boolean;
  initialSaved?: boolean;
  onSave?: () => void;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const dest = chipCtx?.destination || "Bali, Indonesia";
  const dateStr = chipCtx?.dates.start
    ? `${fmtChipDate(chipCtx.dates.start)}${chipCtx.dates.end ? " – " + fmtChipDate(chipCtx.dates.end) : ""}`
    : "May 15 – 19";
  const totalStops = days.reduce((s, d) => s + d.activities.length, 0);

  return (
    <div className="border border-ct-border bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Header strip */}
      <div className="flex items-center justify-between px-4 py-3 bg-ct-surface-raised border-b border-ct-border-light">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "w-7 h-7 rounded-xl flex items-center justify-center shrink-0",
            saved ? "bg-[#16a34a]" : "bg-ct-orange",
          )}>
            {saved ? (
              <svg width="13" height="13" viewBox="0 0 256 256" fill="white"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 256 256" fill="white"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM80,64h96a8,8,0,0,1,0,16H80a8,8,0,0,1,0-16Zm48,128-48-40h20V120h56v32h20Z"/></svg>
            )}
          </div>
          <div>
            <p className="text-[12px] font-bold text-ct-text">
              {initialSaved ? "Version saved" : isUpdate ? "Plan updated" : saved ? "Trip saved" : "Your plan is ready"}
            </p>
            <p className="text-[10px] text-ct-text-muted mt-0.5">{dest} · {dateStr}</p>
          </div>
        </div>
        {saved && (
          <span className="text-[10px] font-semibold text-[#16a34a] bg-[#f0fdf4] border border-[#bbf7d0] rounded-full px-2.5 py-0.5">Saved</span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x divide-ct-border-light px-0 py-0">
        {[
          { label: "Days", value: String(days.length) },
          { label: "Stops", value: String(totalStops) },
          { label: "Budget", value: "₹63,094" },
        ].map(s => (
          <div key={s.label} className="flex flex-col items-center py-3 gap-0.5">
            <span className="text-[15px] font-bold text-ct-text">{s.value}</span>
            <span className="text-[9.5px] font-semibold uppercase tracking-wider text-ct-text-subtle">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 px-4 py-3 border-t border-ct-border-light">
        <button
          onClick={() => { if (!saved) { setSaved(true); onSave?.(); } }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 text-[12px] font-semibold rounded-xl py-2.5 border transition-all",
            saved
              ? "bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]"
              : "bg-ct-text text-white border-ct-text hover:bg-ct-action-hover",
          )}
        >
          {saved ? (
            <>
              <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"/></svg>
              Trip saved
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM80,64h96a8,8,0,0,1,0,16H80a8,8,0,0,1,0-16Zm48,128-48-40h20V120h56v32h20Z"/></svg>
              Save trip
            </>
          )}
        </button>
        <button
          onClick={() => downloadTripPDF(days, chipCtx)}
          className="flex-1 flex items-center justify-center gap-2 text-[12px] font-semibold rounded-xl py-2.5 border border-ct-border bg-white text-ct-text-secondary hover:border-ct-border-medium hover:bg-ct-surface-subtle transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 256 256" fill="currentColor"><path d="M224,152v56a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V152a16,16,0,0,1,16-16H56V48A8,8,0,0,1,64,40H192a8,8,0,0,1,8,8v88h8A16,16,0,0,1,224,152ZM72,136H184V56H72Zm104,16H80a8,8,0,0,0,0,16h96a8,8,0,0,0,0-16Z"/></svg>
          Download breakdown
        </button>
      </div>
    </div>
  );
}

/* ── Swap-options carousel ─────────────────────────────── */
interface SwapOption {
  name: string; sub: string; desc: string; mentions: number; price: string; img: string; tag?: string;
}

const STAY_OPTIONS: SwapOption[] = [
  { name: "Taj Fort Aguada", sub: "Seminyak · 5★", desc: "Heritage cliff-top resort with private beach access.", mentions: 142, price: "₹8,500/nt", img: "https://picsum.photos/seed/stay-taj/400/300", tag: "Current pick" },
  { name: "W Bali", sub: "Seminyak · 5★", desc: "Design-forward beachfront with rooftop pool and DJ nights.", mentions: 98, price: "₹11,200/nt", img: "https://picsum.photos/seed/stay-w/400/300" },
  { name: "Alaya Resort Ubud", sub: "Ubud · 4★", desc: "Quiet rice-paddy retreat with traditional Balinese spa.", mentions: 76, price: "₹6,200/nt", img: "https://picsum.photos/seed/stay-alaya/400/300" },
  { name: "Katamama Suites", sub: "Seminyak · 5★", desc: "Brick-clad boutique above Potato Head Beach Club.", mentions: 54, price: "₹12,400/nt", img: "https://picsum.photos/seed/stay-kata/400/300" },
];

const ACTIVITY_OPTIONS: SwapOption[] = [
  { name: "Mt. Batur sunrise trek", sub: "Kintamani · 4h", desc: "Pre-dawn hike to watch the sun rise above the clouds.", mentions: 187, price: "₹3,200/pp", img: "https://picsum.photos/seed/act-batur/400/300", tag: "Current pick" },
  { name: "Saturday Night Market", sub: "Seminyak · evening", desc: "Live music, global food stalls, and artisan goods.", mentions: 64, price: "Free entry", img: "https://picsum.photos/seed/act-market/400/300" },
  { name: "Catamaran sunset cruise", sub: "Benoa · 2h", desc: "Sunset sail with onboard tapas and live sax.", mentions: 91, price: "₹2,400/pp", img: "https://picsum.photos/seed/act-cruise/400/300" },
  { name: "Beach yoga & breakfast", sub: "Canggu · sunrise", desc: "60-min vinyasa on the sand with a vegan brunch after.", mentions: 38, price: "₹1,200/pp", img: "https://picsum.photos/seed/act-yoga/400/300" },
  { name: "Ubud cycling tour", sub: "Heritage · 3h", desc: "Pedal between rice paddies and temples with a local guide.", mentions: 42, price: "₹1,600/pp", img: "https://picsum.photos/seed/act-cycle/400/300" },
  { name: "Spice plantation lunch", sub: "Tabanan · 2.5h", desc: "Walk through cardamom and pepper, then a Balinese thali.", mentions: 71, price: "₹1,200/pp", img: "https://picsum.photos/seed/act-spice/400/300" },
];

function SwapCard({ opt, picked, onPick }: { opt: SwapOption; picked: boolean; onPick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn(
        "shrink-0 w-[200px] rounded-xl overflow-hidden border bg-white transition-all",
        picked ? "border-[#FF4F17]" : "border-ct-border hover:border-[#FF4F17]/60",
      )}
    >
      <div className="relative w-full aspect-[4/3] bg-ct-surface-deep overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={opt.img} alt={opt.name} className="w-full h-full object-cover" loading="lazy" />
        {opt.tag && (
          <span className="absolute top-2 left-2 bg-white/95 text-[9.5px] font-semibold text-[#1a1a1a] px-2 py-0.5 rounded-full shadow-sm">
            {opt.tag}
          </span>
        )}
        <div className={cn(
          "absolute top-2 right-2 transition-all duration-200",
          hover || picked ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1",
        )}>
          <button
            onClick={onPick}
            className={cn(
              "flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-full shadow-sm transition-colors",
              picked ? "bg-[#FF4F17] text-white" : "bg-white text-[#1a1a1a] hover:bg-[#FF4F17] hover:text-white",
            )}
          >
            {picked ? (
              <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Added
              </>
            ) : (
              <>+ Add to trip</>
            )}
          </button>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/55 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {opt.price}
        </div>
      </div>
      <div className="p-2.5">
        <p className="text-[12.5px] font-bold text-[#1a1a1a] leading-tight truncate">{opt.name}</p>
        <p className="text-[10.5px] text-ct-text-muted mt-0.5 flex items-center gap-1">
          <MapPin size={9} weight="fill" />
          {opt.sub}
        </p>
        <p className="text-[10.5px] text-ct-text-secondary mt-1.5 leading-snug line-clamp-2">{opt.desc}</p>
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-ct-border-light">
          <div className="flex -space-x-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-3.5 h-3.5 rounded-full border border-white" style={{ background: ["#FF4F17", "#1a1a1a", "#22c55e"][i] }}/>
            ))}
          </div>
          <p className="text-[9.5px] text-ct-text-muted ml-1">
            <span className="font-semibold text-ct-text-secondary">{opt.mentions}</span> travellers recommend
          </p>
        </div>
      </div>
    </div>
  );
}

function SwapCarousel({
  kind, onApply,
}: {
  kind: SwapKind;
  onApply: (opt: SwapOption) => void;
}) {
  const opts = kind === "stay" ? STAY_OPTIONS : ACTIVITY_OPTIONS;
  const [picked, setPicked] = useState<string>(opts[0].name);
  const scrollerRef = useRef<HTMLDivElement>(null);
  function scroll(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  }
  function handlePick(opt: SwapOption) {
    setPicked(opt.name);
    onApply(opt);
  }
  return (
    <div className="bg-white border border-ct-border rounded-2xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <p className="text-[12.5px] font-bold text-[#1a1a1a]">
            {kind === "stay" ? "Swap your stay" : "Customise your activities"}
          </p>
          <p className="text-[10.5px] text-ct-text-muted mt-0.5">
            {kind === "stay" ? "Tap any option to swap into your itinerary." : "Pick the experiences you'd like in — we'll rebuild the day plan."}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => scroll(-1)} className="w-7 h-7 rounded-full border border-ct-border flex items-center justify-center hover:border-[#FF4F17] hover:text-[#FF4F17] text-ct-text-muted transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={() => scroll(1)} className="w-7 h-7 rounded-full border border-ct-border flex items-center justify-center hover:border-[#FF4F17] hover:text-[#FF4F17] text-ct-text-muted transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {opts.map(opt => (
          <div key={opt.name} className="snap-start">
            <SwapCard opt={opt} picked={picked === opt.name} onPick={() => handlePick(opt)} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Rich visual card responses ─────────────────────────── */
interface RichCard {
  img: string;
  title: string;
  sub: string;
  desc: string;
  meta?: string;
  price?: string;
  badge?: string;
}

const SAVINGS_CARDS: RichCard[] = [
  { img: "https://picsum.photos/seed/save-hotel/300/220", title: "Switch to Alaya Resort Ubud", sub: "4★ · pool villa · 4 nights", desc: "Quiet rice-paddy retreat ten minutes from Ubud centre. Same breakfast inclusion.", meta: "Currently: Taj Fort Aguada", price: "− ₹9,200", badge: "Save ₹9,200" },
  { img: "https://picsum.photos/seed/save-flight/300/220", title: "Switch to AirAsia I5-764", sub: "1 stop · 7h 20m · Outbound", desc: "Same-day arrival, one short layover at Kuala Lumpur.", meta: "Currently: IndiGo non-stop", price: "− ₹2,598", badge: "Save ₹2,598" },
  { img: "https://picsum.photos/seed/save-activity/300/220", title: "Drop the catamaran cruise", sub: "Day 4 · 2h sunset", desc: "Replace with a free Jimbaran beach evening — same vibe, no ticket cost.", meta: "Optional removal", price: "− ₹2,400", badge: "Save ₹2,400" },
];

const ADVENTURE_CARDS: RichCard[] = [
  { img: "https://picsum.photos/seed/adv-rafting/300/220", title: "Ayung river white-water rafting", sub: "Ubud · 2.5h · Class II–III", desc: "12km of rapids through jungle gorges, lunch included.", meta: "Recommended for Day 2", price: "₹2,200/pp" },
  { img: "https://picsum.photos/seed/adv-atv/300/220", title: "Jungle ATV quad-bike tour", sub: "Payangan · 2h", desc: "Rip through paddy trails, river crossings and muddy tracks.", meta: "Good fit for Day 3", price: "₹3,400/pp" },
  { img: "https://picsum.photos/seed/adv-canyon/300/220", title: "Aling-Aling waterfall canyoning", sub: "North Bali · half-day", desc: "Slide and jump down four natural waterfalls with a guide.", meta: "Add to Day 3", price: "₹2,800/pp" },
  { img: "https://picsum.photos/seed/adv-surf/300/220", title: "Uluwatu surf lesson", sub: "Padang Padang · 2h", desc: "Beginner-friendly reef break with board and rashguard.", meta: "Add to Day 4", price: "₹1,800/pp" },
];

const CAFE_CARDS: RichCard[] = [
  { img: "https://picsum.photos/seed/cafe-revolver/300/220", title: "Revolver Espresso", sub: "Seminyak · ★ 4.7", desc: "Saloon-style café known for the best flat white on the island.", meta: "Order: short black + banana bread", price: "~₹450" },
  { img: "https://picsum.photos/seed/cafe-yellow/300/220", title: "Yellow Flower Café", sub: "Ubud · ★ 4.8", desc: "Hilltop garden café with jungle views and a vegan brunch menu.", meta: "Order: nasi campur + turmeric latte", price: "~₹600" },
  { img: "https://picsum.photos/seed/cafe-crate/300/220", title: "Crate Café", sub: "Canggu · ★ 4.6", desc: "Surfer-favourite spot with huge portions and €2 coffees.", meta: "Order: big breakfast + cold brew", price: "~₹500" },
  { img: "https://picsum.photos/seed/cafe-koral/300/220", title: "Kafe Batan Waru", sub: "Ubud · ★ 4.5", desc: "Heritage Indonesian recipes in a colonial-style courtyard.", meta: "Order: bebek betutu (roasted duck)", price: "~₹900" },
  { img: "https://picsum.photos/seed/cafe-hideout/300/220", title: "The Shady Shack", sub: "Canggu · ★ 4.7", desc: "All-vegetarian café overlooking the rice fields.", meta: "Order: epic salad bowl", price: "~₹550" },
];

const PACE_CARDS: RichCard[] = [
  { img: "https://picsum.photos/seed/pace-spa/300/220", title: "Add a spa rest morning · Day 2", sub: "Ubud · 09:00", desc: "Replace the trek with a 90-min Balinese massage and breakfast in bed.", meta: "Frees 4h of buffer", price: "+ ₹1,800/pp" },
  { img: "https://picsum.photos/seed/pace-pool/300/220", title: "Add a pool day · Day 3", sub: "Hotel pool · all day", desc: "Skip the volcano hike and unwind by the resort lagoon pool.", meta: "Frees 6h of buffer", price: "Included in stay" },
  { img: "https://picsum.photos/seed/pace-late/300/220", title: "Late starts every day", sub: "Push 1st activity to 10:00", desc: "Move morning blocks back so you never wake before 09:00.", meta: "Re-times all 5 days", price: "Free to apply" },
];

const CARD_SETS: Record<CardSet, { title: string; sub: string; data: RichCard[]; cta: string }> = {
  savings: {
    title: "Three swaps that save you ₹14,200",
    sub: "Pick any to apply — your itinerary stays intact.",
    data: SAVINGS_CARDS,
    cta: "Apply",
  },
  adventure: {
    title: "More adventure, on-route",
    sub: "Each option fits a free slot in your existing days.",
    data: ADVENTURE_CARDS,
    cta: "Add to trip",
  },
  cafes: {
    title: "Top-rated cafés in Bali",
    sub: "Highest-rated spots travellers add to Bali itineraries.",
    data: CAFE_CARDS,
    cta: "Add stop",
  },
  pace: {
    title: "Three ways to slow it down",
    sub: "Pick what fits — I'll re-time the days on the map.",
    data: PACE_CARDS,
    cta: "Apply",
  },
};

function RichCards({ set, onApply }: { set: CardSet; onApply: (card: RichCard) => void }) {
  const cfg = CARD_SETS[set];
  const [picked, setPicked] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  function scroll(dir: 1 | -1) {
    scrollerRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  }
  function handlePick(card: RichCard) {
    setPicked(card.title);
    onApply(card);
  }
  return (
    <div className="bg-white border border-ct-border rounded-2xl p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-2.5 gap-2">
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-[#1a1a1a]">{cfg.title}</p>
          <p className="text-[10.5px] text-ct-text-muted mt-0.5">{cfg.sub}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => scroll(-1)} className="w-7 h-7 rounded-full border border-ct-border flex items-center justify-center hover:border-[#FF4F17] hover:text-[#FF4F17] text-ct-text-muted transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button onClick={() => scroll(1)} className="w-7 h-7 rounded-full border border-ct-border flex items-center justify-center hover:border-[#FF4F17] hover:text-[#FF4F17] text-ct-text-muted transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
      <div ref={scrollerRef} className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
        {cfg.data.map(card => {
          const isPicked = picked === card.title;
          return (
            <div key={card.title} className="snap-start shrink-0 w-[220px]">
              <div className={cn(
                "rounded-xl overflow-hidden border bg-white transition-all h-full flex flex-col",
                isPicked ? "border-[#FF4F17] shadow-md" : "border-ct-border hover:border-[#FF4F17]/60 hover:shadow-md",
              )}>
                <div className="relative w-full aspect-[4/3] bg-ct-surface-deep overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={card.img} alt={card.title} className="w-full h-full object-cover" loading="lazy" />
                  {card.badge && (
                    <span className="absolute top-2 left-2 bg-[#22c55e] text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {card.badge}
                    </span>
                  )}
                  {card.price && (
                    <div className="absolute bottom-2 right-2 bg-black/55 backdrop-blur-sm text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {card.price}
                    </div>
                  )}
                </div>
                <div className="p-2.5 flex-1 flex flex-col">
                  <p className="text-[12.5px] font-bold text-[#1a1a1a] leading-tight">{card.title}</p>
                  <p className="text-[10.5px] text-ct-text-muted mt-0.5 flex items-center gap-1">
                    <MapPin size={9} weight="fill" />
                    {card.sub}
                  </p>
                  <p className="text-[10.5px] text-ct-text-secondary mt-1.5 leading-snug line-clamp-2">{card.desc}</p>
                  {card.meta && (
                    <p className="text-[9.5px] text-ct-text-muted mt-1.5 italic line-clamp-1">{card.meta}</p>
                  )}
                  <button
                    onClick={() => handlePick(card)}
                    className={cn(
                      "mt-2 w-full text-[10.5px] font-semibold py-1.5 rounded-full transition-colors",
                      isPicked
                        ? "bg-[#FF4F17] text-white"
                        : "bg-ct-surface-subtle text-[#1a1a1a] border border-ct-border hover:bg-[#FF4F17] hover:text-white hover:border-[#FF4F17]",
                    )}
                  >
                    {isPicked ? "✓ Applied" : cfg.cta}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Quick replies (suggestion chips above input) ─────── */
const QUICK_REPLIES = [
  "Show flights",
  "Multi-stay hotels",
  "Make it cheaper",
  "Add more adventure",
  "Best cafes in Bali?",
  "Customise activities",
  "Slower pace",
];

function QuickReplies({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-2 px-0.5"
      style={{ scrollbarWidth: "none" }}
    >
      {QUICK_REPLIES.map(s => (
        <button
          key={s}
          onClick={() => onPick(s)}
          className="shrink-0 text-[12px] font-medium text-ct-text-secondary bg-white border border-ct-border hover:border-[#FF4F17] hover:text-[#FF4F17] hover:bg-[#fff3ef] px-3 py-1.5 rounded-full transition-colors whitespace-nowrap"
        >
          {s}
        </button>
      ))}
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

/* ── Relative time helper ─────────────────────────────────── */
function fmtRelTime(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const s = Math.floor(diff / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
function fmtClock(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/* ── Version history panel ────────────────────────────────── */
function VersionHistoryPanel({
  versions, currentVersionId, hasActiveChat, lastChangeNote, unsavedChanges, chipCtx, days,
  onRestore, onNew, onClose,
}: {
  versions: Version[];
  currentVersionId: string | null;
  hasActiveChat: boolean;
  lastChangeNote: string;
  unsavedChanges: string[];
  chipCtx: ChipCtx | null;
  days: DayPlan[];
  onRestore: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"versions" | "trips">("versions");
  const [, force] = useState(0);
  // Refresh relative timestamps every 30s
  useEffect(() => {
    const t = setInterval(() => force(n => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const latestId = versions.length ? versions[versions.length - 1].id : null;
  const isLiveCurrent = currentVersionId === null || currentVersionId === latestId;
  const totalStops = days.reduce((s, d) => s + d.activities.length, 0);
  const dest = chipCtx?.destination || "Bali, Indonesia";
  const ordered = [...versions].reverse();

  return (
    <div className="w-[280px] lg:w-[272px] shrink-0 flex flex-col bg-white border-r border-ct-border h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ct-border-light">
        <div className="flex items-center gap-2 min-w-0">
          <ClockCounterClockwise size={17} weight="bold" className="text-[#1a1a1a] shrink-0" />
          <span className="text-[15px] font-bold text-[#1a1a1a] truncate">Versions</span>
          {versions.length > 0 && (
            <span className="text-[11px] font-bold bg-ct-surface-deep text-ct-action-icon rounded-full px-2 py-0.5">
              {versions.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onNew}
            title="Start a new chat"
            className="w-7 h-7 flex items-center justify-center rounded-full text-ct-text-subtle hover:bg-ct-surface-subtle hover:text-ct-text-secondary transition-colors"
          >
            <Plus size={13} weight="bold" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full text-ct-text-subtle hover:bg-ct-surface-subtle hover:text-ct-text-secondary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-2.5 gap-5 border-b border-ct-border-light">
        {(["versions", "trips"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "pb-2.5 text-[12.5px] font-semibold capitalize border-b-2 transition-colors",
              tab === t ? "border-ct-border-strong text-ct-text-ui" : "border-transparent text-ct-text-subtle hover:text-ct-text-secondary",
            )}
          >
            {t === "versions" ? "This chat" : "Trips"}
          </button>
        ))}
      </div>

      {/* Versions tab */}
      {tab === "versions" && (
        <>
          {!hasActiveChat ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 pb-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-ct-surface-subtle flex items-center justify-center">
                <ClockCounterClockwise size={26} className="text-ct-text-disabled" weight="bold" />
              </div>
              <p className="text-[13px] text-ct-text-secondary font-semibold">No chat yet</p>
              <p className="text-[11.5px] text-ct-text-subtle leading-snug -mt-1.5">
                Start planning a trip — saved versions of your plan will appear here.
              </p>
              <button
                onClick={onNew}
                className="flex items-center gap-1.5 text-[12px] text-ct-text-secondary border border-ct-border px-3.5 py-1.5 rounded-full hover:bg-ct-surface-subtle hover:border-ct-border-medium transition-colors font-medium mt-1"
              >
                <Plus size={12} weight="bold" />
                New chat
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: "thin" }}>
              {/* Current state — always pinned at top */}
              <p className="text-[10px] font-semibold text-ct-text-subtle uppercase tracking-wider px-1 mb-2">
                Current
              </p>
              <div
                className={cn(
                  "relative rounded-xl border px-3 py-2.5 mb-3",
                  isLiveCurrent
                    ? "bg-ct-surface-raised border-ct-border"
                    : "bg-white border-dashed border-ct-border-medium",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex w-2 h-2 shrink-0">
                    <span className={cn(
                      "absolute inline-flex w-full h-full rounded-full opacity-60 animate-ping",
                      isLiveCurrent ? "bg-[#16a34a]" : "bg-ct-text-subtle",
                    )} />
                    <span className={cn(
                      "relative inline-flex w-2 h-2 rounded-full",
                      isLiveCurrent ? "bg-[#16a34a]" : "bg-ct-text-subtle",
                    )} />
                  </span>
                  <p className="text-[12.5px] font-bold text-ct-text leading-none">
                    {isLiveCurrent ? "Live state" : "Previewing past version"}
                  </p>
                </div>
                <p className="text-[11.5px] text-ct-text-secondary mt-1.5 leading-snug truncate">
                  {dest} · {days.length} days · {totalStops} stops
                </p>
                <p className="text-[10.5px] text-ct-text-muted mt-0.5">
                  {isLiveCurrent
                    ? unsavedChanges.length > 0
                      ? `${unsavedChanges.length} unsaved edit${unsavedChanges.length === 1 ? "" : "s"} · ${lastChangeNote}`
                      : versions.length === 0
                        ? "Save your plan to capture the first version"
                        : "All changes saved"
                    : "Restore to make this the live state"}
                </p>
                {isLiveCurrent && unsavedChanges.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {unsavedChanges.slice(-3).map((c, i) => (
                      <span
                        key={i}
                        className="text-[10px] text-ct-text-secondary bg-white border border-ct-border-light rounded-full px-1.5 py-0.5 leading-none truncate max-w-[210px]"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Saved versions list */}
              {versions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ct-border px-4 py-5 flex flex-col items-center text-center gap-1.5">
                  <FloppyDisk size={18} className="text-ct-text-disabled" weight="bold" />
                  <p className="text-[12px] font-semibold text-ct-text-secondary">No saved versions yet</p>
                  <p className="text-[10.5px] text-ct-text-subtle leading-snug">
                    Tap <span className="font-semibold text-ct-text-secondary">Save trip</span> in the chat to capture a snapshot you can return to.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 mb-2">
                    <p className="text-[10px] font-semibold text-ct-text-subtle uppercase tracking-wider">
                      Saved versions
                    </p>
                    <span className="text-[10px] text-ct-text-subtle">Newest first</span>
                  </div>
                  <ol className="relative space-y-1.5">
                    {/* Vertical timeline rail */}
                    <span className="absolute left-[15px] top-1.5 bottom-1.5 w-px bg-ct-border-light" aria-hidden />
                    {ordered.map((v) => {
                      const isActive = v.id === currentVersionId;
                      const isLatest = v.id === latestId;
                      return (
                        <li key={v.id} className="relative group">
                          <div
                            className={cn(
                              "relative rounded-xl border pl-9 pr-2.5 py-2.5 transition-all",
                              isActive
                                ? "bg-ct-surface-raised border-ct-border-strong"
                                : "bg-white border-transparent hover:bg-ct-surface-subtle hover:border-ct-border-light",
                            )}
                          >
                            {/* Timeline dot */}
                            <span
                              className={cn(
                                "absolute left-2.5 top-3 w-[11px] h-[11px] rounded-full border-2 bg-white",
                                isActive
                                  ? "border-ct-border-strong"
                                  : isLatest
                                    ? "border-[#16a34a]"
                                    : "border-ct-border-medium",
                              )}
                            />
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-[12.5px] font-semibold text-ct-text leading-tight truncate">
                                {v.label}
                              </p>
                              <span className="text-[10px] font-mono text-ct-text-subtle shrink-0">
                                v{v.n}
                              </span>
                            </div>
                            <p className="text-[11px] text-ct-text-muted mt-0.5 leading-snug truncate">
                              {v.daysCount} days · {v.stopsCount} stops · {v.budget}
                            </p>
                            {v.changes.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {v.changes.slice(0, 2).map((c, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] text-ct-text-secondary bg-ct-surface-deep rounded-full px-1.5 py-0.5 leading-none truncate max-w-[170px]"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] text-ct-text-subtle">
                                {fmtClock(v.ts)} · {fmtRelTime(v.ts)}
                              </span>
                              {isActive ? (
                                <span className="text-[9.5px] font-semibold uppercase tracking-wider text-ct-text-ui bg-ct-surface-deep rounded-full px-1.5 py-0.5">
                                  Active
                                </span>
                              ) : (
                                <button
                                  onClick={() => onRestore(v.id)}
                                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 flex items-center gap-1 text-[10.5px] font-semibold text-ct-text-ui border border-ct-border rounded-full px-2 py-0.5 hover:bg-white hover:border-ct-border-medium transition-all"
                                >
                                  <ArrowUUpLeft size={10} weight="bold" />
                                  Restore
                                </button>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </>
              )}
            </div>
          )}
        </>
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
    <div className="w-full lg:w-[360px] shrink-0 border-l border-ct-border bg-white h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
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
          <p className="text-[13px] font-medium text-[#1a1a1a]">Inspiration for you</p>
          <button className="text-[11px] font-semibold text-ct-text-secondary border border-ct-border px-2.5 py-0.5 rounded-lg hover:bg-ct-surface-subtle transition-colors shrink-0 ml-2">
            Explore
          </button>
        </div>

        {/* Tabs */}
        {/* <div className="flex gap-1.5 mb-3 flex-wrap">
          {(["All", "Blogs", "Videos", "Itineraries"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setInspiTab(tab)}
              className={cn(
                "text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors",
                inspiTab === tab
                  ? "bg-[#1a1a1a] text-white border-[#1a1a1a]"
                  : "text-ct-text-secondary border-ct-border hover:bg-ct-surface-subtle",
              )}
            >
              {tab}
            </button>
          ))}
        </div> */}

        <div className="grid grid-cols-2 gap-2.5">
          {filtered.map((item, i) => (
            <a
              key={i}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group cursor-pointer"
            >
              {/* image */}
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden">
                <Image src={item.img} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                <span className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full">
                  {item.placeCount} places
                </span>
              </div>
              {/* meta */}
              <div className="mt-1.5 px-0.5">
                <p className="text-[11px] font-semibold text-[#1a1a1a] leading-tight truncate">{item.title}</p>
                <div className="flex items-center gap-0.5 mt-0.5">
                  <svg width="9" height="9" viewBox="0 0 10 12" fill="none" className="shrink-0 text-ct-text-muted">
                    <path d="M5 0C3.07 0 1.5 1.57 1.5 3.5c0 2.63 3.5 7 3.5 7s3.5-4.37 3.5-7C8.5 1.57 6.93 0 5 0zm0 4.75a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" fill="currentColor"/>
                  </svg>
                  <p className="text-[9.5px] text-ct-text-muted truncate">{item.location}</p>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="relative w-4 h-4 rounded-full overflow-hidden shrink-0 border border-white ring-1 ring-ct-border">
                    <Image src={item.creatorAvatar} alt={item.creator} fill className="object-cover" sizes="16px" />
                  </div>
                  <p className="text-[9.5px] text-ct-text-muted truncate">{item.creator}</p>
                </div>
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
        <div className="grid grid-cols-2 gap-2">
          {COMMUNITY.map((post, i) => (
            <div key={i} className="cursor-pointer group">
              <div className="relative rounded-xl overflow-hidden aspect-[4/3]">
                <Image src={post.img} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="160px" />
              </div>
              <p className="mt-1.5 text-[11px] text-[#1a1a1a] font-medium leading-snug line-clamp-1">{post.title}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <div className="relative w-3.5 h-3.5 rounded-full overflow-hidden shrink-0 ring-1 ring-ct-border">
                  <Image src={post.avatar} alt={post.user} fill className="object-cover" sizes="14px" />
                </div>
                <p className="text-[9.5px] text-ct-text-muted truncate">{post.user}</p>
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
const MONTH_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAY_ABR = ["S","M","T","W","T","F","S"];
function fmtHdr(iso: string) {
  const [, m, d] = iso.split("-");
  return `${MONTH_ABR[parseInt(m)-1]} ${parseInt(d)}`;
}

function HeaderMiniCalendar({ year, month, selected, onDayClick }: {
  year: number; month: number;
  selected: { start: string; end: string };
  onDayClick: (iso: string) => void;
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
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 mb-1">
        {DAY_ABR.map((d, i) => (
          <div key={i} className="text-center text-[9.5px] text-ct-text-disabled font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const s = iso(d);
          const isStart = s === selected.start;
          const isEnd = s === selected.end;
          const inRange = selected.start && selected.end && s > selected.start && s < selected.end;
          const past = new Date(year, month, d) < todayMidnight;
          return (
            <button
              key={i}
              disabled={past}
              onClick={() => onDayClick(s)}
              className={cn(
                "h-7 text-[11px] font-medium rounded-full transition-colors",
                past && "text-ct-text-disabled cursor-not-allowed",
                !past && !isStart && !isEnd && !inRange && "text-ct-text hover:bg-[#fff3ef]",
                inRange && "bg-[#fff3ef] text-ct-orange rounded-none",
                (isStart || isEnd) && "bg-ct-orange text-white",
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WhenChipPanel({ ctx, onCtxChange, onClose }: {
  ctx: ChipCtx;
  onCtxChange: (updated: ChipCtx) => void;
  onClose: () => void;
}) {
  const initial = useMemo(() => {
    if (ctx.dates.start) {
      const [y, m] = ctx.dates.start.split("-");
      return { year: parseInt(y), month: parseInt(m) - 1 };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, [ctx.dates.start]);
  const [calYear, setCalYear] = useState(initial.year);
  const [calMonth, setCalMonth] = useState(initial.month);
  const [mode, setMode] = useState<"exact" | "flexible">(ctx.dateMode === "flexible" || ctx.quickPick ? "flexible" : "exact");

  function handleDayClick(iso: string) {
    const d = ctx.dates;
    if (!d.start || (d.start && d.end)) {
      onCtxChange({ ...ctx, quickPick: "", dateMode: "exact", dates: { start: iso, end: "" } });
    } else if (iso < d.start) {
      onCtxChange({ ...ctx, quickPick: "", dateMode: "exact", dates: { start: iso, end: d.start } });
    } else {
      onCtxChange({ ...ctx, quickPick: "", dateMode: "exact", dates: { start: d.start, end: iso } });
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

  return (
    <div className="absolute top-full left-[80px] mt-2 z-50 w-72 bg-white border border-[#e8e8e8] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#f5f5f5] flex items-center justify-between">
        <p className="text-[13px] font-bold text-[#1a1a1a]">Travel dates</p>
        <button onClick={onClose} className="text-ct-text-disabled hover:text-ct-text-muted text-lg leading-none">×</button>
      </div>
      <div className="px-4 py-3 space-y-3">
        <div className="relative flex gap-0 p-1 bg-ct-surface-subtle rounded-xl">
          {(["exact", "flexible"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 py-1.5 text-[11.5px] font-semibold rounded-lg transition-colors",
                mode === m ? "bg-white shadow-sm text-ct-text" : "text-ct-text-subtle",
              )}
            >
              {m === "exact" ? "Exact dates" : "I'm flexible"}
            </button>
          ))}
        </div>

        {mode === "exact" ? (
          <>
            {(ctx.dates.start || ctx.dates.end) && (
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex-1 text-center py-1.5 rounded-lg border text-[12px]",
                  ctx.dates.start ? "border-ct-orange bg-[#fff3ef] text-ct-orange font-semibold" : "border-ct-border text-ct-text-disabled",
                )}>
                  {ctx.dates.start ? fmtHdr(ctx.dates.start) : "Depart"}
                </div>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                <div className={cn(
                  "flex-1 text-center py-1.5 rounded-lg border text-[12px]",
                  ctx.dates.end ? "border-ct-orange bg-[#fff3ef] text-ct-orange font-semibold" : "border-ct-border text-ct-text-disabled",
                )}>
                  {ctx.dates.end ? fmtHdr(ctx.dates.end) : "Return"}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-ct-surface-subtle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span className="text-[12px] font-semibold text-ct-text">{MONTH_FULL[calMonth]} {calYear}</span>
              <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-ct-surface-subtle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            <HeaderMiniCalendar year={calYear} month={calMonth} selected={ctx.dates} onDayClick={handleDayClick} />
            {(ctx.dates.start || ctx.dates.end) && (
              <button
                onClick={() => onCtxChange({ ...ctx, dates: { start: "", end: "" } })}
                className="w-full text-[11px] text-ct-text-disabled hover:text-ct-text-muted transition-colors py-1"
              >Clear dates</button>
            )}
          </>
        ) : (
          <div className="flex flex-wrap gap-1.5">
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
        )}

        <button
          onClick={onClose}
          className="w-full py-2 text-[12px] font-semibold text-white bg-ct-action hover:bg-ct-action-hover rounded-xl transition-colors"
        >Done</button>
      </div>
    </div>
  );
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
    <div ref={ref} className="relative hidden items-center gap-1.5 min-w-0 flex-1 md:flex">
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
        <WhenChipPanel ctx={ctx} onCtxChange={onCtxChange} onClose={() => setOpen(null)} />
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

/* ── Place detail panel (tabbed) ─────────────────────────── */
type DetailTab = "overview" | "guides" | "stays" | "restaurants" | "things" | "reviews";

function PlaceDetailPanel({
  day, tab, setTab, onClose, onSelectOtherDay, otherDays,
}: {
  day: DayPlan;
  tab: DetailTab;
  setTab: (t: DetailTab) => void;
  onClose: () => void;
  onSelectOtherDay: (day: number) => void;
  otherDays: DayPlan[];
}) {
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(true); // already in trip
  const detail = day.detail;
  const gallery = detail.gallery ?? [day.img];
  const region = detail.region ?? "Bali, Indonesia";
  const mentioned = detail.mentionedBy ?? 24;
  const avatars = detail.recommenderAvatars ?? detail.reviews.map(r => r.avatar);

  const tabs: { id: DetailTab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "guides", label: "Guides" },
    { id: "stays", label: "Stays" },
    { id: "restaurants", label: "Restaurants" },
    { id: "things", label: "Things to do" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-white" style={{ scrollbarWidth: "thin" }}>
      {/* Hero */}
      <div className="relative h-[220px] shrink-0 bg-ct-surface-deep">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={day.img} alt={day.location} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top action row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#1a1a1a] flex items-center justify-center shadow-sm transition-colors"
            aria-label="Close"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLiked(v => !v)}
              className={cn(
                "h-8 px-3 rounded-full flex items-center gap-1.5 text-[11px] font-semibold shadow-sm transition-colors",
                liked ? "bg-[#FF4F17] text-white" : "bg-white/95 text-[#1a1a1a] hover:bg-white",
              )}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              {liked ? "Saved" : "Save"}
            </button>
            <button
              onClick={() => setAdded(v => !v)}
              className={cn(
                "h-8 px-3 rounded-full flex items-center gap-1.5 text-[11px] font-semibold shadow-sm transition-colors",
                added ? "bg-white/95 text-[#1a1a1a] hover:bg-white" : "bg-[#FF4F17] text-white",
              )}
            >
              {added ? (
                <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> In trip</>
              ) : (
                <>+ Add to trip</>
              )}
            </button>
            <button className="w-8 h-8 rounded-full bg-white/95 hover:bg-white text-[#1a1a1a] flex items-center justify-center shadow-sm transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block bg-[#FF4F17] text-white text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1.5">Day {day.day}</span>
            <p className="text-white text-[22px] font-bold leading-tight">{day.location}</p>
            <p className="text-white/80 text-[11px] mt-0.5 flex items-center gap-1">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
              {region}
            </p>
          </div>
          <button className="shrink-0 text-[10.5px] font-semibold text-white bg-black/40 backdrop-blur-sm border border-white/30 px-2.5 py-1 rounded-full hover:bg-black/55 transition-colors whitespace-nowrap">
            Show all photos
          </button>
        </div>
      </div>

      {/* Mentioned-by row */}
      <div className="px-4 py-3 border-b border-ct-border-light flex items-center gap-2.5">
        <div className="flex -space-x-1.5">
          {avatars.slice(0, 4).map((a, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={a} alt="" className="w-7 h-7 rounded-full border-2 border-white object-cover" />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] text-[#1a1a1a]">
            <span className="font-semibold">{detail.reviews[0]?.author ?? "Mohammed Alhrabi"}</span>
            <span className="text-ct-text-muted">, {detail.reviews[1]?.author ?? "Waqar Alam"} and </span>
            <span className="font-semibold">{mentioned - 2} others</span>
            <span className="text-ct-text-muted"> mentioned this place</span>
          </p>
        </div>
        <button className="shrink-0 text-[10.5px] font-semibold text-[#1a1a1a] bg-white border border-ct-border px-2.5 py-1 rounded-full hover:bg-ct-surface-subtle transition-colors flex items-center gap-1 whitespace-nowrap">
          Recommend stays
        </button>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b border-ct-border-light">
        <div className="flex gap-4 px-4 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "py-3 text-[12px] font-semibold whitespace-nowrap border-b-2 transition-colors -mb-px",
                tab === t.id
                  ? "border-[#FF4F17] text-[#1a1a1a]"
                  : "border-transparent text-ct-text-muted hover:text-[#1a1a1a]",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="px-4 py-4">
        {tab === "overview" && (
          <div className="space-y-4">
            <p className="text-[12.5px] text-ct-text-secondary leading-relaxed">{detail.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {detail.highlights.map((h, i) => (
                <span key={i} className="bg-ct-surface-subtle text-ct-text-secondary text-[10px] font-medium px-2.5 py-1 rounded-full border border-ct-border-light">{h}</span>
              ))}
            </div>
            {gallery.length > 1 && (
              <div>
                <p className="text-[10px] font-bold text-ct-text-subtle uppercase tracking-widest mb-2">Photos</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {gallery.slice(0, 6).map((g, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-ct-surface-deep">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={g} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-[10px] font-bold text-ct-text-subtle uppercase tracking-widest mb-2">Today&apos;s plan</p>
              <div className="space-y-2">
                {day.activities.map((act, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-ct-surface-raised rounded-xl border border-ct-border-light">
                    <div className="w-6 h-6 rounded-lg bg-white border border-ct-border-light flex items-center justify-center shrink-0">
                      <ActivityIcon type={act.type} size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] font-semibold text-[#1a1a1a] truncate">{act.name}</p>
                      <p className="text-[10px] text-ct-text-subtle">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-ct-text-subtle uppercase tracking-widest mb-2">Other stops on this trip</p>
              <div className="flex gap-1.5 flex-wrap">
                {otherDays.map(d => (
                  <button
                    key={d.day}
                    onClick={() => onSelectOtherDay(d.day)}
                    className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ct-text-secondary border border-ct-border px-2.5 py-1 rounded-full hover:bg-ct-surface-subtle transition-colors"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#FF4F17] flex items-center justify-center text-white text-[8px] font-bold shrink-0">{d.day}</div>
                    {d.location}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "guides" && (
          <div className="space-y-3">
            {(detail.guides ?? []).map((g, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded-xl border border-ct-border-light hover:border-ct-border-medium transition-colors cursor-pointer">
                <div className="relative w-[88px] aspect-[4/3] rounded-lg overflow-hidden bg-ct-surface-deep shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.img} alt={g.title} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold text-[#FF4F17] uppercase tracking-wider">Guide · {g.readTime}</p>
                  <p className="text-[12.5px] font-semibold text-[#1a1a1a] mt-0.5 leading-snug line-clamp-2">{g.title}</p>
                  <p className="text-[10.5px] text-ct-text-muted mt-1">by {g.author}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "stays" && (
          <div className="space-y-3">
            {(detail.stays ?? []).map((s, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded-xl border border-ct-border-light hover:border-ct-border-medium transition-colors">
                <div className="relative w-[88px] aspect-[4/3] rounded-lg overflow-hidden bg-ct-surface-deep shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.img} alt={s.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-[#1a1a1a] leading-snug">{s.name}</p>
                  <p className="text-[10.5px] text-ct-text-muted mt-0.5">{s.sub}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF4F17"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <span className="text-[11px] font-bold text-[#1a1a1a]">{s.rating}</span>
                    </div>
                    <span className="text-[10.5px] text-ct-text-muted">·</span>
                    <span className="text-[11px] font-bold text-[#1a1a1a]">{s.price}</span>
                  </div>
                </div>
                <button className="self-center shrink-0 text-[10.5px] font-semibold text-[#1a1a1a] border border-ct-border px-2.5 py-1 rounded-full hover:bg-ct-surface-subtle transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "restaurants" && (
          <div className="space-y-3">
            {(detail.restaurants ?? []).map((r, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded-xl border border-ct-border-light hover:border-ct-border-medium transition-colors">
                <div className="relative w-[88px] aspect-[4/3] rounded-lg overflow-hidden bg-ct-surface-deep shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.img} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-[#1a1a1a] leading-snug">{r.name}</p>
                  <p className="text-[10.5px] text-ct-text-muted mt-0.5">{r.cuisine}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF4F17"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <span className="text-[11px] font-bold text-[#1a1a1a]">{r.rating}</span>
                    </div>
                    <span className="text-[10.5px] text-ct-text-muted">· {r.price}</span>
                  </div>
                </div>
                <button className="self-center shrink-0 text-[10.5px] font-semibold text-[#1a1a1a] border border-ct-border px-2.5 py-1 rounded-full hover:bg-ct-surface-subtle transition-colors">
                  Book
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "things" && (
          <div className="grid grid-cols-2 gap-2.5">
            {(detail.thingsToDo ?? []).map((t, i) => (
              <div key={i} className="rounded-xl overflow-hidden border border-ct-border-light hover:border-ct-border-medium transition-colors group cursor-pointer">
                <div className="relative aspect-[4/3] bg-ct-surface-deep overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.img} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-2">
                  <p className="text-[11.5px] font-semibold text-[#1a1a1a] leading-tight line-clamp-2">{t.name}</p>
                  <p className="text-[10px] text-ct-text-muted mt-0.5">{t.sub}</p>
                  <p className="text-[9.5px] text-ct-text-subtle mt-1">
                    <span className="font-semibold text-ct-text-secondary">{t.mentions}</span> recommend
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "reviews" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <StarRating rating={5} />
              <span className="text-[14px] font-bold text-[#1a1a1a]">4.8</span>
              <span className="text-[11px] text-ct-text-muted">· {detail.reviews.length * 47} reviews on this place</span>
            </div>
            {detail.reviews.map((rev, i) => (
              <div key={i} className="bg-ct-surface-raised border border-ct-border-light rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={rev.avatar} alt={rev.author} className="w-6 h-6 rounded-full object-cover border border-ct-border-light" />
                  <span className="text-[11.5px] font-bold text-[#1a1a1a]">{rev.author}</span>
                  <StarRating rating={rev.rating} />
                  <span className="text-[9.5px] text-ct-text-subtle ml-auto">{rev.date}</span>
                </div>
                <p className="text-[11.5px] text-ct-text-secondary leading-relaxed">&ldquo;{rev.text}&rdquo;</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Stop detail panel (per-pin details) ─────────────────── */
type StopKindMeta = {
  label: string;
  tagline: string;
  Icon: React.ComponentType<{ size?: number; className?: string; weight?: "regular" | "fill" | "bold" }>;
};

function getStopKindMeta(type: ActivityType): StopKindMeta {
  switch (type) {
    case "sunset":   return { label: "Sunset point",      tagline: "Best at golden hour — arrive an hour before drop.",         Icon: SunHorizon };
    case "trek":     return { label: "Viewpoint & trek",  tagline: "Elevated panorama. Bring layers, water and grip shoes.",    Icon: Mountains };
    case "nature":   return { label: "Nature spot",       tagline: "Lush trail or sanctuary. Move slowly, stay on the path.",   Icon: Tree };
    case "food":     return { label: "Restaurant",        tagline: "Reservation recommended. Ask for the chef's special.",      Icon: ForkKnife };
    case "beach":    return { label: "Beach",             tagline: "Calmest in the late afternoon. Watch the rip current.",     Icon: Waves };
    case "culture":  return { label: "Culture & temple",  tagline: "Modest dress required. A sarong is usually provided.",      Icon: Church };
    case "dance":    return { label: "Performance",       tagline: "Open seating. Arrive 20 minutes early for a good row.",     Icon: MusicNote };
    case "shopping": return { label: "Shopping",          tagline: "Bargain politely — start at about 40% of the asking price.",Icon: ShoppingBag };
    case "spa":      return { label: "Spa",               tagline: "Book ahead. Allow 30 min buffer for tea and cool-down.",    Icon: Sparkle };
    case "walk":     return { label: "Walk",              tagline: "Easy stroll. Mornings are quieter and cooler.",             Icon: Footprints };
    case "hotel":    return { label: "Stay",              tagline: "Show your booking at reception. Late check-in is fine.",    Icon: Bed };
    case "flight":   return { label: "Travel",            tagline: "Reach the gate 90 min before departure.",                   Icon: AirplaneTilt };
    default:         return { label: "Stop", tagline: "Tap for the full guide.", Icon: Compass };
  }
}

function StopDetailPanel({
  activity, day, onClose, onPrev, onNext, hasPrev, hasNext,
}: {
  activity: DayActivity;
  day: DayPlan;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}) {
  const meta = getStopKindMeta(activity.type);
  const stop = STOP_DETAILS[activity.name];
  const description = stop?.description ?? activity.blurb ?? meta.tagline;
  const facts: StopFact[] = stop?.facts ?? [
    ...(activity.time ? [{ label: "Time", value: activity.time }] : []),
    { label: "Type", value: meta.label },
    { label: "Day", value: `Day ${day.day}` },
    { label: "Area", value: day.location },
  ];
  const gallery = stop?.gallery ?? (activity.img ? [activity.img] : []);
  const mentioned = stop?.mentionedBy ?? activity.mentionedBy ?? 24;

  type ListSection = { label: string; items: string[]; Icon: React.ComponentType<{ size?: number; className?: string }> };
  const sections: ListSection[] = [];
  if (stop?.bestVantage)       sections.push({ label: "Best vantage",        items: [stop.bestVantage],   Icon: SunHorizon });
  if (stop?.mustOrder?.length) sections.push({ label: "Must order",          items: stop.mustOrder,       Icon: ForkKnife });
  if (stop?.rules?.length)     sections.push({ label: "Etiquette",           items: stop.rules,           Icon: Church });
  if (stop?.whatToBring?.length) sections.push({ label: "What to bring",     items: stop.whatToBring,     Icon: Backpack });
  if (stop?.amenities?.length) sections.push({ label: "Amenities",           items: stop.amenities,       Icon: Sparkle });
  if (stop?.whatToBuy?.length) sections.push({ label: "What to buy",         items: stop.whatToBuy,       Icon: ShoppingBag });
  if (stop?.showtimes?.length) sections.push({ label: "Showtimes",           items: stop.showtimes,       Icon: CalendarBlank });
  if (stop?.tips?.length)      sections.push({ label: "Insider tips",        items: stop.tips,            Icon: Sparkle });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white">
      {/* Hero */}
      <div className="relative shrink-0 h-[200px] bg-ct-surface-deep overflow-hidden">
        {gallery[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gallery[0]} alt={activity.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/20" />
        <button
          onClick={onClose}
          className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur text-[11px] font-semibold text-[#1a1a1a] px-2.5 py-1.5 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Map
        </button>
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[10px] font-bold uppercase tracking-wider text-[#1a1a1a] px-2.5 py-1 rounded-full shadow-sm">
            <meta.Icon size={11} weight="bold" />
            {meta.label}
          </span>
        </div>
        <div className="absolute left-4 right-4 bottom-3 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
            Day {day.day} · Stop · {activity.time}
          </p>
          <p className="text-[18px] font-bold leading-tight mt-0.5">{activity.name}</p>
          <p className="text-[11.5px] text-white/85 mt-0.5">{day.location}</p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
        <div className="px-4 pt-4 pb-5 space-y-5">
          <p className="text-[12.5px] text-ct-text-secondary leading-relaxed">{description}</p>

          {/* Facts grid */}
          {facts.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {facts.map((f, i) => (
                <div key={i} className="rounded-xl border border-ct-border-light bg-ct-surface-raised px-3 py-2">
                  <p className="text-[9.5px] font-semibold uppercase tracking-wider text-ct-text-subtle">{f.label}</p>
                  <p className="text-[12px] font-semibold text-[#1a1a1a] mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Gallery */}
          {gallery.length > 1 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ct-text-subtle mb-2">Gallery</p>
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {gallery.map((src, i) => (
                  <div key={i} className="relative shrink-0 w-[120px] aspect-[4/3] rounded-lg overflow-hidden bg-ct-surface-deep">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Type-specific sections */}
          {sections.map((s, i) => (
            <div key={i}>
              <div className="flex items-center gap-1.5 mb-2">
                <s.Icon size={13} className="text-ct-action-icon" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ct-text-subtle">{s.label}</p>
              </div>
              <ul className="space-y-1.5">
                {s.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-2 text-[12px] text-ct-text-secondary leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-ct-text-subtle shrink-0" />
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Reviews */}
          {stop?.reviews?.length ? (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <ChatCircle size={13} className="text-ct-action-icon" />
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ct-text-subtle">Recent reviews</p>
              </div>
              <div className="space-y-2.5">
                {stop.reviews.map((rev, i) => (
                  <div key={i} className="border border-ct-border-light rounded-xl p-3 bg-white">
                    <div className="flex items-center gap-2 mb-1.5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={rev.avatar} alt={rev.author} className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-[11.5px] font-bold text-[#1a1a1a]">{rev.author}</span>
                      <StarRating rating={rev.rating} />
                      <span className="text-[9.5px] text-ct-text-subtle ml-auto">{rev.date}</span>
                    </div>
                    <p className="text-[11.5px] text-ct-text-secondary leading-relaxed">&ldquo;{rev.text}&rdquo;</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Mentioned-by */}
          <div className="flex items-center gap-2 pt-1">
            <div className="flex">
              {(stop?.recommenderAvatars ?? ["https://i.pravatar.cc/40?img=12","https://i.pravatar.cc/40?img=23","https://i.pravatar.cc/40?img=44"]).slice(0,3).map((a, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={a} alt="" className="w-6 h-6 rounded-full border-2 border-white object-cover" style={{ marginLeft: i === 0 ? 0 : -8 }} />
              ))}
            </div>
            <p className="text-[11px] text-ct-text-muted">
              Recommended by <span className="text-[#1a1a1a] font-bold">{mentioned}</span> travellers
            </p>
          </div>
        </div>
      </div>

      {/* Footer nav */}
      <div className="shrink-0 border-t border-ct-border-light px-3 py-2.5 flex items-center gap-2 bg-white">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-1 text-[11.5px] font-semibold text-ct-text-secondary border border-ct-border rounded-full px-3 py-1.5 hover:border-ct-border-medium hover:bg-ct-surface-subtle transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-ct-border"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Prev stop
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="ml-auto flex items-center gap-1 text-[11.5px] font-semibold text-white bg-[#1a1a1a] hover:bg-ct-action-hover rounded-full px-3 py-1.5 transition-colors disabled:opacity-40"
        >
          Next stop
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  );
}

/* ── Map panel ───────────────────────────────────────────── */
function MapPanel({
  selectedDay, onSelectDay, days, pulseDay, changedActivityKey, onMobileClose,
}: {
  selectedDay: number;
  onSelectDay: (day: number) => void;
  days: DayPlan[];
  pulseDay?: number;
  changedActivityKey?: string;
  onMobileClose?: () => void;
}) {
  const mapDays = days.map(d => ({
    day: d.day,
    location: d.location,
    lat: d.lat,
    lng: d.lng,
    img: d.img,
    tag: d.tag,
    region: d.detail.region,
    blurb: d.detail.description,
    mentionedBy: d.detail.mentionedBy,
  }));
  const activeDay = days.find(d => d.day === selectedDay);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedStopKey, setSelectedStopKey] = useState<string | null>(null);
  const dayActivities = activeDay
    ? activeDay.activities
        .filter(a => a.lat != null && a.lng != null)
        .map((a, i) => {
          const meta = getStopKindMeta(a.type);
          return {
            key: `${activeDay.day}-${i}-${a.name}`,
            name: a.name,
            lat: a.lat as number,
            lng: a.lng as number,
            img: a.img,
            time: a.time,
            blurb: a.blurb,
            mentionedBy: a.mentionedBy,
            kind: a.type,
            kindLabel: meta.label,
            srcIndex: i,
          };
        })
    : [];

  const selectedStopIdx = selectedStopKey ? dayActivities.findIndex(a => a.key === selectedStopKey) : -1;
  const selectedStop = selectedStopIdx >= 0 && activeDay ? activeDay.activities[dayActivities[selectedStopIdx].srcIndex] : null;

  const [detailTab, setDetailTab] = useState<"overview" | "guides" | "stays" | "restaurants" | "things" | "reviews">("overview");

  function handleDaySelect(day: number) {
    onSelectDay(day);
    setShowDetail(false);
    setSelectedStopKey(null);
  }
  function openDetail(day: number) {
    onSelectDay(day);
    setShowDetail(true);
    setSelectedStopKey(null);
    setDetailTab("overview");
  }
  function openStop(key: string) {
    setSelectedStopKey(key);
    setShowDetail(false);
  }

  return (
    <div className="w-full h-full lg:w-[380px] shrink-0 border-l border-ct-border flex flex-col bg-white">
      {/* Map header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-ct-border-light shrink-0">
        <div className="flex items-center gap-2">
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              aria-label="Close map"
              className="lg:hidden w-7 h-7 flex items-center justify-center rounded-full hover:bg-ct-surface-subtle text-ct-text-secondary"
            >
              <X size={14} />
            </button>
          )}
          <div className="w-6 h-6 rounded-lg bg-ct-action-active flex items-center justify-center">
            <MapPin size={13} color="white" weight="fill" />
          </div>
          <span className="text-[14px] font-bold text-[#1a1a1a]">Trip Map</span>
        </div>
        {(showDetail || selectedStop) ? (
          <button
            onClick={() => { setShowDetail(false); setSelectedStopKey(null); }}
            className="text-[11px] text-ct-text-muted hover:text-[#1a1a1a] transition-colors flex items-center gap-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            Map
          </button>
        ) : (
          <span className="text-[11px] text-ct-text-subtle">Bali, Indonesia</span>
        )}
      </div>

      {selectedStop && activeDay ? (
        <StopDetailPanel
          activity={selectedStop}
          day={activeDay}
          onClose={() => setSelectedStopKey(null)}
          onPrev={() => {
            if (selectedStopIdx > 0) setSelectedStopKey(dayActivities[selectedStopIdx - 1].key);
          }}
          onNext={() => {
            if (selectedStopIdx < dayActivities.length - 1) setSelectedStopKey(dayActivities[selectedStopIdx + 1].key);
          }}
          hasPrev={selectedStopIdx > 0}
          hasNext={selectedStopIdx < dayActivities.length - 1}
        />
      ) : showDetail && activeDay ? (
        /* ── Rich place detail panel (tabs + gallery) ─── */
        <PlaceDetailPanel
          day={activeDay}
          tab={detailTab}
          setTab={setDetailTab}
          onClose={() => setShowDetail(false)}
          onSelectOtherDay={d => openDetail(d)}
          otherDays={days.filter(d => d.day !== selectedDay)}
        />
      ) : (
        <>
          {/* Leaflet map */}
          <div className="flex-1 relative min-h-0">
            <TripMap
              days={mapDays}
              selectedDay={selectedDay}
              onSelectDay={handleDaySelect}
              onPinClick={openDetail}
              onActivityClick={openStop}
              selectedActivityKey={selectedStopKey ?? undefined}
              mode="day"
              dayActivities={dayActivities}
              pulseDay={pulseDay}
              changedActivityKey={changedActivityKey}
            />
            {activeDay && (
              <button
                onClick={() => openDetail(activeDay.day)}
                className="absolute top-3 left-3 right-3 flex items-center gap-2 bg-white/95 backdrop-blur-sm rounded-xl border border-ct-border-light shadow-sm px-3 py-2 hover:shadow-md transition-all text-left"
              >
                <div className="w-7 h-7 rounded-full bg-[#FF4F17] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                  {activeDay.day}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-bold text-[#1a1a1a] leading-tight">Day {activeDay.day} · {activeDay.location}</p>
                  <p className="text-[10px] text-ct-text-muted leading-tight">{dayActivities.length} stops · tap to view place details</p>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            )}
          </div>

          {/* Other stops in this day */}
          {activeDay && dayActivities.length > 0 && (
            <div className="shrink-0 border-t border-ct-border-light px-4 py-3 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <ListBullets size={11} className="text-ct-text-subtle" />
                  <p className="text-[10px] font-semibold text-ct-text-subtle uppercase tracking-wider">Day {activeDay.day} stops</p>
                </div>
                <span className="text-[10px] text-ct-text-muted">{dayActivities.length} stops · tap for details</span>
              </div>
              <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
                {dayActivities.map((a, i) => {
                  const meta = getStopKindMeta(a.kind as ActivityType);
                  const isSelected = selectedStopKey === a.key;
                  const justChanged = changedActivityKey === a.key;
                  return (
                    <button
                      key={a.key}
                      onClick={() => openStop(a.key)}
                      className={cn(
                        "flex-none w-[124px] rounded-xl overflow-hidden border bg-white text-left transition-all hover:shadow-sm",
                        isSelected
                          ? "border-ct-orange ring-2 ring-ct-orange/15"
                          : justChanged
                            ? "border-ct-orange shadow-md"
                            : "border-ct-border-light hover:border-ct-border-medium",
                      )}
                    >
                      <div className="relative w-full aspect-[4/3] bg-ct-surface-deep overflow-hidden">
                        {a.img && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.img} alt={a.name} className="w-full h-full object-cover" loading="lazy" />
                        )}
                        <div className={cn(
                          "absolute top-1.5 left-1.5 w-4 h-4 rounded-full text-white text-[8.5px] font-bold flex items-center justify-center",
                          isSelected ? "bg-ct-orange" : "bg-ct-text",
                        )}>{i + 1}</div>
                        <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 bg-white/95 backdrop-blur text-[8.5px] font-bold uppercase tracking-wider text-ct-text px-1.5 py-0.5 rounded-full shadow-sm">
                          <meta.Icon size={9} weight="bold" />
                          {meta.label}
                        </span>
                      </div>
                      <div className="px-2 py-1.5">
                        <p className="text-[9.5px] text-ct-text-muted">{a.time}</p>
                        <p className="text-[10.5px] font-semibold text-ct-text leading-tight line-clamp-2 mt-0.5">{a.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Day legend */}
          <div className="shrink-0 border-t border-ct-border-light bg-ct-surface-raised px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <MapPin size={11} className="text-ct-text-subtle" weight="fill" />
                <p className="text-[10px] font-semibold text-ct-text-subtle uppercase tracking-wider">Route</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] text-ct-text-muted">
                Click a pin for details
                <ArrowRight size={10} />
              </span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {BALI_PLAN.map((d, i) => {
                const isActive = selectedDay === d.day;
                return (
                  <div key={d.day} className="flex items-center">
                    <button
                      onClick={() => handleDaySelect(d.day)}
                      className={cn(
                        "flex-none flex flex-col items-center gap-1 px-3 py-2 rounded-xl border bg-white transition-colors",
                        isActive
                          ? "border-ct-orange ring-2 ring-ct-orange/15"
                          : "border-ct-border-light hover:border-ct-border-medium",
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors",
                        isActive ? "bg-ct-orange text-white" : "bg-ct-text text-white",
                      )}>
                        {d.day}
                      </div>
                      <span className={cn(
                        "text-[9.5px] font-medium whitespace-nowrap",
                        isActive ? "text-ct-text" : "text-ct-text-secondary",
                      )}>{d.location}</span>
                    </button>
                    {i < BALI_PLAN.length - 1 && (
                      <div className="w-2 h-px bg-ct-border-medium mx-0.5 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main chat area ─────────────────────────────────────── */
function ChatArea({
  stage, msgs, isTyping, planStep, planUpdating, currentQ, qIdx, selected,
  onStart, onPick, onAnswer, onSkip, chipCtx, onChipChange, onNewChat, selectedDay, onSelectDay, endRef,
  days, setDays, onSwapHighlight, onResultsMessage, onSwapApply, onCardApply, onSaveTrip, onLogChange,
  hasSaved, unsavedChanges, regenPending, onRegenerate,
  onOpenMobileSidebar, onOpenMobileMap,
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
  days: DayPlan[];
  setDays: React.Dispatch<React.SetStateAction<DayPlan[]>>;
  onSwapHighlight: (day: number, activityName?: string) => void;
  onResultsMessage: (txt: string) => void;
  onSwapApply: (kind: SwapKind, opt: SwapOption) => void;
  onCardApply: (set: CardSet, card: RichCard) => void;
  onSaveTrip: () => void;
  onLogChange: (label: string, change: string) => void;
  hasSaved: boolean;
  unsavedChanges: string[];
  regenPending: boolean;
  onRegenerate: () => void;
  onOpenMobileSidebar?: () => void;
  onOpenMobileMap?: () => void;
}) {
  const showCard = (stage === "q1" || stage === "q2" || stage === "q3") && currentQ !== null;

  function sendFree(txt: string, chipState?: ChipCtx) {
    onStart(txt, chipState);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#fafafa] w-full lg:w-auto">
      {/* Top bar */}
      <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-3 bg-white border-b border-ct-border shrink-0">
        {/* Mobile hamburger */}
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Open menu"
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full border border-ct-border text-ct-text-secondary hover:bg-ct-surface-subtle shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>
        </button>
        {chipCtx && (
          <HeaderTripChips ctx={chipCtx} onCtxChange={onChipChange} onNewChat={onNewChat} />
        )}
        <div className="flex items-center gap-2 ml-auto shrink-0">
         
          {stage === "results" && (
            <button
              onClick={onOpenMobileMap}
              aria-label="Open map"
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full border border-ct-border text-ct-text-secondary hover:bg-ct-surface-subtle shrink-0"
            >
              <MapPin size={15} />
            </button>
          )}
          <button className="hidden sm:inline-flex text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3.5 py-1.5 rounded-full hover:bg-ct-surface-subtle transition-colors">
            Invite
          </button>
          <button className="hidden md:flex items-center gap-1.5 text-[12px] font-semibold text-ct-text-secondary border border-ct-border px-3.5 py-1.5 rounded-full hover:bg-ct-surface-subtle transition-colors">
            <Globe size={13} className="text-ct-action-icon" />
            English
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
          </button>
        </div>
      </div>

      {/* Messages scroll area */}
      <div className="flex-1 overflow-y-auto pb-6" style={{ scrollbarWidth: "thin" }}>
        {/* Idle / welcome state */}
        {stage === "idle" && (
          <div>
            {/* Hero banner with landscape background */}
            <div className="relative w-full overflow-hidden">
              {/* Background image */}
              <div
                aria-hidden
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/landscape.png')" }}
              />
              {/* Soft white wash on top for legibility */}
              <div
                aria-hidden
                className="absolute inset-0 bg-white/35"
              />
              {/* Bottom gradient that blends banner into page background */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent via-[#fafafa]/85 to-[#fafafa]"
              />
              {/* Subtle vignette on the left for text legibility */}
              <div
                aria-hidden
                className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-white/85 via-white/50 to-transparent"
              />

              {/* Hero content */}
              <div className="relative max-w-[760px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-12 sm:pb-16">
                <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold tracking-[0.06em] uppercase text-ct-orange bg-white/85 backdrop-blur-sm rounded-full px-2.5 py-1 mb-4">
                  <Sparkle size={10} weight="fill" />
                  AI travel concierge
                </div>
                <h1 className="text-[24px] sm:text-[30px] font-medium text-[#1a1a1a] leading-[1.1] tracking-tight">
                  Hey there, <span className="bg-gradient-to-r from-ct-orange to-[#ff7a3d] bg-clip-text text-transparent">Traveller</span>
                  {/* <span
                    aria-hidden
                    className="inline-block ml-2 ct-wave-hand rotate-45"
                  >
                    👋
                  </span> */}
                </h1>
                {/* <p className="text-[20px] font-medium text-gray-700 mt-1">Where would you like to go?</p> */}
                <p className="text-[13.5px] text-ct-text-secondary mt-4 leading-relaxed max-w-[460px]">
                  Pick a starter below or describe your dream trip ~ <br/> I&apos;ll handle the flights, stays, days and budget.
                </p>
              </div>
            </div>

            {/* Page body — pulled up to overlap the banner's gradient blend */}
            <div className="max-w-[760px] mx-auto px-4 sm:px-6 -mt-8 relative pb-2">

            {/* Featured trip starters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {/* Bali featured card */}
              <button
                onClick={() => sendFree(
                  "Plan my Bali trip — 5 days, 2 travellers, mix of beaches, culture and food.",
                  {
                    destination: "Bali, Indonesia",
                    dateMode: "exact",
                    dates: { start: "", end: "" },
                    quickPick: "Beach + Culture",
                    adults: 2,
                    children: 0,
                    cabinClass: "Economy",
                    budgetPreset: "mid",
                    budgetRange: [40000, 80000],
                  } as ChipCtx,
                )}
                className="group relative overflow-hidden rounded-2xl text-left bg-gradient-to-br from-ct-orange-light to-[#fff5ed] border border-ct-orange-border hover:border-ct-orange transition-all"
              >
                <div className="absolute -bottom-3 -right-3 w-[150px] h-[150px] opacity-95 pointer-events-none transition-transform duration-500 group-hover:scale-105 group-hover:rotate-1">
                  <Image src="/car-polaroid.png" alt="" fill className="object-contain object-bottom-right" sizes="150px" />
                </div>
                <div className="relative px-4 pt-4 pb-5 min-h-[168px] flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.06em] uppercase text-ct-orange mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-ct-orange animate-pulse" />
                    Trending · 1.2k travellers
                  </div>
                  <p className="text-[18px] font-bold text-[#1a1a1a] leading-tight max-w-[200px]">
                    Plan my <br /> Bali trip
                  </p>
                  <p className="text-[11.5px] text-ct-text-secondary mt-1.5 max-w-[180px] leading-snug">
                    5 days · 2 cities · beaches, ricefields, sunsets
                  </p>
                  <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-ct-text">
                    Start planning
                    <ArrowRight size={12} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>

              {/* Random trip card */}
              <button
                onClick={() => {
                  const picks: { destination: string; quickPick: string; budgetPreset: string; budgetRange: [number, number]; teaser: string }[] = [
                    { destination: "Lisbon, Portugal",  quickPick: "Coastal & food", budgetPreset: "mid",    budgetRange: [60000, 110000], teaser: "miradouros, tiles and trams" },
                    { destination: "Kyoto, Japan",      quickPick: "Culture & nature", budgetPreset: "mid",  budgetRange: [80000, 140000], teaser: "temples, tea and bamboo" },
                    { destination: "Reykjavik, Iceland",quickPick: "Adventure",      budgetPreset: "luxury", budgetRange: [120000, 200000], teaser: "glaciers, geysers and aurora" },
                    { destination: "Marrakech, Morocco",quickPick: "Markets & desert", budgetPreset: "mid",  budgetRange: [45000, 90000],   teaser: "souks, riads and dunes" },
                    { destination: "Queenstown, NZ",    quickPick: "Adventure",      budgetPreset: "luxury", budgetRange: [120000, 200000], teaser: "lakes, peaks and bungee" },
                    { destination: "Cape Town, SA",     quickPick: "Coastal & wine", budgetPreset: "mid",   budgetRange: [70000, 120000],  teaser: "beaches, wineries and Table Mountain" },
                  ];
                  const pick = picks[Math.floor(Math.random() * picks.length)];
                  sendFree(
                    `Surprise me — let's plan a ${pick.destination.split(",")[0]} trip. Vibe: ${pick.quickPick}.`,
                    {
                      destination: pick.destination,
                      dateMode: "exact",
                      dates: { start: "", end: "" },
                      quickPick: pick.quickPick,
                      adults: 2,
                      children: 0,
                      cabinClass: "Economy",
                      budgetPreset: pick.budgetPreset,
                      budgetRange: pick.budgetRange,
                    } as ChipCtx,
                  );
                }}
                className="group relative overflow-hidden rounded-2xl text-left bg-gradient-to-br from-[#eef4ff] to-[#f6efff] border border-[#dbe5ff] hover:border-[#a8b8e8] transition-all"
              >
                <div className="absolute -bottom-2 -right-2 w-[150px] h-[150px] opacity-95 pointer-events-none transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-1">
                  <Image src="/car-travel.png" alt="" fill className="object-contain object-bottom-right" sizes="150px" />
                </div>
                <div className="relative px-4 pt-4 pb-5 min-h-[168px] flex flex-col">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.06em] uppercase text-[#5b6db5] mb-2">
                    <Sparkle size={10} weight="fill" />
                    Feeling spontaneous?
                  </div>
                  <p className="text-[18px] font-bold text-[#1a1a1a] leading-tight max-w-[210px]">
                    Plan a <br /> random trip
                  </p>
                  <p className="text-[11.5px] text-ct-text-secondary mt-1.5 max-w-[200px] leading-snug">
                    Let AI roll the dice on a destination, vibe and budget.
                  </p>
                  <span className="mt-auto pt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-ct-text">
                    Surprise me
                    <ArrowRight size={12} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            </div>

            {/* Quick starter chips */}
            <div className="relative rounded-2xl border border-ct-border-light bg-white overflow-hidden flex items-stretch min-h-[96px]">
              {/* Left-side image with right-edge fade to white */}
              <div aria-hidden className="absolute inset-y-0 right-0 w-[32%] pointer-events-none select-none">
                <Image
                  src="/house.png"
                  alt=""
                  fill
                  className="object-cover object-[center_70%]"
                  sizes="(max-width: 768px) 50vw, 320px"
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to left, rgba(255,255,255,0) 2%, rgba(255,255,255,0.85) 78%, #ffffff 100%)",
                  }}
                />
              </div>
              {/* Content */}
              <div className="relative max-w-[600px] flex-1 px-4 py-3.5">
                <p className="text-[12px] font-medium text-ct-text leading-tight pl-2 pb-3">Quick starters</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[
                    "Weekend escape from Mumbai",
                    "Solo trip · under ₹50k",
                    "Family vacation · 7 days",
                    "Honeymoon · beach + spa",
                    "First-time Europe · 10 days",
                  ].map(label => (
                    <button
                      key={label}
                      onClick={() => sendFree(label)}
                      className="text-[11.5px] font-medium text-ct-text-secondary bg-white border border-ct-border rounded-full px-2.5 py-1 hover:border-ct-border-medium hover:bg-ct-surface-subtle transition-colors"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {/* Active conversation */}
        {stage !== "idle" && (
          <div className="max-w-[620px] mx-auto space-y-5 px-3 sm:px-4 lg:px-0">
            {msgs.map(msg => {
              if (msg.kind === "user-init") return (
                <div key={msg.id} className="flex justify-end mt-10">
                  <div className="bg-ct-action text-white text-[14px] px-4 py-3 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed shadow-sm">
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
              if (msg.kind === "planning") return (
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <div className="flex-1 min-w-0 bg-white border border-ct-border rounded-xl p-4">
                    <PlanningMsg step={planStep} />
                  </div>
                </div>
              );
              if (msg.kind === "planning-done") return (
                <div key={msg.id} className="space-y-4">
                  <PlanResultView
                    onSelectDay={onSelectDay}
                    selectedDay={selectedDay}
                    planUpdating={planUpdating}
                    days={days}
                    setDays={setDays}
                    onSwapHighlight={onSwapHighlight}
                    onLogChange={onLogChange}
                  />
                </div>
              );
              if (msg.kind === "breakdown") return (
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <div className="flex-1 min-w-0">
                    <TripBreakdown />
                  </div>
                </div>
              );
              if (msg.kind === "swap") return (
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <div className="flex-1 min-w-0">
                    <SwapCarousel kind={msg.swapKind!} onApply={opt => onSwapApply(msg.swapKind!, opt)} />
                  </div>
                </div>
              );
              if (msg.kind === "cards") return (
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <div className="flex-1 min-w-0">
                    <RichCards set={msg.cardSet!} onApply={card => onCardApply(msg.cardSet!, card)} />
                  </div>
                </div>
              );
              if (msg.kind === "flights") return (
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <div className="flex-1 min-w-0">
                    <FlightsBlock onSwap={(leg, label) => onLogChange(`${leg} flight swap`, `${leg} → ${label}`)} />
                  </div>
                </div>
              );
              if (msg.kind === "multi-stay") return (
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <div className="flex-1 min-w-0">
                    <MultiStayBlock />
                  </div>
                </div>
              );
              if (msg.kind === "regen-preview" && msg.chipDiffs) return (
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <div className="flex-1 min-w-0">
                    <RegenPreview diffs={msg.chipDiffs} />
                  </div>
                </div>
              );
              if (msg.kind === "save-trip") return (
                <div key={msg.id} className="flex gap-2.5">
                  <Spark />
                  <div className="flex-1 min-w-0">
                    <SaveTripCard days={days} chipCtx={chipCtx} isUpdate={msg.text === "update"} initialSaved={msg.text === "version-saved"} onSave={onSaveTrip} />
                  </div>
                </div>
              );
              if (msg.kind === "version-saved") return null;
              return null;
            })}


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
      <div className="shrink-0 px-3 sm:px-6 pb-3 sm:pb-5 max-w-[700px] mx-auto w-full">
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
          <div className="space-y-1">
            {regenPending ? (
              <SaveChangesBar
                changes={unsavedChanges}
                mode="generate"
                onSave={onSaveTrip}
                onGenerate={onRegenerate}
              />
            ) : hasSaved && unsavedChanges.length > 0 ? (
              <SaveChangesBar
                changes={unsavedChanges}
                mode="save"
                onSave={onSaveTrip}
                onGenerate={onRegenerate}
              />
            ) : null}
            <QuickReplies onPick={onResultsMessage} />
            <ResultsInput onSend={onResultsMessage} />
          </div>
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

  /* Build the 3-question vibe flow dynamically */
  function getVibeQS(): QDef[] {
    const q2 = vibeAnswer ? (VIBE_FOLLOWUPS[vibeAnswer] ?? VIBE_FOLLOWUPS["Mix of everything"]) : null;
    return q2 ? [VIBE_Q, q2, PACE_Q] : [VIBE_Q];
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
    setTimeout(() => addMsg({ kind: "planning" }), 950);
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
            showAI("Here are your AI-picked flights — alternates below each leg. Tap any to swap it in.", 600);
            setTimeout(() => addMsg({ kind: "flights" }), 1400);
            setTimeout(() => addMsg({
              kind: "ai",
              text: "And your stays — split across two cities to match your day plan. Each leg can be swapped, split, or merged.",
            }), 2400);
            setTimeout(() => addMsg({ kind: "multi-stay" }), 3000);
            setTimeout(() => addMsg({ kind: "ai", text: "Here's the full cost breakdown:" }), 4000);
            setTimeout(() => addMsg({ kind: "breakdown" }), 4600);
            setTimeout(() => addMsg({
              kind: "ai",
              text: "Tap any day on the map to zoom in. Ask me to swap the stay, customise activities, or rebalance the budget anytime.",
            }), 5300);
            setTimeout(() => addMsg({ kind: "save-trip" }), 6100);
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
    addMsg({ kind: "summary", pairs: [newPair] });

    /* After Q1 (vibe), store the answer so Q2 becomes contextual */
    if (q.id === "vibe") {
      setVibeAnswer(answer);
      setSelected([]);
      setQIdx(1);
      setStage("q2");
      showAI(AI_ACKS[1], 950);
    } else if (q.id === "vibe-detail") {
      /* Q2 answered — ask Q3 */
      setSelected([]);
      setQIdx(2);
      setStage("q3");
      showAI(AI_ACKS[2], 950);
    } else {
      /* Q3 answered — start planning */
      startPlanning(allPairs);
    }
  }

  function handlePick(val: string) {
    const q = vibeQS[qIdx];
    if (q.multi) setSelected(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    else setSelected([val]);
  }

  const [showChatsPanel, setShowChatsPanel] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [days, setDays] = useState<DayPlan[]>(BALI_PLAN);
  const [pulseDay, setPulseDay] = useState<number | undefined>(undefined);
  const [changedActivityKey, setChangedActivityKey] = useState<string | undefined>(undefined);
  const pulseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Version history state ── */
  const [versions, setVersions] = useState<Version[]>([]);
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null);
  const [pendingChange, setPendingChange] = useState<{ label: string; changes: string[] }>({
    label: "Initial plan",
    changes: [],
  });
  const [regenPending, setRegenPending] = useState(false);

  /* Accumulate changes between saves; latest label wins. */
  function logChange(label: string, change: string) {
    setPendingChange(prev => ({
      label,
      changes: [...prev.changes, change],
    }));
  }

  function handleSaveTrip() {
    const isUpdate = versions.length > 0;
    const id = `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const isInitial = versions.length === 0 && pendingChange.changes.length === 0;
    const label = isInitial ? "Initial plan" : pendingChange.label;
    const changes = isInitial ? [] : pendingChange.changes;
    const snap: Version = {
      id,
      n: versions.length + 1,
      label,
      ts: Date.now(),
      destination: chipCtx?.destination ?? "Bali, Indonesia",
      daysCount: days.length,
      stopsCount: days.reduce((s, d) => s + d.activities.length, 0),
      budget: "₹63,094",
      changes,
      snapshot: {
        days: JSON.parse(JSON.stringify(days)),
        chipCtx: chipCtx ? JSON.parse(JSON.stringify(chipCtx)) : null,
      },
    };
    setVersions(prev => [...prev, snap]);
    setCurrentVersionId(id);
    setPendingChange({ label: "Edited since last save", changes: [] });
    setShowChatsPanel(true);
    if (isUpdate) {
      setTimeout(() => addMsg({ kind: "save-trip", text: "version-saved" }), 300);
    }
  }

  function handleRestoreVersion(id: string) {
    const v = versions.find(x => x.id === id);
    if (!v) return;
    setDays(JSON.parse(JSON.stringify(v.snapshot.days)));
    if (v.snapshot.chipCtx) setChipCtx(JSON.parse(JSON.stringify(v.snapshot.chipCtx)));
    setCurrentVersionId(id);
    setPendingChange({ label: `Restored "${v.label}"`, changes: [] });
    setRegenPending(false);
    showAI(`Restored "${v.label}" — your plan and map are now showing v${v.n}.`, 400);
  }

  function triggerHighlight(day: number, activityKey?: string) {
    setSelectedDay(day);
    setPulseDay(day);
    setChangedActivityKey(activityKey);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
    pulseTimer.current = setTimeout(() => {
      setPulseDay(undefined);
      setChangedActivityKey(undefined);
    }, 4500);
  }

  function handleSwapHighlight(day: number, activityName?: string) {
    const target = days.find(d => d.day === day);
    const idx = target?.activities.findIndex(a => a.name === activityName) ?? -1;
    const key = target && idx >= 0 ? `${target.day}-${idx}-${target.activities[idx].name}` : undefined;
    triggerHighlight(day, key);
  }

  function applySwapToDays(kind: SwapKind, opt: SwapOption) {
    logChange(
      kind === "stay" ? "Hotel swap" : "Activity swap",
      kind === "stay" ? `Stay → ${opt.name}` : `Activity → ${opt.name}`,
    );
    if (kind === "stay") {
      // Replace any "Check-in at …" or "hotel" type activity in Day 1
      const dayNo = days[0]?.day ?? 1;
      let newKey: string | undefined;
      setDays(prev => prev.map((d, di) => {
        if (di !== 0) return d;
        const newActs = d.activities.map((a, ai) => {
          if (a.type === "hotel") {
            newKey = `${d.day}-${ai}-Check-in at ${opt.name}`;
            return { ...a, name: `Check-in at ${opt.name}` };
          }
          return a;
        });
        return { ...d, activities: newActs };
      }));
      triggerHighlight(dayNo, newKey);
    } else {
      // Replace selectedDay's first non-hotel activity
      let newKey: string | undefined;
      setDays(prev => prev.map(d => {
        if (d.day !== selectedDay) return d;
        let replaced = false;
        const newActs = d.activities.map((a, ai) => {
          if (!replaced && a.type !== "hotel" && a.type !== "flight") {
            replaced = true;
            newKey = `${d.day}-${ai}-${opt.name}`;
            return { ...a, name: opt.name };
          }
          return a;
        });
        return { ...d, activities: newActs };
      }));
      triggerHighlight(selectedDay, newKey);
    }
    if (versions.length === 0) {
      setTimeout(() => addMsg({ kind: "save-trip", text: "update" }), 1600);
    }
  }

  function handleResultsMessage(txt: string) {
    if (!txt.trim()) return;
    addMsg({ kind: "user-init", text: txt });
    const lower = txt.toLowerCase();
    const isFlights = /(flight|fly|airline|departure|return flight|outbound)/.test(lower);
    const isMultiStay = /(multi.?stay|multiple hotel|split.*stay|two hotels|stays?$|hotels?$|change hotel|swap.*hotel|swap.*stay)/.test(lower);
    const isStay = /(stay|hotel|resort|accommodation|where i.?m staying)/.test(lower);
    const isActivity = /(activit|experience|things to do|customis|customiz|swap.*(?:activ|experien)|adventure)/.test(lower);
    const isCheaper = /(cheap|budget|save|reduce|lower)/.test(lower);
    const isBreakdown = /(breakdown|cost|total|how much)/.test(lower);

    if (isFlights) {
      showAI("Here are your flights — outbound and return are picked, with alternates below each. Tap any to swap it in.", 700);
      setTimeout(() => addMsg({ kind: "flights" }), 1300);
      return;
    }
    if (isMultiStay) {
      showAI("Here's your multi-stay plan. Each leg can be swapped, split, or merged — your itinerary updates around it.", 700);
      setTimeout(() => addMsg({ kind: "multi-stay" }), 1300);
      return;
    }
    if (isStay) {
      showAI("Here are top-rated stays for your dates — tap one to swap it in. Travellers' counts are from real Cleartrip reviews.", 700);
      setTimeout(() => addMsg({ kind: "swap", swapKind: "stay" }), 1300);
      return;
    }
    if (isActivity) {
      showAI(`Here are alternative experiences for Day ${selectedDay}. Add any you'd like and the day will rebuild on the map.`, 700);
      setTimeout(() => addMsg({ kind: "swap", swapKind: "activity" }), 1300);
      return;
    }
    if (isCheaper) {
      showAI("Here are three swaps that save you ₹14,200 without losing any highlights:", 700);
      setTimeout(() => addMsg({ kind: "cards", cardSet: "savings" }), 1300);
      return;
    }
    if (isBreakdown) {
      showAI("Here's the cost breakdown for your trip:", 700);
      setTimeout(() => addMsg({ kind: "breakdown" }), 1200);
      return;
    }
    const isAdventure = /adventure|adrenaline|thrill|extreme|hike|raft|surf/.test(lower);
    const isCafe = /cafe|coffee|espresso|brunch|food spot|where to eat|breakfast/.test(lower);
    const isPace = /slow|chill|relax|rest day|pace|easy|laid.?back/.test(lower);
    if (isAdventure) {
      showAI("More adventure on-route — each one fits a free slot in your existing days:", 700);
      setTimeout(() => addMsg({ kind: "cards", cardSet: "adventure" }), 1300);
      return;
    }
    if (isCafe) {
      showAI("Top-rated cafés in Bali — tap one to drop it into the day plan:", 700);
      setTimeout(() => addMsg({ kind: "cards", cardSet: "cafes" }), 1300);
      return;
    }
    if (isPace) {
      showAI("Three ways to slow it down — I'll re-time the days on the map once you pick:", 700);
      setTimeout(() => addMsg({ kind: "cards", cardSet: "pace" }), 1300);
      return;
    }
    showAI("Got it — updating your plan and the map on the right…", 700);
    setPlanUpdating(true);
    if (updateTimer.current) clearTimeout(updateTimer.current);
    updateTimer.current = setTimeout(() => setPlanUpdating(false), 1600);
  }

  function applyCardToTrip(set: CardSet, card: RichCard) {
    const labelMap: Record<CardSet, string> = {
      savings: "Savings applied",
      cafes: "Café added",
      adventure: "Adventure added",
      pace: "Pace adjusted",
    };
    logChange(labelMap[set], card.title + (card.badge ? ` · ${card.badge}` : ""));
    const addSaveTripMsg = () => {
      if (versions.length === 0) {
        setTimeout(() => addMsg({ kind: "save-trip", text: "update" }), 1800);
      }
    };
    if (set === "savings") {
      showAI(`Applied — ${card.title}. ${card.badge ?? "Saved"}.`, 500);
      triggerHighlight(selectedDay);
      addSaveTripMsg();
      return;
    }
    if (set === "adventure" || set === "cafes") {
      // Replace first non-hotel/non-flight slot in selected day
      let newKey: string | undefined;
      setDays(prev => prev.map(d => {
        if (d.day !== selectedDay) return d;
        let replaced = false;
        const newActs = d.activities.map((a, ai) => {
          if (!replaced && a.type !== "hotel" && a.type !== "flight") {
            replaced = true;
            newKey = `${d.day}-${ai}-${card.title}`;
            return { ...a, name: card.title };
          }
          return a;
        });
        return { ...d, activities: newActs };
      }));
      showAI(`Added "${card.title}" to Day ${selectedDay} — see the highlight on the map.`, 500);
      triggerHighlight(selectedDay, newKey);
      addSaveTripMsg();
      return;
    }
    if (set === "pace") {
      showAI(`Applied — ${card.title}. Days re-timed.`, 500);
      triggerHighlight(selectedDay);
      addSaveTripMsg();
      return;
    }
  }

  function handleChipChange(updated: ChipCtx) {
    if (stage === "results" && chipCtx) {
      const fmtRange = (s: string, e: string) =>
        s ? `${fmtChipDate(s)}${e ? " – " + fmtChipDate(e) : ""}` : "—";
      const budgetLabel = (p: string) =>
        ({ budget: "Budget", mid: "Mid-range", luxury: "Luxury" }[p] ?? p ?? "—");
      const richDiffs: ChipDiff[] = [];
      if (updated.destination !== chipCtx.destination) {
        richDiffs.push({ label: "Destination", from: chipCtx.destination, to: updated.destination });
      }
      if (updated.dates.start !== chipCtx.dates.start || updated.dates.end !== chipCtx.dates.end) {
        richDiffs.push({
          label: "Dates",
          from: fmtRange(chipCtx.dates.start, chipCtx.dates.end),
          to: fmtRange(updated.dates.start, updated.dates.end),
        });
      }
      if (updated.adults !== chipCtx.adults || updated.children !== chipCtx.children) {
        richDiffs.push({
          label: "Travellers",
          from: String(chipCtx.adults + chipCtx.children),
          to: String(updated.adults + updated.children),
        });
      }
      if (updated.budgetPreset !== chipCtx.budgetPreset) {
        richDiffs.push({ label: "Budget", from: budgetLabel(chipCtx.budgetPreset), to: budgetLabel(updated.budgetPreset) });
      }
      if (richDiffs.length > 0) {
        const summary = richDiffs.map(d => `${d.label} → ${d.to}`).join(", ");
        logChange("Trip details edited", summary);
        setRegenPending(true);
        addMsg({ kind: "regen-preview", chipDiffs: richDiffs });
      }
    }
    setChipCtx(updated);
    if (stage === "results") {
      if (updateTimer.current) clearTimeout(updateTimer.current);
      setPlanUpdating(true);
      updateTimer.current = setTimeout(() => setPlanUpdating(false), 1600);
    }
  }

  function handleRegenerate() {
    setRegenPending(false);
    setPendingChange({ label: "Regenerated plan", changes: [] });

    const dest = chipCtx?.destination || "your trip";
    const dateStr = chipCtx?.dates.start
      ? `${fmtChipDate(chipCtx.dates.start)}${chipCtx.dates.end ? " – " + fmtChipDate(chipCtx.dates.end) : ""}`
      : "the new dates";
    const travellers = chipCtx ? chipCtx.adults + chipCtx.children : 0;
    const travellersLabel = travellers > 0 ? `${travellers} traveller${travellers !== 1 ? "s" : ""}` : "your group";

    showAI(`Got it — regenerating ${dest} for ${dateStr} (${travellersLabel}). Reshuffling flights, stays and activities…`, 700);
    setStage("planning");
    setTimeout(() => addMsg({ kind: "planning" }), 750);
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
            showAI("Fresh flights for your new dates — pick the legs that suit you.", 600);
            setTimeout(() => addMsg({ kind: "flights" }), 1300);
            setTimeout(() => addMsg({
              kind: "ai",
              text: `Stays re-matched for ${dateStr}. Swap, split or merge any leg.`,
            }), 2300);
            setTimeout(() => addMsg({ kind: "multi-stay" }), 2900);
            setTimeout(() => addMsg({ kind: "ai", text: "Updated cost breakdown for the new plan:" }), 3800);
            setTimeout(() => addMsg({ kind: "breakdown" }), 4400);
            setTimeout(() => addMsg({ kind: "save-trip", text: "update" }), 5200);
            triggerHighlight(selectedDay);
          }, 600);
        }
      }, 700);
    }, 1200);
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
    setDays(BALI_PLAN);
    setPulseDay(undefined);
    setChangedActivityKey(undefined);
    setVersions([]);
    setCurrentVersionId(null);
    setPendingChange({ label: "Initial plan", changes: [] });
    setRegenPending(false);
    if (planTimer.current) clearInterval(planTimer.current);
    if (updateTimer.current) clearTimeout(updateTimer.current);
    if (pulseTimer.current) clearTimeout(pulseTimer.current);
  }

  return (
    <div className="h-screen flex overflow-hidden bg-white relative">
      <AppSidebar
        active="ai-planner"
        onToggleChats={() => setShowChatsPanel(p => !p)}
        showChats={showChatsPanel}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />
      {showChatsPanel && (
        <>
          {/* Mobile backdrop for version panel */}
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowChatsPanel(false)}
          />
          <div className="lg:contents fixed top-0 left-0 z-50 h-full">
            <VersionHistoryPanel
              versions={versions}
              currentVersionId={currentVersionId}
              hasActiveChat={stage !== "idle"}
              lastChangeNote={pendingChange.label}
              unsavedChanges={pendingChange.changes}
              chipCtx={chipCtx}
              days={days}
              onRestore={handleRestoreVersion}
              onNew={() => { resetToIdle(); }}
              onClose={() => setShowChatsPanel(false)}
            />
          </div>
        </>
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
        days={days}
        setDays={setDays}
        onSwapHighlight={handleSwapHighlight}
        onResultsMessage={handleResultsMessage}
        onSwapApply={applySwapToDays}
        onCardApply={applyCardToTrip}
        onSaveTrip={handleSaveTrip}
        onLogChange={logChange}
        hasSaved={versions.length > 0}
        unsavedChanges={pendingChange.changes}
        regenPending={regenPending}
        onRegenerate={handleRegenerate}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        onOpenMobileMap={() => setMobileMapOpen(true)}
      />
      {stage === "results" ? (
        <>
          {/* Mobile backdrop for map */}
          {mobileMapOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              onClick={() => setMobileMapOpen(false)}
            />
          )}
          <div
            className={cn(
              // Desktop: original 380px column inline
              "lg:relative lg:translate-x-0 lg:block",
              // Mobile/tablet: fixed slide-in drawer from right
              "fixed top-0 right-0 z-50 h-full w-[88vw] max-w-[400px] transition-transform duration-200 ease-out shadow-2xl lg:shadow-none",
              mobileMapOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
            )}
          >
            <MapPanel
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              days={days}
              pulseDay={pulseDay}
              changedActivityKey={changedActivityKey}
              onMobileClose={() => setMobileMapOpen(false)}
            />
          </div>
        </>
      ) : showRightPanel ? (
        <div className="hidden lg:block h-full">
          <RightPanel />
        </div>
      ) : null}
    </div>
  );
}
