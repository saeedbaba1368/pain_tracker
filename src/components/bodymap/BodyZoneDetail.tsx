import React from 'react';
import { BODY_ZONES } from '../../data/seedData';
import { X, Sliders, MapPin } from 'lucide-react';

interface BodyZoneDetailProps {
  selectedZoneIds: string[];
  zoneIntensities: Record<string, number>;
  onRemoveZone: (zoneId: string) => void;
  onIntensityChange: (zoneId: string, intensity: number) => void;
  readOnly?: boolean;
}

export const BodyZoneDetail: React.FC<BodyZoneDetailProps> = ({
  selectedZoneIds,
  zoneIntensities,
  onRemoveZone,
  onIntensityChange,
  readOnly = false,
}) => {
  if (selectedZoneIds.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-4 text-center">
        <MapPin className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
        <p className="text-xs font-semibold text-slate-700">هنوز هیچ ناحیه آناتومیکی انتخاب نشده است</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          جهت ثبت دقیق، روی نقشه تعاملی بدن یا دکمه‌های انتخاب سریع کلیک کنید.
        </p>
      </div>
    );
  }

  const selectedZonesList = selectedZoneIds.map((id) => {
    const zone = BODY_ZONES.find((z) => z.id === id);
    return {
      id,
      name: zone ? zone.name : id,
      parentRegion: zone ? zone.parentRegion : 'بدن',
      intensity: zoneIntensities[id] ?? 5,
    };
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-teal-700" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            نواحی انتخابی و شدت موضعی درد
          </h4>
        </div>
        <span className="text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
          {selectedZonesList.length} ناحیه
        </span>
      </div>

      <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto pl-1">
        {selectedZonesList.map((item) => (
          <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-600"></span>
                <div>
                  <div className="text-xs font-semibold text-slate-900">{item.name}</div>
                  <div className="text-[10px] text-slate-500">ناحیه {item.parentRegion}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  dir="ltr"
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    item.intensity >= 8
                      ? 'bg-red-100 text-red-800'
                      : item.intensity >= 5
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {item.intensity}/10
                </span>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => onRemoveZone(item.id)}
                    className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="حذف ناحیه"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {!readOnly && (
              <div className="flex items-center gap-3 pr-4">
                <span className="text-[10px] font-medium text-slate-500 w-20">شدت در این ناحیه:</span>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={item.intensity}
                  onChange={(e) => onIntensityChange(item.id, Number(e.target.value))}
                  className="flex-1 accent-teal-700 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] font-medium text-slate-700 w-6 text-left font-mono">
                  {item.intensity}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
