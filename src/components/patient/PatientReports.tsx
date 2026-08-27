import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storageService';
import { FileText, Printer } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale';

export const PatientReports: React.FC = () => {
  const { currentUser } = useAuth();
  const [dateRangeDays, setDateRangeDays] = useState<number>(30);

  if (!currentUser) return null;

  const profile = currentUser.profile as any;
  const allEntries = StorageService.getPatientPainEntries(currentUser.id);
  const cutoffTime = Date.now() - dateRangeDays * 86400000;
  const filteredEntries = allEntries.filter((e) => new Date(e.recordedAt).getTime() >= cutoffTime);

  const doctorNotes = StorageService.getDoctorNotes(currentUser.id);
  const alerts = StorageService.getClinicalAlerts(currentUser.id);

  // Compute stats
  const totalLogs = filteredEntries.length;
  const avgPain =
    totalLogs > 0
      ? (filteredEntries.reduce((s, e) => s + e.painLevel, 0) / totalLogs).toFixed(1)
      : '۰.۰';

  const maxPain =
    totalLogs > 0 ? Math.max(...filteredEntries.map((e) => e.painLevel)) : 0;

  // Zone frequency map
  const zoneCounts: Record<string, number> = {};
  filteredEntries.forEach((e) => {
    e.locations.forEach((l) => {
      zoneCounts[l.zoneName] = (zoneCounts[l.zoneName] || 0) + 1;
    });
  });
  const topZones = Object.entries(zoneCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      {/* Configuration Header (Hidden during print) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-700" />
            گزارش جامع بالینی و پایش دوره‌ای درد
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            خروجی استاندارد پزشکی جهت ویزیت‌های دوره‌ای، ارائه به پزشک معالج و کمیسیون‌های تخصصی
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dateRangeDays}
            onChange={(e) => setDateRangeDays(Number(e.target.value))}
            className="text-xs rounded-xl border-slate-300 py-2 px-3 bg-white font-medium shadow-xs"
          >
            <option value={7}>۷ روز گذشته</option>
            <option value={14}>۱۴ روز گذشته</option>
            <option value={30}>۳۰ روز گذشته (ماهانه)</option>
            <option value={90}>۹۰ روز گذشته (فصلی)</option>
            <option value={365}>یک سال گذشته</option>
          </select>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>چاپ / دریافت فایل PDF</span>
          </button>
        </div>
      </div>

      {/* Standardized Printable Clinical Document */}
      <div className="bg-white border border-slate-300 rounded-2xl p-8 shadow-md print:border-none print:shadow-none print:p-0 space-y-6">
        {/* Document Header */}
        <div className="border-b-2 border-teal-800 pb-4 flex items-start justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-teal-800">
              دپارتمان تخصصی پایش و طب تسکینی دردهای مزمن
            </div>
            <h2 className="text-2xl font-black text-slate-900 mt-0.5">
              خلاصه وضعیت بالینی و سوابق ثبت‌شده درد
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              بازه زمانی بررسی: {dateRangeDays} روز گذشته (تاریخ صدور: {format(new Date(), 'd MMMM yyyy - ساعت HH:mm', { locale: faIR })})
            </p>
          </div>

          <div className="text-left" dir="ltr">
            <div className="text-sm font-black text-teal-800">PainTracker™ Clinical Suite</div>
            <div className="text-[10px] text-slate-400 font-mono">EMR Doc ID: RPT-{currentUser.id.slice(-6).toUpperCase()}</div>
          </div>
        </div>

        {/* Patient & Provider Demographics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium block text-[10px]">نام و نام خانوادگی بیمار</span>
            <span className="font-bold text-slate-900 text-sm">
              {profile.firstName} {profile.lastName}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block text-[10px]">تاریخ تولد / جنسیت</span>
            <span className="font-bold text-slate-800">
              {profile.dateOfBirth || '۱۳۶۷/۰۱/۲۳'} ({profile.gender === 'Female' || profile.gender === 'زن' ? 'خانم' : 'آقا'})
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block text-[10px]">تشخیص اصلی بالینی</span>
            <span className="font-bold text-slate-800">
              {profile.primaryDiagnosis || 'سندرم درد مزمن کمری و رادیکولوپاتی'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block text-[10px]">پزشک معالج پرونده</span>
            <span className="font-bold text-teal-800">
              {profile.assignedDoctorName || 'دکتر رضا مرادی (متخصص بیهوشی و فلوشیپ درد)'}
            </span>
          </div>
        </div>

        {/* Key Aggregate Clinical Metrics */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
            شاخص‌های کلیدی وضعیت بیمار در دوره ({dateRangeDays} روز گذشته)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <span className="text-[10px] text-slate-400 font-semibold">تعداد دفعات ثبت درد</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalLogs} نوبت</div>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <span className="text-[10px] text-slate-400 font-semibold">میانگین شدت درد</span>
              <div className="text-xl font-extrabold text-teal-900 mt-0.5" dir="ltr">{avgPain} / ۱۰</div>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <span className="text-[10px] text-slate-400 font-semibold">حداکثر درد تجربه شده</span>
              <div className="text-xl font-extrabold text-red-900 mt-0.5" dir="ltr">{maxPain} / ۱۰</div>
            </div>
            <div className="border border-slate-200 rounded-xl p-3 bg-white">
              <span className="text-[10px] text-slate-400 font-semibold">هشدارهای بالینی سیستم</span>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{alerts.length} مورد</div>
            </div>
          </div>
        </div>

        {/* Most Frequent Anatomical Sites */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            شایع‌ترین نواحی درگیر آناتومیک در حملات
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {topZones.map(([name, count]) => (
              <div
                key={name}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-800">{name}</span>
                <span className="font-mono font-bold text-teal-800 bg-white border border-slate-200 px-2 py-0.5 rounded" dir="ltr">
                  {count} بار ({Math.round((count / (totalLogs || 1)) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Flare History Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            جدول نمونه نوبت‌های ثبت‌شده اخیر
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-right">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">تاریخ و زمان</th>
                  <th className="p-2.5">شدت درد</th>
                  <th className="p-2.5">ناحیه درگیر</th>
                  <th className="p-2.5">کیفیت / مدت</th>
                  <th className="p-2.5">داروی مصرفی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.slice(0, 8).map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-medium text-slate-900">
                      {format(parseISO(entry.recordedAt), 'd MMM yyyy - HH:mm', { locale: faIR })}
                    </td>
                    <td className="p-2.5 font-mono font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] ${
                          entry.painLevel >= 7
                            ? 'bg-red-100 text-red-900'
                            : entry.painLevel >= 4
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                        dir="ltr"
                      >
                        {entry.painLevel}/۱۰
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-700">
                      {entry.locations.map((l) => l.zoneName).join('، ')}
                    </td>
                    <td className="p-2.5 text-slate-600">
                      {entry.painTypeName || 'درد مبهم'} ({entry.durationLabel || '۳۰ دقیقه'})
                    </td>
                    <td className="p-2.5 text-slate-800">
                      {entry.medicationLog
                        ? `${entry.medicationLog.medicationName} (${entry.medicationLog.dosage})`
                        : 'بدون دارو'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Doctor Assessment & Treatment Plan Block */}
        {doctorNotes[0] && (
          <div className="border border-slate-200 rounded-xl p-4 bg-teal-50/30 text-xs space-y-2">
            <div className="flex items-center justify-between font-bold text-teal-900">
              <span>دستورالعمل و برنامه درمانی پزشک معالج ({doctorNotes[0].doctorName})</span>
              <span className="font-mono text-[11px]">{doctorNotes[0].recordedAt.slice(0, 10)}</span>
            </div>
            <p className="text-slate-700 leading-relaxed italic">
              «{doctorNotes[0].treatmentPlan}»
            </p>
            {doctorNotes[0].prescriptionsChanged && (
              <p className="text-[11px] font-semibold text-teal-800">
                تغییرات دارویی ثبت‌شده: {doctorNotes[0].prescriptionsChanged}
              </p>
            )}
          </div>
        )}

        {/* Clinician Signature Section */}
        <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-800">تأییدیه پزشک معالج:</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
              داده‌های ثبت‌شده و گزارش اثربخشی داروها توسط اینجانب بررسی و در روند درمان بیمار لحاظ گردید.
            </p>
          </div>
          <div className="border-t border-slate-400 w-48 text-center pt-1 font-mono text-slate-700">
            محل امضا و مهر پزشک معالج
          </div>
        </div>
      </div>
    </div>
  );
};
