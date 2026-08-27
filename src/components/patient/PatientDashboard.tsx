import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PainEntry } from '../../types';
import { StorageService } from '../../services/storageService';
import { StatsCard } from '../common/StatsCard';
import { PainLevelBadge } from '../common/PainLevelBadge';
import { AlertBadge } from '../common/AlertBadge';
import { PainEntryDetailModal } from './PainEntryDetailModal';
import {
  Activity,
  Plus,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Pill,
  Stethoscope,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface PatientDashboardProps {
  onOpenLogModal: () => void;
  onNavigateToView: (view: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  onOpenLogModal,
  onNavigateToView,
}) => {
  const { currentUser } = useAuth();
  const [selectedEntry, setSelectedEntry] = useState<PainEntry | null>(null);

  if (!currentUser) return null;

  const profile = currentUser.profile as any;
  const entries = StorageService.getPatientPainEntries(currentUser.id);
  const alerts = StorageService.getClinicalAlerts(currentUser.id).filter(
    (a) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED'
  );
  const doctorNotes = StorageService.getDoctorNotes(currentUser.id);
  const latestDoctorNote = doctorNotes[0];

  // Calculate stats
  const totalEntries = entries.length;
  const latestEntry = entries[0];
  const latestPain = latestEntry ? latestEntry.painLevel : 0;

  // 7-day average
  const last7DaysEntries = entries.filter((e) => {
    const d = new Date(e.recordedAt).getTime();
    return d >= Date.now() - 7 * 86400000;
  });
  const avg7Day =
    last7DaysEntries.length > 0
      ? Number((last7DaysEntries.reduce((s, e) => s + e.painLevel, 0) / last7DaysEntries.length).toFixed(1))
      : latestPain;

  // 14-day trend calculation
  const prior7DaysEntries = entries.filter((e) => {
    const d = new Date(e.recordedAt).getTime();
    return d >= Date.now() - 14 * 86400000 && d < Date.now() - 7 * 86400000;
  });
  const avgPrior7 =
    prior7DaysEntries.length > 0
      ? prior7DaysEntries.reduce((s, e) => s + e.painLevel, 0) / prior7DaysEntries.length
      : avg7Day;

  const trend =
    avg7Day < avgPrior7 - 0.5 ? 'DOWN' : avg7Day > avgPrior7 + 0.5 ? 'UP' : 'STABLE';

  // Last 7 days data points for chart
  const persianDaysMap: Record<string, string> = {
    Sat: 'ش',
    Sun: 'ی',
    Mon: 'د',
    Tue: 'س',
    Wed: 'چ',
    Thu: 'پ',
    Fri: 'ج',
  };

  const last7DaysChartData = Array.from({ length: 7 }).map((_, idx) => {
    const targetDate = subDays(new Date(), 6 - idx);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    const dayEnglish = format(targetDate, 'EEE');
    const dayLabel = persianDaysMap[dayEnglish] || dayEnglish;

    const dayEntries = entries.filter((e) => e.recordedAt.startsWith(dateStr));
    const avgForDay =
      dayEntries.length > 0
        ? Math.round(dayEntries.reduce((s, e) => s + e.painLevel, 0) / dayEntries.length)
        : null;

    return {
      date: dateStr,
      day: dayLabel,
      value: avgForDay,
      entriesCount: dayEntries.length,
    };
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      {/* Patient Welcome & Clinical Banner */}
      <div className="bg-gradient-to-l from-teal-900 via-slate-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-800 text-teal-200 border border-teal-700">
              پرونده هوشمند بیمار
            </span>
            <span className="text-xs text-slate-300 font-mono" dir="ltr">کد پرونده: {currentUser.username}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight">
            خوش‌آمدید، {profile.firstName} {profile.lastName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
            تشخیص بالینی پرونده: <span className="text-teal-300 font-semibold">{profile.primaryDiagnosis || 'پایش و کنترل دردهای مزمن'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            id="patient-log-pain-primary-btn"
            onClick={onOpenLogModal}
            className="w-full md:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>ثبت نوبت درد جدید</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="آخرین شدت درد ثبت‌شده"
          value={`${latestPain}/10`}
          subtext={latestEntry ? `ثبت‌شده در ${format(parseISO(latestEntry.recordedAt), 'HH:mm')}` : 'امروز ثبتی انجام نشده'}
          icon={Activity}
          variant={latestPain >= 7 ? 'red' : latestPain >= 4 ? 'amber' : 'emerald'}
        />
        <StatsCard
          title="میانگین درد ۷ روز اخیر"
          value={`${avg7Day}/10`}
          subtext={`بر اساس ${last7DaysEntries.length} گزارش`}
          icon={TrendingUp}
          trend={trend}
          trendLabel={trend === 'DOWN' ? 'رو به بهبود' : trend === 'UP' ? 'تشدید درد' : 'وضعیت پایدار'}
          variant="teal"
        />
        <StatsCard
          title="مجموع کل نوبت‌های درد"
          value={totalEntries}
          subtext="سوابق کامل دفترچه"
          icon={Calendar}
          variant="default"
          onClick={() => onNavigateToView('history')}
        />
        <StatsCard
          title="هشدارهای فعال بالینی"
          value={alerts.length}
          subtext={alerts.length > 0 ? 'نیازمند بررسی تیم درمان' : 'بدون هشدار فعال'}
          icon={AlertTriangle}
          variant={alerts.length > 0 ? 'red' : 'default'}
          onClick={() => onNavigateToView('alerts')}
        />
      </div>

      {/* Active Alerts Banner if any */}
      {alerts.length > 0 && (
        <div className="bg-red-50/90 border border-red-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-red-900 font-bold text-xs">
              <ShieldAlert className="w-4 h-4 text-red-700" />
              <span>هشدارهای ایمنی فعال تحت نظارت پزشک ({alerts.length})</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToView('alerts')}
              className="text-xs text-red-700 font-semibold hover:underline flex items-center gap-1"
            >
              <span>مشاهده جزئیات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 2).map((alt) => (
              <div
                key={alt.id}
                className="bg-white border border-red-200 rounded-xl p-3 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <AlertBadge severity={alt.severity} />
                    <span>{alt.title}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">{alt.message}</p>
                </div>
                <AlertBadge status={alt.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Pain Trend Chart + Recent Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7-Day Pain Trend Visualizer) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">نمودار روند شدت درد در ۷ روز گذشته</h3>
              <p className="text-xs text-slate-500">میانگین روزانه درد ثبت‌شده در سیستم</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateToView('history')}
              className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline flex items-center gap-1"
            >
              <span>تاریخچه کامل</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Custom SVG Visual Timeline Chart */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="h-44 flex items-end justify-between gap-2 sm:gap-3 pt-6 pb-2 px-1">
              {last7DaysChartData.map((d) => {
                const heightPercent = d.value !== null ? (d.value / 10) * 100 : 0;
                const barColor =
                  d.value === null
                    ? 'bg-slate-200'
                    : d.value >= 7
                    ? 'bg-red-500 hover:bg-red-600'
                    : d.value >= 4
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-emerald-500 hover:bg-emerald-600';

                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Value Tooltip Label */}
                    <div className="text-[10px] font-mono font-bold text-slate-700 mb-1 opacity-80 group-hover:opacity-100 transition-opacity" dir="ltr">
                      {d.value !== null ? `${d.value}` : '—'}
                    </div>

                    {/* Bar Pillar */}
                    <div className="w-full max-w-[32px] bg-slate-200/70 rounded-t-lg h-32 flex items-end p-0.5">
                      <div
                        style={{ height: `${Math.max(8, heightPercent)}%` }}
                        className={`w-full rounded-md transition-all duration-300 ${barColor} shadow-xs`}
                      />
                    </div>

                    {/* Day & Date Label */}
                    <div className="mt-2 text-center">
                      <div className="text-[11px] font-bold text-slate-700">{d.day}</div>
                      <div className="text-[9px] text-slate-400 font-mono" dir="ltr">
                        {format(parseISO(d.date), 'M/d')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Threshold Guide */}
            <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span>
                <span>خفیف (۰ تا ۳)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span>
                <span>متوسط (۴ تا ۶)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span>
                <span>شدید (۷ تا ۱۰)</span>
              </div>
            </div>
          </div>

          {/* Quick Doctor Recommendations Banner */}
          {latestDoctorNote && (
            <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                  <Stethoscope className="w-4 h-4 text-teal-700" />
                  <span>توصیه و برنامه مراقبتی پزشک ({latestDoctorNote.doctorName})</span>
                </div>
                {latestDoctorNote.followUpDate && (
                  <span className="text-[11px] font-semibold text-teal-800 bg-white px-2 py-0.5 rounded-md border border-teal-200">
                    ویزیت بعدی: {latestDoctorNote.followUpDate}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">
                {latestDoctorNote.treatmentPlan}
              </p>
              <button
                type="button"
                onClick={() => onNavigateToView('reports')}
                className="text-[11px] font-bold text-teal-800 hover:text-teal-950 hover:underline"
              >
                مشاهده کامل ارزیابی بالینی و دستور دارویی پزشک ←
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Recent Pain Entries */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">آخرین نوبت‌های درد ثبت‌شده</h3>
                <p className="text-xs text-slate-500">گزارش‌های اخیر محل و نوع درد</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToView('history')}
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 hover:underline"
              >
                مشاهده همه
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {entries.slice(0, 4).map((entry) => {
                let formattedTime = '';
                try {
                  formattedTime = format(parseISO(entry.recordedAt), 'd MMM، HH:mm', { locale: faIR });
                } catch (e) {
                  formattedTime = entry.recordedAt;
                }

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="py-3 first:pt-0 last:pb-0 hover:bg-slate-50 p-2 rounded-xl cursor-pointer transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {entry.locations[0]?.zoneName || 'کل بدن'}
                          {entry.locations.length > 1 && ` (+${entry.locations.length - 1} ناحیه دیگر)`}
                        </span>
                        {entry.isEmergency && (
                          <span className="text-[9px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                            اورژانسی
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>{formattedTime}</span>
                        {entry.painTypeName && (
                          <>
                            <span>•</span>
                            <span className="truncate">{entry.painTypeName}</span>
                          </>
                        )}
                      </div>

                      {entry.medicationLog && (
                        <div className="text-[10px] text-indigo-700 flex items-center gap-1 font-medium">
                          <Pill className="w-3 h-3" />
                          <span>{entry.medicationLog.medicationName} ({entry.medicationLog.dosage})</span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1">
                      <PainLevelBadge level={entry.painLevel} size="md" />
                      <ChevronLeft className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                );
              })}

              {entries.length === 0 && (
                <div className="py-8 text-center text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-slate-600">هنوز نوبت دردی ثبت نشده است</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    جهت ثبت و نقشه‌برداری علائم درد، روی دکمه زیر کلیک کنید.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onOpenLogModal}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت سریع نوبت درد جدید</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <PainEntryDetailModal
        entry={selectedEntry}
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
};
