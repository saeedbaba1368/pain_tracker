import React, { useState } from 'react';
import { BodyView, BodyZone } from '../../types';
import { BODY_ZONES } from '../../data/seedData';
import { RotateCw, ZoomIn, ZoomOut, Check, Info } from 'lucide-react';

interface BodyMapProps {
  selectedZones: string[];
  onZoneToggle: (zoneId: string) => void;
  multiSelect?: boolean;
  readOnly?: boolean;
  highlightedZones?: { zoneId: string; intensity?: number; count?: number }[];
  className?: string;
  initialView?: BodyView;
}

export const BodyMap: React.FC<BodyMapProps> = ({
  selectedZones,
  onZoneToggle,
  multiSelect = true,
  readOnly = false,
  highlightedZones,
  className = '',
  initialView = 'FRONT',
}) => {
  const [view, setView] = useState<BodyView>(initialView);
  const [hoveredZone, setHoveredZone] = useState<BodyZone | null>(null);
  const [zoom, setZoom] = useState<number>(1);

  // Map highlighted zones for quick lookup
  const highlightMap = React.useMemo(() => {
    const map = new Map<string, { intensity?: number; count?: number }>();
    if (highlightedZones) {
      highlightedZones.forEach((hz) => map.set(hz.zoneId, hz));
    }
    return map;
  }, [highlightedZones]);

  const zonesForCurrentView = React.useMemo(() => {
    return BODY_ZONES.filter((z) => z.bodyView === view);
  }, [view]);

  const getZoneFillColor = (zoneId: string, isHovered: boolean): string => {
    const isSelected = selectedZones.includes(zoneId);
    const highlighted = highlightMap.get(zoneId);

    if (highlighted) {
      const val = highlighted.intensity ?? highlighted.count ?? 5;
      if (val >= 8) return isHovered ? '#b91c1c' : '#dc2626'; // Red
      if (val >= 6) return isHovered ? '#c2410c' : '#ea580c'; // Orange
      if (val >= 4) return isHovered ? '#d97706' : '#f59e0b'; // Amber
      if (val >= 1) return isHovered ? '#059669' : '#10b981'; // Emerald
    }

    if (isSelected) {
      return isHovered ? '#0d9488' : '#0f766e'; // Medical Teal
    }

    if (isHovered) {
      return '#cbd5e1'; // Slate light hover
    }

    return '#e2e8f0'; // Default clean anatomical neutral
  };

  const handleZoneClick = (zone: BodyZone) => {
    if (readOnly) return;
    onZoneToggle(zone.id);
  };

  return (
    <div className={`flex flex-col bg-white border border-slate-200 rounded-xl p-4 shadow-sm select-none ${className}`}>
      {/* Controls Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            id="bodymap-toggle-front"
            onClick={() => setView('FRONT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              view === 'FRONT'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            نمای روبرو (قدامی)
          </button>
          <button
            type="button"
            id="bodymap-toggle-back"
            onClick={() => setView('BACK')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              view === 'BACK'
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            نمای پشت (خلفی)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            title="چرخش نما"
            onClick={() => setView(view === 'FRONT' ? 'BACK' : 'FRONT')}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors text-xs flex items-center gap-1 border border-slate-200"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">چرخش نما</span>
          </button>
          <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.8, z - 0.1))}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              title="کوچک‌نمایی"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-600 font-medium" dir="ltr">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
              title="بزرگ‌نمایی"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Anatomical Viewport */}
      <div className="relative w-full h-[430px] sm:h-[480px] flex items-center justify-center overflow-hidden bg-slate-50/60 rounded-lg border border-slate-100">
        {/* Hover / Selection Indicator Chip */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          <div className="bg-slate-900/90 backdrop-blur-xs text-white text-xs px-3 py-1.5 rounded-full shadow-md flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span className="font-medium truncate max-w-[240px]">
              {hoveredZone
                ? `${hoveredZone.name} (${hoveredZone.parentRegion})`
                : selectedZones.length > 0
                ? `${selectedZones.length} ناحیه آناتومیک انتخاب شده`
                : readOnly
                ? 'نقشه آناتومیک پایش درد'
                : 'جهت تعیین محل دقیق درد روی نواحی بدن کلیک کنید'}
            </span>
          </div>

          <span className="text-[11px] font-semibold text-slate-500 bg-white/90 border border-slate-200 px-2 py-0.5 rounded shadow-xs">
            {view === 'FRONT' ? 'نمای روبرو' : 'نمای پشت'}
          </span>
        </div>

        {/* SVG Container with Zoom Transform */}
        <div
          className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          {view === 'FRONT' ? (
            <svg
              viewBox="0 0 340 580"
              className="w-[280px] h-[440px] sm:w-[310px] sm:h-[470px] drop-shadow-xs"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <filter id="zone-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#0f766e" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Background Silhouette Glow */}
              <g opacity="0.15" fill="#94a3b8">
                {/* Silhouette outline */}
                <ellipse cx="170" cy="55" rx="36" ry="46" />
                <path d="M 152 98 L 188 98 L 198 120 L 142 120 Z" />
                <path d="M 125 120 C 130 190, 130 220, 135 270 L 205 270 C 210 220, 210 190, 215 120 Z" />
              </g>

              {/* === HEAD & CRANIUM (FRONT) === */}
              {/* Scalp */}
              <path
                id="zone-head-scalp"
                d="M 142 45 C 142 22, 198 22, 198 45 C 190 38, 150 38, 142 45 Z"
                fill={getZoneFillColor('head-scalp', hoveredZone?.id === 'head-scalp')}
                stroke={selectedZones.includes('head-scalp') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('head-scalp') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'head-scalp') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'head-scalp')!)}
              />

              {/* Forehead */}
              <path
                id="zone-head-forehead"
                d="M 145 46 C 155 40, 185 40, 195 46 L 194 62 C 175 60, 165 60, 146 62 Z"
                fill={getZoneFillColor('head-forehead', hoveredZone?.id === 'head-forehead')}
                stroke={selectedZones.includes('head-forehead') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('head-forehead') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'head-forehead') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'head-forehead')!)}
              />

              {/* Left Temple (Anatomical Left = Viewer's Right) */}
              <path
                id="zone-head-temple-l"
                d="M 188 56 L 199 58 L 198 72 L 187 69 Z"
                fill={getZoneFillColor('head-temple-l', hoveredZone?.id === 'head-temple-l')}
                stroke={selectedZones.includes('head-temple-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('head-temple-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'head-temple-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'head-temple-l')!)}
              />

              {/* Right Temple (Anatomical Right = Viewer's Left) */}
              <path
                id="zone-head-temple-r"
                d="M 152 56 L 141 58 L 142 72 L 153 69 Z"
                fill={getZoneFillColor('head-temple-r', hoveredZone?.id === 'head-temple-r')}
                stroke={selectedZones.includes('head-temple-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('head-temple-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'head-temple-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'head-temple-r')!)}
              />

              {/* Left Eye Orbit (Viewer's Right) */}
              <path
                id="zone-head-eye-l"
                d="M 172 64 C 178 62, 185 62, 187 68 C 185 73, 178 73, 172 68 Z"
                fill={getZoneFillColor('head-eye-l', hoveredZone?.id === 'head-eye-l')}
                stroke={selectedZones.includes('head-eye-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('head-eye-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'head-eye-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'head-eye-l')!)}
              />

              {/* Right Eye Orbit (Viewer's Left) */}
              <path
                id="zone-head-eye-r"
                d="M 168 64 C 162 62, 155 62, 153 68 C 155 73, 162 73, 168 68 Z"
                fill={getZoneFillColor('head-eye-r', hoveredZone?.id === 'head-eye-r')}
                stroke={selectedZones.includes('head-eye-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('head-eye-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'head-eye-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'head-eye-r')!)}
              />

              {/* Left Jaw / TMJ (Viewer's Right) */}
              <path
                id="zone-head-jaw-l"
                d="M 171 78 L 192 76 L 180 96 L 170 96 Z"
                fill={getZoneFillColor('head-jaw-l', hoveredZone?.id === 'head-jaw-l')}
                stroke={selectedZones.includes('head-jaw-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('head-jaw-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'head-jaw-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'head-jaw-l')!)}
              />

              {/* Right Jaw / TMJ (Viewer's Left) */}
              <path
                id="zone-head-jaw-r"
                d="M 169 78 L 148 76 L 160 96 L 170 96 Z"
                fill={getZoneFillColor('head-jaw-r', hoveredZone?.id === 'head-jaw-r')}
                stroke={selectedZones.includes('head-jaw-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('head-jaw-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'head-jaw-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'head-jaw-r')!)}
              />

              {/* === NECK & THROAT (FRONT) === */}
              {/* Anterior Neck / Center */}
              <path
                id="zone-neck-front"
                d="M 160 98 L 180 98 L 184 122 L 156 122 Z"
                fill={getZoneFillColor('neck-front', hoveredZone?.id === 'neck-front')}
                stroke={selectedZones.includes('neck-front') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('neck-front') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'neck-front') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'neck-front')!)}
              />

              {/* Left Lateral Neck (Viewer's Right) */}
              <path
                id="zone-neck-left"
                d="M 180 98 L 192 104 L 202 122 L 184 122 Z"
                fill={getZoneFillColor('neck-left', hoveredZone?.id === 'neck-left')}
                stroke={selectedZones.includes('neck-left') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('neck-left') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'neck-left') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'neck-left')!)}
              />

              {/* Right Lateral Neck (Viewer's Left) */}
              <path
                id="zone-neck-right"
                d="M 160 98 L 148 104 L 138 122 L 156 122 Z"
                fill={getZoneFillColor('neck-right', hoveredZone?.id === 'neck-right')}
                stroke={selectedZones.includes('neck-right') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('neck-right') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'neck-right') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'neck-right')!)}
              />

              {/* === CHEST & THORAX (FRONT) === */}
              {/* Sternum / Mid-Chest */}
              <path
                id="zone-chest-center"
                d="M 160 124 L 180 124 L 176 168 L 164 168 Z"
                fill={getZoneFillColor('chest-center', hoveredZone?.id === 'chest-center')}
                stroke={selectedZones.includes('chest-center') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('chest-center') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'chest-center') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'chest-center')!)}
              />

              {/* Left Upper Chest (Viewer's Right) */}
              <path
                id="zone-chest-upper-l"
                d="M 181 124 L 214 125 L 210 168 L 177 168 Z"
                fill={getZoneFillColor('chest-upper-l', hoveredZone?.id === 'chest-upper-l')}
                stroke={selectedZones.includes('chest-upper-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('chest-upper-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'chest-upper-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'chest-upper-l')!)}
              />

              {/* Right Upper Chest (Viewer's Left) */}
              <path
                id="zone-chest-upper-r"
                d="M 159 124 L 126 125 L 130 168 L 163 168 Z"
                fill={getZoneFillColor('chest-upper-r', hoveredZone?.id === 'chest-upper-r')}
                stroke={selectedZones.includes('chest-upper-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('chest-upper-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'chest-upper-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'chest-upper-r')!)}
              />

              {/* Left Lower Chest / Flank (Viewer's Right) */}
              <path
                id="zone-chest-lower-l"
                d="M 177 170 L 209 170 L 206 202 L 174 202 Z"
                fill={getZoneFillColor('chest-lower-l', hoveredZone?.id === 'chest-lower-l')}
                stroke={selectedZones.includes('chest-lower-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('chest-lower-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'chest-lower-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'chest-lower-l')!)}
              />

              {/* Right Lower Chest / Flank (Viewer's Left) */}
              <path
                id="zone-chest-lower-r"
                d="M 163 170 L 131 170 L 134 202 L 166 202 Z"
                fill={getZoneFillColor('chest-lower-r', hoveredZone?.id === 'chest-lower-r')}
                stroke={selectedZones.includes('chest-lower-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('chest-lower-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'chest-lower-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'chest-lower-r')!)}
              />

              {/* === ABDOMEN & PELVIS (FRONT) === */}
              {/* Epigastrium / Upper Abdomen */}
              <path
                id="zone-abdomen-upper"
                d="M 148 204 L 192 204 L 194 232 L 146 232 Z"
                fill={getZoneFillColor('abdomen-upper', hoveredZone?.id === 'abdomen-upper')}
                stroke={selectedZones.includes('abdomen-upper') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('abdomen-upper') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'abdomen-upper') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'abdomen-upper')!)}
              />

              {/* Umbilicus / Mid-Abdomen */}
              <path
                id="zone-abdomen-navel"
                d="M 145 234 L 195 234 L 196 262 L 144 262 Z"
                fill={getZoneFillColor('abdomen-navel', hoveredZone?.id === 'abdomen-navel')}
                stroke={selectedZones.includes('abdomen-navel') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('abdomen-navel') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'abdomen-navel') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'abdomen-navel')!)}
              />

              {/* Lower Abdomen */}
              <path
                id="zone-abdomen-lower"
                d="M 143 264 L 197 264 L 188 288 L 152 288 Z"
                fill={getZoneFillColor('abdomen-lower', hoveredZone?.id === 'abdomen-lower')}
                stroke={selectedZones.includes('abdomen-lower') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('abdomen-lower') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'abdomen-lower') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'abdomen-lower')!)}
              />

              {/* Left Inguinal / Groin (Viewer's Right) */}
              <path
                id="zone-pelvis-groin-l"
                d="M 188 288 L 210 286 L 196 312 L 172 312 Z"
                fill={getZoneFillColor('pelvis-groin-l', hoveredZone?.id === 'pelvis-groin-l')}
                stroke={selectedZones.includes('pelvis-groin-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('pelvis-groin-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'pelvis-groin-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'pelvis-groin-l')!)}
              />

              {/* Right Inguinal / Groin (Viewer's Left) */}
              <path
                id="zone-pelvis-groin-r"
                d="M 152 288 L 130 286 L 144 312 L 168 312 Z"
                fill={getZoneFillColor('pelvis-groin-r', hoveredZone?.id === 'pelvis-groin-r')}
                stroke={selectedZones.includes('pelvis-groin-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('pelvis-groin-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'pelvis-groin-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'pelvis-groin-r')!)}
              />

              {/* === UPPER EXTREMITIES (FRONT) === */}
              {/* Left Shoulder (Viewer's Right) */}
              <path
                id="zone-shoulder-front-l"
                d="M 204 122 C 220 122, 235 130, 240 146 L 222 154 L 214 125 Z"
                fill={getZoneFillColor('shoulder-front-l', hoveredZone?.id === 'shoulder-front-l')}
                stroke={selectedZones.includes('shoulder-front-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('shoulder-front-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'shoulder-front-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'shoulder-front-l')!)}
              />

              {/* Right Shoulder (Viewer's Left) */}
              <path
                id="zone-shoulder-front-r"
                d="M 136 122 C 120 122, 105 130, 100 146 L 118 154 L 126 125 Z"
                fill={getZoneFillColor('shoulder-front-r', hoveredZone?.id === 'shoulder-front-r')}
                stroke={selectedZones.includes('shoulder-front-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('shoulder-front-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'shoulder-front-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'shoulder-front-r')!)}
              />

              {/* Left Upper Arm / Bicep (Viewer's Right) */}
              <path
                id="zone-arm-upper-l"
                d="M 240 148 L 254 195 L 235 200 L 223 156 Z"
                fill={getZoneFillColor('arm-upper-l', hoveredZone?.id === 'arm-upper-l')}
                stroke={selectedZones.includes('arm-upper-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('arm-upper-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'arm-upper-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'arm-upper-l')!)}
              />

              {/* Right Upper Arm / Bicep (Viewer's Left) */}
              <path
                id="zone-arm-upper-r"
                d="M 100 148 L 86 195 L 105 200 L 117 156 Z"
                fill={getZoneFillColor('arm-upper-r', hoveredZone?.id === 'arm-upper-r')}
                stroke={selectedZones.includes('arm-upper-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('arm-upper-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'arm-upper-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'arm-upper-r')!)}
              />

              {/* Left Elbow (Viewer's Right) */}
              <path
                id="zone-arm-elbow-l"
                d="M 254 196 L 260 220 L 242 222 L 236 201 Z"
                fill={getZoneFillColor('arm-elbow-l', hoveredZone?.id === 'arm-elbow-l')}
                stroke={selectedZones.includes('arm-elbow-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('arm-elbow-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'arm-elbow-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'arm-elbow-l')!)}
              />

              {/* Right Elbow (Viewer's Left) */}
              <path
                id="zone-arm-elbow-r"
                d="M 86 196 L 80 220 L 98 222 L 104 201 Z"
                fill={getZoneFillColor('arm-elbow-r', hoveredZone?.id === 'arm-elbow-r')}
                stroke={selectedZones.includes('arm-elbow-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('arm-elbow-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'arm-elbow-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'arm-elbow-r')!)}
              />

              {/* Left Forearm (Viewer's Right) */}
              <path
                id="zone-arm-forearm-l"
                d="M 260 222 L 272 268 L 256 270 L 243 224 Z"
                fill={getZoneFillColor('arm-forearm-l', hoveredZone?.id === 'arm-forearm-l')}
                stroke={selectedZones.includes('arm-forearm-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('arm-forearm-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'arm-forearm-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'arm-forearm-l')!)}
              />

              {/* Right Forearm (Viewer's Left) */}
              <path
                id="zone-arm-forearm-r"
                d="M 80 222 L 68 268 L 84 270 L 97 224 Z"
                fill={getZoneFillColor('arm-forearm-r', hoveredZone?.id === 'arm-forearm-r')}
                stroke={selectedZones.includes('arm-forearm-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('arm-forearm-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'arm-forearm-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'arm-forearm-r')!)}
              />

              {/* Left Wrist (Viewer's Right) */}
              <path
                id="zone-arm-wrist-l"
                d="M 272 269 L 277 282 L 261 284 L 256 271 Z"
                fill={getZoneFillColor('arm-wrist-l', hoveredZone?.id === 'arm-wrist-l')}
                stroke={selectedZones.includes('arm-wrist-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('arm-wrist-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'arm-wrist-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'arm-wrist-l')!)}
              />

              {/* Right Wrist (Viewer's Left) */}
              <path
                id="zone-arm-wrist-r"
                d="M 68 269 L 63 282 L 79 284 L 84 271 Z"
                fill={getZoneFillColor('arm-wrist-r', hoveredZone?.id === 'arm-wrist-r')}
                stroke={selectedZones.includes('arm-wrist-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('arm-wrist-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'arm-wrist-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'arm-wrist-r')!)}
              />

              {/* Left Hand & Fingers (Viewer's Right) */}
              <path
                id="zone-hand-palm-l"
                d="M 277 284 C 286 295, 290 318, 276 322 C 265 320, 260 300, 261 286 Z"
                fill={getZoneFillColor('hand-palm-l', hoveredZone?.id === 'hand-palm-l')}
                stroke={selectedZones.includes('hand-palm-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('hand-palm-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'hand-palm-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'hand-palm-l')!)}
              />

              {/* Right Hand & Fingers (Viewer's Left) */}
              <path
                id="zone-hand-palm-r"
                d="M 63 284 C 54 295, 50 318, 64 322 C 75 320, 80 300, 79 286 Z"
                fill={getZoneFillColor('hand-palm-r', hoveredZone?.id === 'hand-palm-r')}
                stroke={selectedZones.includes('hand-palm-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('hand-palm-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'hand-palm-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'hand-palm-r')!)}
              />

              {/* === LOWER EXTREMITIES (FRONT) === */}
              {/* Left Hip / Anterior (Viewer's Right) */}
              <path
                id="zone-hip-front-l"
                d="M 211 286 L 222 315 L 198 322 L 188 288 Z"
                fill={getZoneFillColor('hip-front-l', hoveredZone?.id === 'hip-front-l')}
                stroke={selectedZones.includes('hip-front-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('hip-front-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'hip-front-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'hip-front-l')!)}
              />

              {/* Right Hip / Anterior (Viewer's Left) */}
              <path
                id="zone-hip-front-r"
                d="M 129 286 L 118 315 L 142 322 L 152 288 Z"
                fill={getZoneFillColor('hip-front-r', hoveredZone?.id === 'hip-front-r')}
                stroke={selectedZones.includes('hip-front-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('hip-front-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'hip-front-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'hip-front-r')!)}
              />

              {/* Left Thigh / Quadricep (Viewer's Right) */}
              <path
                id="zone-leg-thigh-front-l"
                d="M 174 316 L 216 316 L 208 392 L 176 392 Z"
                fill={getZoneFillColor('leg-thigh-front-l', hoveredZone?.id === 'leg-thigh-front-l')}
                stroke={selectedZones.includes('leg-thigh-front-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-thigh-front-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-thigh-front-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-thigh-front-l')!)}
              />

              {/* Right Thigh / Quadricep (Viewer's Left) */}
              <path
                id="zone-leg-thigh-front-r"
                d="M 166 316 L 124 316 L 132 392 L 164 392 Z"
                fill={getZoneFillColor('leg-thigh-front-r', hoveredZone?.id === 'leg-thigh-front-r')}
                stroke={selectedZones.includes('leg-thigh-front-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-thigh-front-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-thigh-front-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-thigh-front-r')!)}
              />

              {/* Left Knee / Patella (Viewer's Right) */}
              <path
                id="zone-leg-knee-front-l"
                d="M 176 394 L 208 394 L 204 424 L 178 424 Z"
                fill={getZoneFillColor('leg-knee-front-l', hoveredZone?.id === 'leg-knee-front-l')}
                stroke={selectedZones.includes('leg-knee-front-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-knee-front-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-knee-front-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-knee-front-l')!)}
              />

              {/* Right Knee / Patella (Viewer's Left) */}
              <path
                id="zone-leg-knee-front-r"
                d="M 164 394 L 132 394 L 136 424 L 162 424 Z"
                fill={getZoneFillColor('leg-knee-front-r', hoveredZone?.id === 'leg-knee-front-r')}
                stroke={selectedZones.includes('leg-knee-front-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-knee-front-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-knee-front-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-knee-front-r')!)}
              />

              {/* Left Shin / Tibia (Viewer's Right) */}
              <path
                id="zone-leg-shin-l"
                d="M 178 426 L 204 426 L 198 496 L 180 496 Z"
                fill={getZoneFillColor('leg-shin-l', hoveredZone?.id === 'leg-shin-l')}
                stroke={selectedZones.includes('leg-shin-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-shin-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-shin-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-shin-l')!)}
              />

              {/* Right Shin / Tibia (Viewer's Left) */}
              <path
                id="zone-leg-shin-r"
                d="M 162 426 L 136 426 L 142 496 L 160 496 Z"
                fill={getZoneFillColor('leg-shin-r', hoveredZone?.id === 'leg-shin-r')}
                stroke={selectedZones.includes('leg-shin-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-shin-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-shin-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-shin-r')!)}
              />

              {/* Left Ankle (Viewer's Right) */}
              <path
                id="zone-foot-ankle-l"
                d="M 180 498 L 198 498 L 197 516 L 180 516 Z"
                fill={getZoneFillColor('foot-ankle-l', hoveredZone?.id === 'foot-ankle-l')}
                stroke={selectedZones.includes('foot-ankle-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('foot-ankle-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'foot-ankle-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'foot-ankle-l')!)}
              />

              {/* Right Ankle (Viewer's Left) */}
              <path
                id="zone-foot-ankle-r"
                d="M 160 498 L 142 498 L 143 516 L 160 516 Z"
                fill={getZoneFillColor('foot-ankle-r', hoveredZone?.id === 'foot-ankle-r')}
                stroke={selectedZones.includes('foot-ankle-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('foot-ankle-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'foot-ankle-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'foot-ankle-r')!)}
              />

              {/* Left Foot & Toes (Viewer's Right) */}
              <path
                id="zone-foot-dorsum-l"
                d="M 180 518 L 198 518 C 205 530, 208 554, 184 554 L 178 535 Z"
                fill={getZoneFillColor('foot-dorsum-l', hoveredZone?.id === 'foot-dorsum-l')}
                stroke={selectedZones.includes('foot-dorsum-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('foot-dorsum-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'foot-dorsum-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'foot-dorsum-l')!)}
              />

              {/* Right Foot & Toes (Viewer's Left) */}
              <path
                id="zone-foot-dorsum-r"
                d="M 160 518 L 142 518 C 135 530, 132 554, 156 554 L 162 535 Z"
                fill={getZoneFillColor('foot-dorsum-r', hoveredZone?.id === 'foot-dorsum-r')}
                stroke={selectedZones.includes('foot-dorsum-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('foot-dorsum-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'foot-dorsum-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'foot-dorsum-r')!)}
              />
            </svg>
          ) : (
            /* === POSTERIOR / BACK VIEW === */
            <svg
              viewBox="0 0 340 580"
              className="w-[280px] h-[440px] sm:w-[310px] sm:h-[470px] drop-shadow-xs"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Back of Head / Occiput */}
              <path
                id="zone-head-occiput"
                d="M 142 35 C 142 16, 198 16, 198 35 C 196 65, 144 65, 142 35 Z"
                fill={getZoneFillColor('head-occiput', hoveredZone?.id === 'head-occiput')}
                stroke={selectedZones.includes('head-occiput') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('head-occiput') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'head-occiput') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'head-occiput')!)}
              />

              {/* Cervical Spine / Nape */}
              <path
                id="zone-neck-posterior"
                d="M 154 68 L 186 68 L 194 116 L 146 116 Z"
                fill={getZoneFillColor('neck-posterior', hoveredZone?.id === 'neck-posterior')}
                stroke={selectedZones.includes('neck-posterior') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('neck-posterior') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'neck-posterior') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'neck-posterior')!)}
              />

              {/* Left Posterior Trapezius / Scapula (Anatomical Left = Viewer's Left in Back View) */}
              <path
                id="zone-shoulder-back-l"
                d="M 144 118 L 102 142 L 124 165 L 152 152 Z"
                fill={getZoneFillColor('shoulder-back-l', hoveredZone?.id === 'shoulder-back-l')}
                stroke={selectedZones.includes('shoulder-back-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('shoulder-back-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'shoulder-back-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'shoulder-back-l')!)}
              />

              {/* Right Posterior Trapezius / Scapula (Anatomical Right = Viewer's Right in Back View) */}
              <path
                id="zone-shoulder-back-r"
                d="M 196 118 L 238 142 L 216 165 L 188 152 Z"
                fill={getZoneFillColor('shoulder-back-r', hoveredZone?.id === 'shoulder-back-r')}
                stroke={selectedZones.includes('shoulder-back-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('shoulder-back-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'shoulder-back-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'shoulder-back-r')!)}
              />

              {/* Thoracic Spine / Upper Back */}
              <path
                id="zone-back-upper"
                d="M 148 120 L 192 120 L 186 172 L 154 172 Z"
                fill={getZoneFillColor('back-upper', hoveredZone?.id === 'back-upper')}
                stroke={selectedZones.includes('back-upper') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('back-upper') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'back-upper') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'back-upper')!)}
              />

              {/* Left Mid-Back (Viewer's Left) */}
              <path
                id="zone-back-mid-l"
                d="M 126 168 L 152 174 L 150 216 L 132 212 Z"
                fill={getZoneFillColor('back-mid-l', hoveredZone?.id === 'back-mid-l')}
                stroke={selectedZones.includes('back-mid-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('back-mid-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'back-mid-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'back-mid-l')!)}
              />

              {/* Right Mid-Back (Viewer's Right) */}
              <path
                id="zone-back-mid-r"
                d="M 214 168 L 188 174 L 190 216 L 208 212 Z"
                fill={getZoneFillColor('back-mid-r', hoveredZone?.id === 'back-mid-r')}
                stroke={selectedZones.includes('back-mid-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('back-mid-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'back-mid-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'back-mid-r')!)}
              />

              {/* Lumbar Spine / Lower Back */}
              <path
                id="zone-back-lumbar"
                d="M 154 174 L 186 174 L 184 236 L 156 236 Z"
                fill={getZoneFillColor('back-lumbar', hoveredZone?.id === 'back-lumbar')}
                stroke={selectedZones.includes('back-lumbar') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('back-lumbar') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'back-lumbar') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'back-lumbar')!)}
              />

              {/* Left Lumbar Flank (Viewer's Left) */}
              <path
                id="zone-back-lumbar-l"
                d="M 134 214 L 154 218 L 154 256 L 138 252 Z"
                fill={getZoneFillColor('back-lumbar-l', hoveredZone?.id === 'back-lumbar-l')}
                stroke={selectedZones.includes('back-lumbar-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('back-lumbar-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'back-lumbar-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'back-lumbar-l')!)}
              />

              {/* Right Lumbar Flank (Viewer's Right) */}
              <path
                id="zone-back-lumbar-r"
                d="M 206 214 L 186 218 L 186 256 L 202 252 Z"
                fill={getZoneFillColor('back-lumbar-r', hoveredZone?.id === 'back-lumbar-r')}
                stroke={selectedZones.includes('back-lumbar-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('back-lumbar-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'back-lumbar-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'back-lumbar-r')!)}
              />

              {/* Sacrum / Coccyx */}
              <path
                id="zone-pelvis-sacrum"
                d="M 158 238 L 182 238 L 175 284 L 165 284 Z"
                fill={getZoneFillColor('pelvis-sacrum', hoveredZone?.id === 'pelvis-sacrum')}
                stroke={selectedZones.includes('pelvis-sacrum') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('pelvis-sacrum') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'pelvis-sacrum') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'pelvis-sacrum')!)}
              />

              {/* Left Gluteal (Viewer's Left) */}
              <path
                id="zone-glute-l"
                d="M 138 254 L 163 258 L 164 306 L 126 304 Z"
                fill={getZoneFillColor('glute-l', hoveredZone?.id === 'glute-l')}
                stroke={selectedZones.includes('glute-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('glute-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'glute-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'glute-l')!)}
              />

              {/* Right Gluteal (Viewer's Right) */}
              <path
                id="zone-glute-r"
                d="M 202 254 L 177 258 L 176 306 L 214 304 Z"
                fill={getZoneFillColor('glute-r', hoveredZone?.id === 'glute-r')}
                stroke={selectedZones.includes('glute-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('glute-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'glute-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'glute-r')!)}
              />

              {/* Left Posterior Thigh / Hamstring (Viewer's Left) */}
              <path
                id="zone-leg-hamstring-l"
                d="M 126 308 L 166 310 L 162 390 L 132 390 Z"
                fill={getZoneFillColor('leg-hamstring-l', hoveredZone?.id === 'leg-hamstring-l')}
                stroke={selectedZones.includes('leg-hamstring-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-hamstring-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-hamstring-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-hamstring-l')!)}
              />

              {/* Right Posterior Thigh / Hamstring (Viewer's Right) */}
              <path
                id="zone-leg-hamstring-r"
                d="M 214 308 L 174 310 L 178 390 L 208 390 Z"
                fill={getZoneFillColor('leg-hamstring-r', hoveredZone?.id === 'leg-hamstring-r')}
                stroke={selectedZones.includes('leg-hamstring-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-hamstring-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-hamstring-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-hamstring-r')!)}
              />

              {/* Left Popliteal / Back of Knee (Viewer's Left) */}
              <path
                id="zone-leg-popliteal-l"
                d="M 132 392 L 162 392 L 160 422 L 134 422 Z"
                fill={getZoneFillColor('leg-popliteal-l', hoveredZone?.id === 'leg-popliteal-l')}
                stroke={selectedZones.includes('leg-popliteal-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-popliteal-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-popliteal-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-popliteal-l')!)}
              />

              {/* Right Popliteal / Back of Knee (Viewer's Right) */}
              <path
                id="zone-leg-popliteal-r"
                d="M 208 392 L 178 392 L 180 422 L 206 422 Z"
                fill={getZoneFillColor('leg-popliteal-r', hoveredZone?.id === 'leg-popliteal-r')}
                stroke={selectedZones.includes('leg-popliteal-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-popliteal-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-popliteal-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-popliteal-r')!)}
              />

              {/* Left Calf / Gastrocnemius (Viewer's Left) */}
              <path
                id="zone-leg-calf-l"
                d="M 134 424 L 160 424 L 156 496 L 138 496 Z"
                fill={getZoneFillColor('leg-calf-l', hoveredZone?.id === 'leg-calf-l')}
                stroke={selectedZones.includes('leg-calf-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-calf-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-calf-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-calf-l')!)}
              />

              {/* Right Calf / Gastrocnemius (Viewer's Right) */}
              <path
                id="zone-leg-calf-r"
                d="M 206 424 L 180 424 L 184 496 L 202 496 Z"
                fill={getZoneFillColor('leg-calf-r', hoveredZone?.id === 'leg-calf-r')}
                stroke={selectedZones.includes('leg-calf-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('leg-calf-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'leg-calf-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'leg-calf-r')!)}
              />

              {/* Left Achilles / Heel / Plantar (Viewer's Left) */}
              <path
                id="zone-foot-heel-l"
                d="M 138 498 L 156 498 C 158 525, 150 550, 134 550 C 130 535, 132 510, 138 498 Z"
                fill={getZoneFillColor('foot-heel-l', hoveredZone?.id === 'foot-heel-l')}
                stroke={selectedZones.includes('foot-heel-l') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('foot-heel-l') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'foot-heel-l') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'foot-heel-l')!)}
              />

              {/* Right Achilles / Heel / Plantar (Viewer's Right) */}
              <path
                id="zone-foot-heel-r"
                d="M 202 498 L 184 498 C 182 525, 190 550, 206 550 C 210 535, 208 510, 202 498 Z"
                fill={getZoneFillColor('foot-heel-r', hoveredZone?.id === 'foot-heel-r')}
                stroke={selectedZones.includes('foot-heel-r') ? '#0f766e' : '#94a3b8'}
                strokeWidth={selectedZones.includes('foot-heel-r') ? 2 : 1}
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setHoveredZone(BODY_ZONES.find((z) => z.id === 'foot-heel-r') || null)}
                onMouseLeave={() => setHoveredZone(null)}
                onClick={() => handleZoneClick(BODY_ZONES.find((z) => z.id === 'foot-heel-r')!)}
              />
            </svg>
          )}
        </div>
      </div>

      {/* Interactive Quick Zone Tags & Selection Summary */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>انتخاب سریع نواحی آناتومیک</span>
          <span className="text-slate-400 font-normal">
            {selectedZones.length} ناحیه انتخاب شده
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
          {zonesForCurrentView.map((z) => {
            const isSelected = selectedZones.includes(z.id);
            return (
              <button
                key={z.id}
                type="button"
                id={`zone-chip-${z.id}`}
                disabled={readOnly}
                onClick={() => handleZoneClick(z)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-teal-700 text-white border-teal-800 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {isSelected && <Check className="w-3 h-3 text-teal-200 shrink-0" />}
                <span className="truncate max-w-[140px]">{z.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
