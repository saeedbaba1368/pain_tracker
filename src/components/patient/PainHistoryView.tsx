import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PainEntry } from '../../types';
import { StorageService } from '../../services/storageService';
import { PainLevelBadge } from '../common/PainLevelBadge';
import { PainEntryDetailModal } from './PainEntryDetailModal';
import { DateRangePicker, DateRangePreset } from '../common/DateRangePicker';
import {
  Calendar,
  Search,
  Activity,
  Pill,
  ChevronLeft,
  Plus,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface PainHistoryViewProps {
  onOpenLogModal: () => void;
}

export const PainHistoryView: React.FC<PainHistoryViewProps> = ({ onOpenLogModal }) => {
  const { currentUser } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<PainEntry | null>(null);

  // Filters
  const [datePreset, setDatePreset] = useState<DateRangePreset>('ALL');
  const [minPainLevel, setMinPainLevel] = useState<number>(0);
  const [maxPainLevel, setMaxPainLevel] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');

  if (!currentUser) return null;

  const allEntries = StorageService.getPatientPainEntries(currentUser.id);

  // Apply filters
  const filteredEntries = allEntries.filter((entry) => {
    // Pain level range
    if (entry.painLevel < minPainLevel || entry.painLevel > maxPainLevel) return false;

    // Date preset filter
    const recTime = new Date(entry.recordedAt).getTime();
    if (datePreset === '7D' && recTime < Date.now() - 7 * 86400000) return false;
    if (datePreset === '30D' && recTime < Date.now() - 30 * 86400000) return false;
    if (datePreset === '90D' && recTime < Date.now() - 90 * 86400000) return false;

    // Region filter
    if (selectedRegionFilter !== 'ALL') {
      const matchLoc = entry.locations.some(
        (l) => l.zoneName.toLowerCase().includes(selectedRegionFilter.toLowerCase()) ||
               l.zoneId.toLowerCase().includes(selectedRegionFilter.toLowerCase())
      );
      if (!matchLoc) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = entry.notes?.toLowerCase().includes(q);
      const matchLoc = entry.locations.some((l) => l.zoneName.toLowerCase().includes(q));
      const matchType = entry.painTypeName?.toLowerCase().includes(q);
      const matchMed = entry.medicationLog?.medicationName.toLowerCase().includes(q);
      if (!matchNote && !matchLoc && !matchType && !matchMed) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            دفترچه جامع سوابق بالینی درد
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            گاه‌شمار کامل نوبت‌های ثبت‌شده، داروها، شدت و نواحی آناتومیک درگیر
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenLogModal}
          className="bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت نوبت درد جدید</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DateRangePicker preset={datePreset} onPresetChange={setDatePreset} />

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در یادداشت‌ها، ناحیه، دارو یا نوع درد..."
              className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border-slate-200 shadow-xs focus:border-teal-700 focus:ring-teal-700 text-right"
            />
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">محدوده شدت درد:</span>
            <select
              value={minPainLevel}
              onChange={(e) => setMinPainLevel(Number(e.target.value))}
              className="text-xs rounded-lg border-slate-300 py-1 px-2 bg-white"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <option key={n} value={n}>
                  حداقل: {n}/۱۰
                </option>
              ))}
            </select>
            <span className="text-slate-400">تا</span>
            <select
              value={maxPainLevel}
              onChange={(e) => setMaxPainLevel(Number(e.target.value))}
              className="text-xs rounded-lg border-slate-300 py-1 px-2 bg-white"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  حداکثر: {n}/۱۰
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">ناحیه آناتومیک:</span>
            <select
              value={selectedRegionFilter}
              onChange={(e) => setSelectedRegionFilter(e.target.value)}
              className="text-xs rounded-lg border-slate-300 py-1 px-2 bg-white"
            >
              <option value="ALL">تمام نواحی بدن</option>
              <option value="سر">سر و جمجمه</option>
              <option value="گردن">گردن و مهره‌های گردنی</option>
              <option value="کمر">کمر و ستون فقرات</option>
              <option value="زانو">زانو و مفصل کشکک</option>
              <option value="پا">ساق، مچ و کف پا</option>
              <option value="شانه">شانه و کتف</option>
            </select>
          </div>

          <span className="text-slate-400 text-xs mr-auto">
            نمایش <strong className="text-slate-800">{filteredEntries.length}</strong> از {allEntries.length} مورد ثبت‌شده
          </span>
        </div>
      </div>

      {/* Entries Timeline List */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => {
          let dateStr = '';
          let timeStr = '';
          try {
            const parsed = parseISO(entry.recordedAt);
            dateStr = format(parsed, 'EEEE, d MMMM yyyy', { locale: faIR });
            timeStr = format(parsed, 'HH:mm', { locale: faIR });
          } catch (e) {
            dateStr = entry.recordedAt;
          }

          return (
            <div
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-teal-300 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
            >
              {/* Left Details */}
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {dateStr}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {timeStr}
                  </span>
                  {entry.isEmergency && (
                    <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      اورژانسی
                    </span>
                  )}
                </div>

                {/* Locations Chips */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  {entry.locations.map((loc) => (
                    <span
                      key={loc.zoneId}
                      className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold px-2 py-0.5 rounded-md"
                    >
                      {loc.zoneName}
                      {loc.intensity && ` (${loc.intensity}/۱۰)`}
                    </span>
                  ))}
                  {entry.painTypeName && (
                    <span className="bg-teal-50 border border-teal-200 text-teal-900 text-xs font-medium px-2 py-0.5 rounded-md">
                      {entry.painTypeName}
                    </span>
                  )}
                  {entry.durationLabel && (
                    <span className="text-slate-400 text-xs">({entry.durationLabel})</span>
                  )}
                </div>

                {/* Medication / Notes preview */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {entry.medicationLog && (
                    <span className="text-indigo-800 font-semibold flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      <Pill className="w-3 h-3" />
                      {entry.medicationLog.medicationName} ({entry.medicationLog.dosage})
                      {entry.medicationLog.effectiveness > 0 && ` • میزان تسکین: ★ ${entry.medicationLog.effectiveness}/۵`}
                    </span>
                  )}
                  {entry.notes && (
                    <p className="text-slate-500 text-xs italic truncate max-w-lg">
                      «{entry.notes}»
                    </p>
                  )}
                </div>
              </div>

              {/* Right Score & Action */}
              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                <PainLevelBadge level={entry.painLevel} size="lg" showLabel />
                <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-teal-50 text-slate-400 group-hover:text-teal-700 flex items-center justify-center transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-400">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <h3 className="text-sm font-bold text-slate-700">موردی با فیلترهای انتخابی یافت نشد</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              می‌توانید فیلترهای تاریخ، محدوده شدت یا متن جستجو را تغییر دهید یا نوبت جدیدی ثبت کنید.
            </p>
          </div>
        )}
      </div>

      {/* Deep Dive Detail Modal */}
      <PainEntryDetailModal
        entry={selectedEntry}
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
};
