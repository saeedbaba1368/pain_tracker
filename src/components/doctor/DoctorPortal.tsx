import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StorageService } from '../../services/storageService';
import { StatsCard } from '../common/StatsCard';
import { PainLevelBadge } from '../common/PainLevelBadge';
import { AlertBadge } from '../common/AlertBadge';
import { DoctorPatientDetail } from './DoctorPatientDetail';
import {
  Stethoscope,
  Users,
  AlertTriangle,
  FileText,
  Search,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale';

export const DoctorPortal: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [triageFilter, setTriageFilter] = useState<'ALL' | 'CRITICAL' | 'FLARE' | 'STABLE'>('ALL');
  const [activeSubTab, setActiveSubTab] = useState<'ROSTER' | 'ALERTS' | 'ALL_NOTES'>('ROSTER');

  // Load all patients and data
  const allUsers = StorageService.getUsers();
  const patients = allUsers.filter((u) => u.role === 'PATIENT');
  const allAlerts = StorageService.getClinicalAlerts();
  const unreviewedAlerts = allAlerts.filter((a) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED');
  const allNotes = StorageService.getDoctorNotes();

  // Aggregate stats
  const totalPatients = patients.length;
  const criticalCount = unreviewedAlerts.filter((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH').length;

  // Selected Patient
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  if (selectedPatient) {
    return (
      <DoctorPatientDetail
        patient={selectedPatient}
        onBack={() => setSelectedPatientId(null)}
        onRefresh={() => {}}
      />
    );
  }

  // Patient Roster Processing with triage calculation
  const patientRosterData = patients.map((pat) => {
    const entries = StorageService.getPatientPainEntries(pat.id);
    const patAlerts = StorageService.getClinicalAlerts(pat.id).filter(
      (a) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED'
    );
    const latestEntry = entries[0];
    const latestPain = latestEntry ? latestEntry.painLevel : 0;
    const hasEmergency = entries.some((e) => e.isEmergency && new Date(e.recordedAt).getTime() >= Date.now() - 3 * 86400000);

    let triageStatus: 'CRITICAL' | 'FLARE' | 'STABLE' = 'STABLE';
    if (patAlerts.some((a) => a.severity === 'CRITICAL' || a.severity === 'HIGH') || hasEmergency) {
      triageStatus = 'CRITICAL';
    } else if (latestPain >= 7 || patAlerts.length > 0) {
      triageStatus = 'FLARE';
    }

    return {
      patient: pat,
      profile: pat.profile as any,
      entriesCount: entries.length,
      latestPain,
      latestEntryDate: latestEntry ? latestEntry.recordedAt : null,
      activeAlerts: patAlerts,
      triageStatus,
    };
  });

  // Filtered Roster
  const filteredRoster = patientRosterData.filter((item) => {
    if (triageFilter !== 'ALL' && item.triageStatus !== triageFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = `${item.profile.firstName} ${item.profile.lastName}`.toLowerCase();
      const diag = (item.profile.primaryDiagnosis || '').toLowerCase();
      const username = item.patient.username.toLowerCase();
      if (!name.includes(q) && !diag.includes(q) && !username.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      {/* Doctor Header Banner */}
      <div className="bg-gradient-to-l from-teal-900 via-slate-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-800 text-teal-200 border border-teal-700 flex items-center gap-1">
              <Stethoscope className="w-3 h-3" />
              پنل تخصصی پزشک و تیم بالینی
            </span>
            <span className="text-xs text-slate-400">مرکز جامع کنترل دردهای مزمن</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight">
            داشبورد تریاژ و پایش بالینی بیماران
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
            پایش برخط شدت درد بیماران، بررسی هشدارهای هوشمند ایمنی و ثبت دستورالعمل‌های درمانی
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="تعداد کل بیماران تحت نظر"
          value={totalPatients}
          subtext="تحت مراقبت تخصصی کلینیک"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="هشدارهای بحرانی و حاد"
          value={criticalCount}
          subtext={criticalCount > 0 ? 'نیازمند مداخله فوری بالینی' : 'بدون آلارم بحرانی'}
          icon={ShieldAlert}
          variant={criticalCount > 0 ? 'red' : 'emerald'}
        />
        <StatsCard
          title="هشدارهای نیازمند بررسی"
          value={unreviewedAlerts.length}
          subtext="در سراسر پرونده‌های بیماران"
          icon={AlertTriangle}
          variant={unreviewedAlerts.length > 0 ? 'amber' : 'default'}
        />
        <StatsCard
          title="طرح‌های درمانی ثبت‌شده"
          value={allNotes.length}
          subtext="ارزیابی‌ها و دستورات دارویی"
          icon={FileText}
          variant="teal"
        />
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-4 shadow-xs gap-4">
        <button
          type="button"
          onClick={() => setActiveSubTab('ROSTER')}
          className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'ROSTER'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>فهرست بیماران و سطح تریاژ ({patients.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('ALERTS')}
          className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'ALERTS'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>صف هشدارهای فعال بالینی</span>
          {unreviewedAlerts.length > 0 && (
            <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono">
              {unreviewedAlerts.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('ALL_NOTES')}
          className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'ALL_NOTES'
              ? 'border-teal-700 text-teal-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-700" />
          <span>تمام یادداشت‌های بالینی پزشکان ({allNotes.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: PATIENT ROSTER */}
      {activeSubTab === 'ROSTER' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">فیلتر تریاژ:</span>
              {[
                { id: 'ALL', label: 'همه بیماران' },
                { id: 'CRITICAL', label: '🚨 وضعیت بحرانی / خطر بالا' },
                { id: 'FLARE', label: '⚠️ شعله‌ور شدن درد' },
                { id: 'STABLE', label: '✅ پایدار و آرام' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setTriageFilter(f.id as any)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                    triageFilter === f.id
                      ? 'bg-teal-800 text-white border-teal-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام بیمار، تشخیص، شناسه پرونده..."
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border-slate-200 shadow-xs focus:border-teal-700 text-right"
              />
            </div>
          </div>

          {/* Patient Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRoster.map((item) => {
              const fullName = `${item.profile.firstName} ${item.profile.lastName}`;
              let lastLogStr = 'هنوز ثبت نشده';
              if (item.latestEntryDate) {
                try {
                  lastLogStr = format(parseISO(item.latestEntryDate), 'd MMM، ساعت HH:mm', { locale: faIR });
                } catch (e) {
                  lastLogStr = item.latestEntryDate;
                }
              }

              return (
                <div
                  key={item.patient.id}
                  onClick={() => setSelectedPatientId(item.patient.id)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-teal-400 cursor-pointer transition-all flex flex-col justify-between group space-y-4"
                >
                  <div>
                    {/* Top Row: Avatar & Triage Flag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-teal-800 text-white flex items-center justify-center font-black text-sm shrink-0">
                          {item.profile.firstName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-teal-900 transition-colors">
                            {fullName}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-mono" dir="ltr">{item.patient.username}</p>
                        </div>
                      </div>

                      {item.triageStatus === 'CRITICAL' && (
                        <span className="text-[10px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full border border-red-200">
                          اورژانسی
                        </span>
                      )}
                      {item.triageStatus === 'FLARE' && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full border border-amber-200">
                          حمله درد
                        </span>
                      )}
                      {item.triageStatus === 'STABLE' && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                          پایدار
                        </span>
                      )}
                    </div>

                    {/* Diagnosis */}
                    <div className="mt-3 text-xs">
                      <span className="text-slate-400 font-medium">تشخیص: </span>
                      <span className="font-semibold text-slate-800">
                        {item.profile.primaryDiagnosis || 'سندرم درد مزمن'}
                      </span>
                    </div>

                    {/* Active Alerts if any */}
                    {item.activeAlerts.length > 0 && (
                      <div className="mt-2 text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg p-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span className="font-bold">{item.activeAlerts.length} هشدار بررسی‌نشده</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Stats & Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">آخرین درد</span>
                      <PainLevelBadge level={item.latestPain} size="md" />
                    </div>

                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 block">آخرین ثبت</span>
                      <span className="text-xs font-semibold text-slate-700">{lastLogStr}</span>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-teal-50 text-slate-400 group-hover:text-teal-700 flex items-center justify-center transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: ACTIVE ALERTS QUEUE */}
      {activeSubTab === 'ALERTS' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              صف یکپارچه هشدارهای ایمنی بالینی سیستم
            </h3>
            <span className="text-xs font-mono text-slate-500">{allAlerts.length} مورد کل</span>
          </div>

          <div className="space-y-3">
            {allAlerts.map((alt) => (
              <div
                key={alt.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-teal-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <AlertBadge severity={alt.severity} />
                    <span className="font-bold text-slate-900">{alt.title}</span>
                    <span className="text-slate-400 font-medium">({alt.patientName})</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">{alt.message}</p>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    زمان ثبت: {format(parseISO(alt.createdAt), 'd MMMM yyyy - HH:mm', { locale: faIR })}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <AlertBadge status={alt.status} />
                  <button
                    type="button"
                    onClick={() => setSelectedPatientId(alt.patientId)}
                    className="px-3 py-1.5 bg-teal-800 hover:bg-teal-900 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>مشاهده پرونده بیمار</span>
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 3: ALL NOTES */}
      {activeSubTab === 'ALL_NOTES' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              دفتر ثبت ارزیابی‌ها و دستورات دارویی پزشکان
            </h3>
            <span className="text-xs font-mono text-slate-500">{allNotes.length} گزارش ثبت‌شده</span>
          </div>

          <div className="space-y-3">
            {allNotes.map((note) => (
              <div
                key={note.id}
                className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-teal-700" />
                    <span className="font-bold text-slate-900">{note.patientName}</span>
                    <span className="text-slate-400">توسط {note.doctorName}</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {format(parseISO(note.recordedAt), 'd MMM yyyy - ساعت HH:mm', { locale: faIR })}
                  </span>
                </div>

                <p className="text-slate-700 italic bg-white p-3 rounded-lg border border-slate-200">
                  «{note.assessment}»
                </p>
                <div className="text-xs">
                  <span className="font-bold text-teal-950">برنامه و دستورات درمانی: </span>
                  <span className="text-slate-700">{note.treatmentPlan}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
