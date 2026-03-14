'use client';

import { useState } from 'react';
import type { SupportedCity } from '@/lib/api';

export interface CantonSelection {
  city: SupportedCity;
  lat: number;
  lng: number;
}

interface SwissCantonMapProps {
  selected?: SupportedCity | null;
  onSelect: (sel: CantonSelection) => void;
}

// Covered cantons → city + coordinates
const COVERED: Record<string, CantonSelection & { label: string }> = {
  GE: { city: 'Geneve',   lat: 46.2044, lng: 6.1432, label: 'Genève' },
  VD: { city: 'Lausanne', lat: 46.5197, lng: 6.6323, label: 'Lausanne' },
  ZH: { city: 'Zurich',   lat: 47.3769, lng: 8.5417, label: 'Zürich' },
  BS: { city: 'Basel',    lat: 47.5596, lng: 7.5886, label: 'Basel' },
};

const CANTON_NAMES: Record<string, string> = {
  ZH: 'Zürich', BE: 'Bern', LU: 'Luzern', UR: 'Uri', SZ: 'Schwyz',
  OW: 'Obwalden', NW: 'Nidwalden', GL: 'Glarus', ZG: 'Zug', FR: 'Fribourg',
  SO: 'Solothurn', BS: 'Basel-Stadt', BL: 'Basel-Landschaft', SH: 'Schaffhausen',
  AR: 'Appenzell AR', AI: 'Appenzell AI', SG: 'St. Gallen', GR: 'Graubünden',
  AG: 'Aargau', TG: 'Thurgau', TI: 'Ticino', VD: 'Vaud', VS: 'Valais',
  NE: 'Neuchâtel', GE: 'Genève', JU: 'Jura',
};

// Simplified SVG paths — ViewBox "0 0 500 340"
// Geographic projection: x=(lon-5.95)*109.9, y=(47.85-lat)*165.9
const PATHS: Record<string, string> = {
  // Northern strip
  JU:  'M 72,60  L 115,55 L 140,60 L 145,82 L 125,95 L 95,95  L 68,82  Z',
  SO:  'M 140,60 L 178,50 L 210,58 L 220,75 L 205,88 L 178,90 L 148,88 L 145,72 Z',
  BS:  'M 170,42 L 186,40 L 193,54 L 185,58 L 172,54 Z',
  BL:  'M 162,52 L 170,42 L 172,54 L 185,58 L 193,54 L 200,68 L 192,80 L 175,84 L 160,75 Z',
  SH:  'M 248,10 L 300,5  L 326,18 L 316,32 L 275,35 L 248,25 Z',
  AG:  'M 200,60 L 248,55 L 264,65 L 266,90 L 240,100 L 213,95 L 200,80 Z',
  ZH:  'M 264,32 L 326,28 L 350,45 L 355,75 L 335,95 L 305,98 L 278,92 L 264,75 L 266,50 Z',
  TG:  'M 310,28 L 365,25 L 405,38 L 395,65 L 360,72 L 335,70 L 325,48 Z',
  // Eastern cluster
  SG:  'M 350,70 L 395,65 L 445,68 L 452,100 L 430,128 L 388,128 L 358,108 L 345,85 Z',
  AR:  'M 395,68 L 415,65 L 428,78 L 418,88 L 398,85 Z',
  AI:  'M 408,85 L 422,82 L 428,95 L 415,100 L 405,95 Z',
  GL:  'M 348,90 L 380,90 L 390,125 L 365,138 L 338,130 L 335,108 Z',
  // Central cluster
  ZG:  'M 266,90 L 290,88 L 300,100 L 285,114 L 265,110 Z',
  LU:  'M 210,88 L 266,88 L 265,110 L 285,114 L 282,135 L 255,148 L 225,142 L 205,122 Z',
  NW:  'M 255,138 L 280,135 L 292,148 L 280,160 L 255,158 Z',
  OW:  'M 225,142 L 255,138 L 255,158 L 242,168 L 220,162 Z',
  SZ:  'M 282,98 L 320,98 L 335,118 L 320,140 L 295,148 L 282,135 L 285,114 L 300,100 Z',
  UR:  'M 280,158 L 315,148 L 335,165 L 325,198 L 295,205 L 268,192 L 262,172 Z',
  // Western cluster
  NE:  'M 65,108 L 96,100 L 125,105 L 130,125 L 108,135 L 78,128 L 65,115 Z',
  FR:  'M 118,108 L 152,108 L 165,128 L 162,165 L 140,175 L 115,165 L 108,140 L 118,120 Z',
  // Large cantons (drawn first, others on top)
  BE:  'M 95,60 L 130,55 L 148,65 L 178,60 L 200,65 L 210,78 L 205,92 L 220,100 L 225,142 L 220,162 L 242,168 L 255,158 L 262,172 L 268,192 L 228,195 L 170,192 L 162,165 L 140,175 L 115,165 L 108,140 L 118,120 L 95,128 L 62,135 L 65,108 L 78,100 L 95,90 L 95,72 Z',
  VS:  'M 44,278 L 100,268 L 148,232 L 170,192 L 228,195 L 268,192 L 295,205 L 325,198 L 360,215 L 350,292 L 282,308 L 192,308 L 100,295 L 35,308 Z',
  GR:  'M 290,168 L 338,165 L 388,168 L 452,195 L 500,220 L 495,285 L 450,300 L 395,305 L 355,285 L 350,260 L 360,215 L 325,198 L 295,205 Z',
  TI:  'M 355,285 L 395,305 L 425,330 L 385,340 L 335,340 L 305,325 L 310,298 L 350,290 Z',
  // Covered cantons — drawn last (on top)
  VD:  'M 20,268 L 38,258 L 60,228 L 50,195 L 62,138 L 95,128 L 118,132 L 108,150 L 115,165 L 140,175 L 162,165 L 170,192 L 148,232 L 100,268 L 44,278 Z',
  GE:  'M 5,295 L 20,268 L 44,278 L 35,308 L 10,308 Z',
};

