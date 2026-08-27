import React, { useState } from 'react';
import { User, PainEntry, AlertStatus } from '../../types';
import { StorageService } from '../../services/storageService';
import { BodyMap } from '../bodymap/BodyMap';
import { PainLevelBadge } from '../common/PainLevelBadge';
import { AlertBadge } from '../common/AlertBadge';
import { AddDoctorNoteModal } from './AddDoctorNoteModal';
import { PainEntryDetailModal } from '../patient/PainEntryDetailModal';
import {
  FileText,
  CheckCircle2,
  Stethoscope,
  Plus,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale';

interface DoctorPatientDetailProps {
  patient: User;
  onBack: () => void;
  onRefresh: () => void;
}

export const DoctorPatientDetail: React.FC<DoctorPatientDetailProps> = ({
  patient,
  onBack,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TRAJECTORY' | 'LOGBOOK' | 'ALERTS' | 'NOTES'>('OVERVIEW');
  const [showAddNoteModal, setShowAddNoteModal] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<PainEntry | null>(null);

  const profile = patient.profile as any;
  const entries = StorageService.getPatientPainEntries(patient.id);
  const alerts = StorageService.getClinicalAlerts(patient.id);
  const doctorNotes = StorageService.getDoctorNotes(patient.id);

  // Compute patient stats
  const totalEntries = entries.length;
  const latestEntry = entries[0];
  const latestPain = latestEntry ? latestEntry.painLevel : 0;
  const unreviewedAlerts = alerts.filter((a) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED');

  const last7DaysEntries = entries.filter((e) => {
    const d = new Date(e.recordedAt).getTime();
    return d >= Date.now() - 7 * 86400000;
  });
  const avg7Day =
    last7DaysEntries.length > 0
      ? (last7DaysEntries.reduce((s, e) => s + e.painLevel, 0) / last7DaysEntries.length).toFixed(1)
      : latestPain.toString();

  // Zone Heatmap calculation
  const zoneCounts: Record<string, number> = {};
  const zoneMaxIntensities: Record<string, number> = {};
  entries.forEach((e) => {
    e.locations.forEach((loc) => {
      zoneCounts[loc.zoneId] = (zoneCounts[loc.zoneId] || 0) + 1;
      const intensity = loc.intensity ?? e.painLevel;
      if (!zoneMaxIntensities[loc.zoneId] || intensity > zoneMaxIntensities[loc.zoneId]) {
        zoneMaxIntensities[loc.zoneId] = intensity;
      }
    });
  });

  const highlightedZoneList = Object.keys(zoneCounts).map((zId) => ({
    zoneId: zId,
    intensity: zoneMaxIntensities[zId] || 5,
  }));

  const handleUpdateAlertStatus = (alertId: string, newStatus: AlertStatus) => {
    StorageService.updateAlertStatus(alertId, newStatus, 'دکتر رضا مرادی');
    onRefresh();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      {/* Top Breadcrumb & Patient Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>بازگشت به فهرست بیماران</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddNoteModal(true)}
            className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت ارزیابی و نسخه درمانی</span>
          </button>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center text-xl font-black shrink-0 shadow-md">
              {profile.firstName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">
                  {profile.firstName} {profile.lastName}
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700" dir="ltr">
                  {patient.username}
                </span>
                {unreviewedAlerts.length > 0 && (
                  <span className="text-[11px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full border border-red-200 animate-pulse">
                    {unreviewedAlerts.length} هشدار فعال
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                <span>تاریخ تولد: {profile.dateOfBirth || '۱۳۶۷/۰۱/۲۳'}</span>
                <span>•</span>
                <span>جنسیت: {profile.gender === 'Female' || profile.gender === 'زن' ? 'خانم' : 'آقا'}</span>
                <span>•</span>
                <span dir="ltr">گروه خونی: {profile.bloodType || 'A+'}</span>
                <span>•</span>
                <span className="text-teal-800 font-semibold">
                  تشخیص: {profile.primaryDiagnosis || 'درد مزمن'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-400 block">شدت آخرین حمله</span>
              <PainLevelBadge level={latestPain} size="lg" showLabel />
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Mini-Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400">مجموع ثبت‌های بیمار</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">{totalEntries} مورد</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400">میانگین درد ۷ روز اخیر</span>
            <div className="text-lg font-black text-teal-800 mt-0.5" dir="ltr">{avg7Day} / ۱۰</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400">هشدارهای فعال بالینی</span>
            <div className={`text-lg font-black mt-0.5 ${unreviewedAlerts.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>
              {unreviewedAlerts.length} مورد بررسی‌نشده
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400">یادداشت‌های پزشک</span>
            <div className="text-lg font-black text-slate-900 mt-0.5">{doctorNotes.length} گزارش</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-4 shadow-xs gap-4 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: '۱. نقشه آناتومیک و توزیع درد', count: undefined },
          { id: 'TRAJECTORY', label: '۲. نمودار نوسانات و سیر زمانی درد', count: undefined },
          { id: 'LOGBOOK', label: '۳. تاریخچه و ریزگزارش‌های بیمار', count: entries.length },
          { id: 'ALERTS', label: '۴. تریاژ و هشدارهای بالینی', count: unreviewedAlerts.length },
          { id: 'NOTES', label: '۵. ارزیابی‌ها و دستورات دارویی', count: doctorNotes.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === tab.id
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold font-mono ${
                  tab.id === 'ALERTS' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & ANATOMICAL HEATMAP */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                نقشه حرارتی و استقرار تجمیعی درد
              </h3>
              <p className="text-xs text-slate-500">
                توزیع بصری نواحی درگیر در طول {totalEntries} حمله بالینی ثبت‌شده
              </p>
            </div>

            <BodyMap
              selectedZones={Object.keys(zoneCounts)}
              highlightedZones={highlightedZoneList}
              onZoneToggle={() => {}}
              readOnly={true}
            />
          </div>

          <div className="lg:col-span-6 space-y-6">
            {/* Top Pain Locations */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                تفکیک فراوانی نواحی درگیر آناتومیک
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pl-1">
                {Object.entries(zoneCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([zId, count]) => (
                    <div
                      key={zId}
                      className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900">
                          {zId}
                        </span>
                        <div className="text-[11px] text-slate-500">
                          حداکثر شدت ثبت‌شده: {zoneMaxIntensities[zId] || 5}/۱۰
                        </div>
                      </div>
                      <div className="text-left">
                        <span className="font-mono font-bold text-teal-900 bg-teal-50 px-2 py-0.5 rounded border border-teal-200" dir="ltr">
                          {count} مورد ({Math.round((count / (totalEntries || 1)) * 100)}%)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Latest Doctor Plan */}
            {doctorNotes[0] && (
              <div className="bg-teal-50/50 border border-teal-200 rounded-2xl p-5 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-teal-900">
                  <div className="flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-700" />
                    <span>آخرین ارزیابی پزشک ({doctorNotes[0].doctorName})</span>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">
                    {doctorNotes[0].recordedAt.slice(0, 10)}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  «{doctorNotes[0].assessment}»
                </p>
                <div className="pt-2 border-t border-teal-200/60 text-xs">
                  <span className="font-bold text-teal-950">برنامه درمانی: </span>
                  <span className="text-slate-700">{doctorNotes[0].treatmentPlan}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRAJECTORY CHART */}
      {activeTab === 'TRAJECTORY' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">
              نمودار تغییرات زمانی شدت درد
            </h3>
            <p className="text-xs text-slate-500">
              بررسی روند بهبودی، شدت حملات و ارتباط با مصرف مسکن‌ها
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <div className="h-64 flex items-end justify-between gap-2 overflow-x-auto pb-4" dir="ltr">
              {entries.slice().reverse().map((entry) => {
                const heightPercent = (entry.painLevel / 10) * 100;
                const barColor =
                  entry.painLevel >= 7
                    ? 'bg-red-500 hover:bg-red-600'
                    : entry.painLevel >= 4
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-emerald-500 hover:bg-emerald-600';

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="flex flex-col items-center justify-end h-full min-w-[48px] cursor-pointer group"
                  >
                    <div className="text-[10px] font-mono font-bold text-slate-700 mb-1">
                      {entry.painLevel}
                    </div>
                    <div className="w-8 bg-slate-200 rounded-t h-48 flex items-end p-0.5">
                      <div
                        style={{ height: `${Math.max(10, heightPercent)}%` }}
                        className={`w-full rounded-xs transition-all ${barColor}`}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <div className="text-[10px] font-mono text-slate-500">
                        {format(parseISO(entry.recordedAt), 'M/d')}
                      </div>
                      {entry.medicationLog && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mx-auto mt-0.5" title="مصرف دارو" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FULL EPISODE TIMELINE */}
      {activeTab === 'LOGBOOK' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in duration-150">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3">
            سوابق کامل ثبت‌های بالینی بیمار ({entries.length} مورد)
          </h3>
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="py-3 hover:bg-slate-50 p-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span>{format(parseISO(entry.recordedAt), 'EEEE، d MMMM yyyy - ساعت HH:mm', { locale: faIR })}</span>
                    {entry.isEmergency && (
                      <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.2 rounded-full">
                        اورژانسی
                      </span>
                    )}
                  </div>
                  <div className="text-slate-600 flex items-center gap-2">
                    <span className="font-semibold">{entry.locations.map((l) => l.zoneName).join('، ')}</span>
                    <span>•</span>
                    <span>{entry.painTypeName || 'درد مبهم'} ({entry.durationLabel || '۳۰ دقیقه'})</span>
                  </div>
                  {entry.notes && (
                    <p className="text-slate-500 italic text-[11px]">«{entry.notes}»</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <PainLevelBadge level={entry.painLevel} size="md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CLINICAL ALERTS QUEUE */}
      {activeTab === 'ALERTS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              هشدارهای ایمنی هوشمند و تریاژ خطر
            </h3>
            <span className="text-xs text-slate-500 font-mono">{alerts.length} هشدار کل</span>
          </div>

          <div className="space-y-3">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className={`border rounded-xl p-4 transition-colors ${
                  alt.status === 'NEW'
                    ? 'border-red-300 bg-red-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertBadge severity={alt.severity} />
                    <span className="font-bold text-slate-900 text-xs">{alt.title}</span>
                  </div>
                  <AlertBadge status={alt.status} />
                </div>

                <p className="text-xs text-slate-700 mt-2 leading-relaxed">{alt.message}</p>

                <div className="mt-3 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    زمان هشدار: {format(parseISO(alt.createdAt), 'd MMMM yyyy - ساعت HH:mm', { locale: faIR })}
                  </span>

                  <div className="flex items-center gap-2">
                    {alt.status === 'NEW' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateAlertStatus(alt.id, 'ACKNOWLEDGED')}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                      >
                        دریافت شد
                      </button>
                    )}
                    {alt.status !== 'REVIEWED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateAlertStatus(alt.id, 'REVIEWED')}
                        className="px-2.5 py-1 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        ثبت بررسی و اتمام
                      </button>
                    )}
                    {alt.status !== 'DISMISSED' && (
                      <button
                        type="button"
                        onClick={() => handleUpdateAlertStatus(alt.id, 'DISMISSED')}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        نادیده‌گرفتن
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {alerts.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-xs font-semibold text-slate-600">هیچ هشدار فعالی برای این بیمار وجود ندارد</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: DOCTOR ASSESSMENTS & NOTES */}
      {activeTab === 'NOTES' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              ارزیابی‌های بالینی و نسخه‌های درمانی ثبت‌شده
            </h3>
            <button
              type="button"
              onClick={() => setShowAddNoteModal(true)}
              className="bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ثبت ارزیابی جدید</span>
            </button>
          </div>

          <div className="space-y-4">
            {doctorNotes.map((note) => (
              <div
                key={note.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-700" />
                    <span className="font-bold text-slate-900">{note.doctorName}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {format(parseISO(note.recordedAt), 'd MMMM yyyy - ساعت HH:mm', { locale: faIR })}
                  </span>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block mb-1">ارزیابی بالینی پزشک:</span>
                  <p className="text-slate-700 leading-relaxed italic bg-white p-3 rounded-lg border border-slate-100">
                    «{note.assessment}»
                  </p>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block mb-1">دستورالعمل و برنامه درمانی:</span>
                  <p className="text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                    {note.treatmentPlan}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
                  {note.prescriptionsChanged && (
                    <span className="text-indigo-800 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      تغییرات دارویی: {note.prescriptionsChanged}
                    </span>
                  )}
                  {note.followUpDate && (
                    <span className="text-teal-800 font-semibold bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      ویزیت پیگیری: {note.followUpDate}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {doctorNotes.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold text-slate-600">هنوز یادداشت بالینی ثبت نشده است</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Doctor Note Modal */}
      <AddDoctorNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        patient={patient}
        onNoteAdded={() => onRefresh()}
      />

      {/* Single Entry Detail Modal */}
      <PainEntryDetailModal
        entry={selectedEntry}
        isOpen={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  );
};
