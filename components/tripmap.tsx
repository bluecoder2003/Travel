"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapDay {
  day: number;
  location: string;
  lat: number;
  lng: number;
}

function createDayIcon(day: number, active: boolean) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:32px;height:32px;border-radius:50%;
        background:${active ? "#FF4F17" : "#666"};
        color:white;font-size:12px;font-weight:700;
        display:flex;align-items:center;justify-content:center;
        border:3px solid white;
        box-shadow:0 2px 8px rgba(0,0,0,0.3);
        font-family:-apple-system,sans-serif;
        cursor:pointer;
      ">${day}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function FitBounds({ days }: { days: MapDay[] }) {
  const map = useMap();
  useEffect(() => {
    if (!days.length) return;
    const bounds = L.latLngBounds(days.map(d => [d.lat, d.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, days]);
  return null;
}

export default function TripMap({
  days,
  selectedDay,
  onSelectDay,
}: {
  days: MapDay[];
  selectedDay: number;
  onSelectDay: (day: number) => void;
}) {
  const center = days.length
    ? { lat: days.reduce((s, d) => s + d.lat, 0) / days.length, lng: days.reduce((s, d) => s + d.lng, 0) / days.length }
    : { lat: 0, lng: 0 };

  const route = days.map(d => [d.lat, d.lng] as [number, number]);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={10}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
      <FitBounds days={days} />

      {/* Route polyline */}
      <Polyline
        positions={route}
        pathOptions={{ color: "#888", weight: 2.5, dashArray: "6 4", opacity: 0.6 }}
      />

      {/* Day markers */}
      {days.map(d => (
        <Marker
          key={d.day}
          position={[d.lat, d.lng]}
          icon={createDayIcon(d.day, d.day === selectedDay)}
          eventHandlers={{ click: () => onSelectDay(d.day) }}
        >
          <Popup>
            <div style={{ fontFamily: "-apple-system,sans-serif", fontSize: 13, fontWeight: 600 }}>
              Day {d.day} · {d.location}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
