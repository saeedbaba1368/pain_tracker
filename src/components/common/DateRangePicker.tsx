import React from 'react';
import { Calendar } from 'lucide-react';

export type DateRangePreset = '7D' | '30D' | '90D' | 'ALL' | 'CUSTOM';

interface DateRangePickerProps {
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  startDate?: string;
  endDate?: string;
  onCustomChange?: (start: string, end: string) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  preset,
  onPresetChange,
  startDate,
  endDate,
  onCustomChange,
  className = '',
}) => {
  const presets: { id: DateRangePreset; label: string }[] = [
    { id: '7D', label: '۷ روز گذشته' },
    { id: '30D', label: '۳۰ روز گذشته' },
    { id: '90D', label: '۳ ماه گذشته' },
    { id: 'ALL', label: 'کل سوابق' },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
        <Calendar className="w-3.5 h-3.5 text-slate-500 mr-1.5 ml-0.5" />
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPresetChange(p.id)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
              preset === p.id
                ? 'bg-white text-teal-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'CUSTOM' && onCustomChange && (
        <div className="flex items-center gap-2 text-xs">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onCustomChange(e.target.value, endDate || '')}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono"
          />
          <span className="text-slate-400">تا</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onCustomChange(startDate || '', e.target.value)}
            className="border border-slate-300 rounded-md px-2 py-1 text-xs font-mono"
          />
        </div>
      )}
    </div>
  );
};
