"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapDay {
  day: number;
  location: string;
  lat: number;
  lng: number;
  img?: string;
  tag?: string;
  region?: string;
  blurb?: string;
  mentionedBy?: number;
}

export interface MapActivity {
  key: string;
  name: string;
  lat: number;
  lng: number;
  img?: string;
  time?: string;
  blurb?: string;
  mentionedBy?: number;
  kind?: string;
  kindLabel?: string;
}

/* Photo-collection day pin — circular thumbnail with day number badge */
function createPhotoDayIcon(day: number, img: string | undefined, active: boolean, pulse: boolean) {
  const ring = active ? "#FF4F17" : "rgba(80,80,80,0.95)";
  const size = active ? 50 : 40;
  return L.divIcon({
    className: "",
    html: `
      <div class="ct-day-pin ${pulse ? "ct-pulse" : ""}" style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:white;border:3px solid ${ring};
        box-shadow:0 4px 14px rgba(0,0,0,0.30);
        position:relative;overflow:visible;cursor:pointer;
        transition:all 200ms ease;
      ">
        ${img ? `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;display:block;" />` : ""}
        <div style="
          position:absolute;bottom:-4px;right:-4px;
          width:20px;height:20px;border-radius:9999px;
          background:${active ? "#FF4F17" : "#1a1a1a"};
          color:white;font-size:11px;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          border:2px solid white;font-family:-apple-system,sans-serif;
        ">${day}</div>
      </div>
      <style>
        .ct-pulse {
          animation: ctPulse 1.4s ease-out 3;
        }
        @keyframes ctPulse {
          0%   { box-shadow: 0 0 0 0 rgba(255,79,23,0.55), 0 4px 14px rgba(0,0,0,0.30); }
          70%  { box-shadow: 0 0 0 18px rgba(255,79,23,0), 0 4px 14px rgba(0,0,0,0.30); }
          100% { box-shadow: 0 0 0 0 rgba(255,79,23,0), 0 4px 14px rgba(0,0,0,0.30); }
        }
      </style>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/* Small activity sub-pin — tiny photo bubble used in day mode */
function createActivityIcon(img: string | undefined, idx: number, justChanged: boolean, selected: boolean) {
  const ring = selected ? "#FF4F17" : justChanged ? "#FF4F17" : "white";
  const size = selected ? 36 : 30;
  return L.divIcon({
    className: "",
    html: `
      <div class="${justChanged ? "ct-pulse" : ""}" style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:white;border:${selected ? 3 : 2.5}px solid ${ring};
        box-shadow:0 3px 10px rgba(0,0,0,0.25);
        position:relative;overflow:visible;cursor:pointer;
        transition:all 200ms ease;
      ">
        ${img ? `<img src="${img}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:9999px;display:block;" />` : ""}
        <div style="
          position:absolute;top:-5px;left:-5px;
          width:15px;height:15px;border-radius:9999px;
          background:${selected ? "#FF4F17" : "#1a1a1a"};color:white;
          font-size:9px;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          border:1.5px solid white;font-family:-apple-system,sans-serif;
        ">${idx + 1}</div>
      </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitToDays({ days }: { days: MapDay[] }) {
  const map = useMap();
  useEffect(() => {
    if (!days.length) return;
    const bounds = L.latLngBounds(days.map(d => [d.lat, d.lng]));
    map.fitBounds(bounds, { padding: [44, 44], animate: true, duration: 0.8 });
  }, [map, days]);
  return null;
}

function FitToActivities({ activities, fallback }: { activities: MapActivity[]; fallback: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (activities.length >= 2) {
      const bounds = L.latLngBounds(activities.map(a => [a.lat, a.lng]));
      map.fitBounds(bounds, { padding: [60, 60], animate: true, duration: 0.9, maxZoom: 15 });
    } else if (activities.length === 1) {
      map.flyTo([activities[0].lat, activities[0].lng], 14, { animate: true, duration: 0.9 });
    } else {
      map.flyTo([fallback.lat, fallback.lng], 13, { animate: true, duration: 0.8 });
    }
  }, [map, activities, fallback.lat, fallback.lng]);
  return null;
}

export default function TripMap({
  days,
  selectedDay,
  onSelectDay,
  mode = "overview",
  dayActivities = [],
  pulseDay,
  changedActivityKey,
  onPinClick,
  onActivityClick,
  selectedActivityKey,
}: {
  days: MapDay[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
  mode?: "overview" | "day";
  dayActivities?: MapActivity[];
  pulseDay?: number;
  changedActivityKey?: string;
  onPinClick?: (day: number) => void;
  onActivityClick?: (key: string) => void;
  selectedActivityKey?: string;
}) {
  const fallback = days.find(d => d.day === selectedDay) ?? days[0];
  const center = fallback ? { lat: fallback.lat, lng: fallback.lng } : { lat: 0, lng: 0 };

  const route = days.map(d => [d.lat, d.lng] as [number, number]);
  const dayRoute = dayActivities.map(a => [a.lat, a.lng] as [number, number]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={10}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

      {mode === "overview" && <FitToDays days={days} />}
      {mode === "day" && fallback && <FitToActivities activities={dayActivities} fallback={fallback} />}

      {/* Inter-day route — only in overview */}
      {mode === "overview" && (
        <Polyline
          positions={route}
          pathOptions={{ color: "#888", weight: 2.5, dashArray: "6 4", opacity: 0.55 }}
        />
      )}

      {/* Per-day route between activities — only in day mode */}
      {mode === "day" && dayRoute.length > 1 && (
        <Polyline
          positions={dayRoute}
          pathOptions={{ color: "#FF4F17", weight: 3, opacity: 0.85 }}
        />
      )}

      {/* Day photo-collection markers */}
      {(mode === "overview" ? days : days.filter(d => d.day === selectedDay)).map(d => (
        <Marker
          key={d.day}
          position={[d.lat, d.lng]}
          icon={createPhotoDayIcon(d.day, d.img, d.day === selectedDay, pulseDay === d.day)}
          eventHandlers={{ click: () => (onPinClick ?? onSelectDay)(d.day) }}
        >
          <Tooltip direction="top" offset={[0, -24]} opacity={1} permanent={false} className="ct-place-tooltip">
            <div style={{
              fontFamily: "-apple-system,sans-serif",
              background: "#ffffff",
              border: "1px solid #f0f0f0",
              borderRadius: 14,
              boxShadow: "0 10px 32px rgba(0,0,0,0.14)",
              width: 208,
              overflow: "hidden",
              pointerEvents: "none",
            }}>
              {d.img && (
                <div style={{ position: "relative", width: "100%", height: 104, background: "#f0f0f0" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={d.img} alt={d.location} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <span style={{ position: "absolute", top: 8, left: 8, background: "rgba(26,26,26,0.88)", color: "white", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 9999, textTransform: "uppercase" }}>
                    Day {d.day}
                  </span>
                </div>
              )}
              <div style={{ padding: "10px 12px 11px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2, marginBottom: 3 }}>{d.location}</div>
                <div style={{ fontSize: 10.5, color: "#888", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  <svg width="9" height="9" viewBox="0 0 256 256" fill="#1a1a1a"><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z"/></svg>
                  {d.region ?? d.tag ?? "Bali, Indonesia"}
                </div>
                {d.blurb && (
                  <p style={{ fontSize: 11, color: "#555", lineHeight: 1.4, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {d.blurb}
                  </p>
                )}
                <div style={{ marginTop: 9, paddingTop: 8, borderTop: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontSize: 10, color: "#888" }}>
                    <span style={{ color: "#1a1a1a", fontWeight: 700 }}>{d.mentionedBy ?? 24}</span> mentions
                  </span>
                  <span style={{ fontSize: 10, color: "#1a1a1a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                    Open details
                    <svg width="9" height="9" viewBox="0 0 256 256" fill="#1a1a1a"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>
                  </span>
                </div>
              </div>
            </div>
          </Tooltip>
        </Marker>
      ))}

      {/* Activity sub-pins — only in day mode */}
      {mode === "day" && dayActivities.map((a, i) => (
        <Marker
          key={a.key}
          position={[a.lat, a.lng]}
          icon={createActivityIcon(a.img, i, changedActivityKey === a.key, selectedActivityKey === a.key)}
          eventHandlers={onActivityClick ? { click: () => onActivityClick(a.key) } : undefined}
        >
          <Tooltip direction="top" offset={[0, -18]} opacity={1} permanent={false} className="ct-place-tooltip">
            <div style={{
              fontFamily: "-apple-system,sans-serif",
              background: "#ffffff",
              border: "1px solid #f0f0f0",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.13)",
              width: 188,
              overflow: "hidden",
              pointerEvents: "none",
            }}>
              {a.img && (
                <div style={{ position: "relative", width: "100%", height: 84, background: "#f0f0f0" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.img} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <span style={{ position: "absolute", top: 6, left: 6, background: "rgba(26,26,26,0.88)", color: "white", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", padding: "2px 7px", borderRadius: 9999, textTransform: "uppercase" }}>
                    Stop {i + 1}{a.time ? ` · ${a.time}` : ""}
                  </span>
                  {a.kindLabel && (
                    <span style={{ position: "absolute", top: 6, right: 6, background: "rgba(255,255,255,0.95)", color: "#1a1a1a", fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", padding: "2px 7px", borderRadius: 9999, textTransform: "uppercase" }}>
                      {a.kindLabel}
                    </span>
                  )}
                </div>
              )}
              <div style={{ padding: "9px 11px 10px" }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>{a.name}</div>
                {a.blurb && (
                  <p style={{ fontSize: 10.5, color: "#666", lineHeight: 1.4, margin: "4px 0 0", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {a.blurb}
                  </p>
                )}
                <div style={{ marginTop: 7, paddingTop: 7, borderTop: "1px solid #f5f5f5", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                  <span style={{ fontSize: 9.5, color: "#888" }}>
                    <span style={{ color: "#1a1a1a", fontWeight: 700 }}>{a.mentionedBy ?? 12}</span> recommend
                  </span>
                  <span style={{ fontSize: 9.5, color: "#1a1a1a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                    Tap pin
                    <svg width="9" height="9" viewBox="0 0 256 256" fill="#1a1a1a"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/></svg>
                  </span>
                </div>
              </div>
            </div>
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