// Drawing order: large first, covered last
const DRAW_ORDER = [
  'BE', 'VS', 'GR', 'TI',
  'JU', 'SO', 'BL', 'SH', 'AG', 'TG',
  'SG', 'AR', 'AI', 'GL', 'ZG', 'LU', 'NW', 'OW', 'SZ', 'UR',
  'NE', 'FR',
  // covered last
  'VD', 'GE', 'ZH', 'BS',
];

// Label positions for covered cantons
const LABEL_POS: Record<string, { x: number; y: number; anchor?: string }> = {
  GE: { x: 22,  y: 294 },
  VD: { x: 88,  y: 205 },
  ZH: { x: 307, y: 63  },
  BS: { x: 181, y: 48  },
};

export function SwissCantonMap({ selected, onSelect }: SwissCantonMapProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  const getSelectedCity = (cantonId: string): SupportedCity | undefined =>
    COVERED[cantonId]?.city;

  const isSelected = (cantonId: string) =>
    selected != null && getSelectedCity(cantonId) === selected;

  const getFill = (cantonId: string) => {
    const covered = !!COVERED[cantonId];
    if (!covered) return hovered === cantonId ? '#d1d5db' : '#e5e7eb';
    if (isSelected(cantonId)) return '#3b82f6';
    if (hovered === cantonId) return '#93c5fd';
    return '#bfdbfe';
  };

  const getStroke = (cantonId: string) => {
    if (isSelected(cantonId)) return '#1d4ed8';
    return '#9ca3af';
  };

  const getStrokeWidth = (cantonId: string) => {
    if (cantonId === 'BS') return '0.5'; // tiny canton, thin border
    return isSelected(cantonId) ? '1.5' : '0.8';
  };

  return (
    <div className="space-y-2">
      <svg
        viewBox="0 0 500 340"
        className="w-full rounded-lg border border-gray-200 bg-gray-50"
        style={{ maxHeight: 220 }}
        aria-label="Carte des cantons suisses"
      >
        {DRAW_ORDER.map((id) => {
          const path = PATHS[id];
          if (!path) return null;
          const covered = !!COVERED[id];
          const label = CANTON_NAMES[id] ?? id;

          return (
            <path
              key={id}
              d={path}
              fill={getFill(id)}
              stroke={getStroke(id)}
              strokeWidth={getStrokeWidth(id)}
              strokeLinejoin="round"
              cursor={covered ? 'pointer' : 'default'}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => covered && onSelect(COVERED[id])}
              aria-label={covered ? `${label} — cliquer pour sélectionner` : label}
            >
              <title>{covered ? `${label} → ${COVERED[id].label}` : label}</title>
            </path>
          );
        })}

        {/* Labels on covered cantons */}
        {Object.entries(LABEL_POS).map(([id, pos]) => {
          if (!PATHS[id]) return null;
          const sel = isSelected(id);
          // BS is tiny — show label only when selected or hovered
          if (id === 'BS' && !sel && hovered !== 'BS') return null;
          return (
            <text
              key={`label-${id}`}
              x={pos.x}
              y={pos.y}
              textAnchor="middle"
              fontSize={id === 'GE' ? '7' : id === 'BS' ? '6' : '9'}
              fontWeight="600"
              fill={sel ? '#ffffff' : '#1d4ed8'}
              pointerEvents="none"
            >
              {id}
            </text>
          );
        })}

        {/* BS dot indicator (very small canton) */}
        <circle
          cx="181"
          cy="48"
          r="5"
          fill={isSelected('BS') ? '#3b82f6' : hovered === 'BS' ? '#93c5fd' : '#bfdbfe'}
          stroke={isSelected('BS') ? '#1d4ed8' : '#9ca3af'}
          strokeWidth="0.8"
          cursor="pointer"
          onMouseEnter={() => setHovered('BS')}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onSelect(COVERED['BS'])}
        >
          <title>Basel-Stadt → Basel</title>
        </circle>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-blue-200 border border-gray-400" />
          Canton couvert
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-gray-200 border border-gray-400" />
          Non couvert
        </span>
        {selected && (
          <span className="flex items-center gap-1 font-medium text-blue-700">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-500" />
            Sélectionné : {COVERED[Object.keys(COVERED).find(k => COVERED[k].city === selected) ?? '']?.label ?? selected}
          </span>
        )}
      </div>
    </div>
  );
}
