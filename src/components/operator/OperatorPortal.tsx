import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';
import { StorageService } from '../../services/storageService';
import { StatsCard } from '../common/StatsCard';
import { PainLevelBadge } from '../common/PainLevelBadge';
import { AlertBadge } from '../common/AlertBadge';
import { AddPainEntryModal } from '../patient/AddPainEntryModal';
import {
  ClipboardCheck,
  PhoneCall,
  UserPlus,
  Activity,
  AlertTriangle,
  Search,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Users,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale';

export const OperatorPortal: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string>('usr-patient-1');
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'INTAKE' | 'TRIAGE_DISPATCH' | 'NEW_PATIENT'>('INTAKE');

  // New Patient Form state
  const [newFirstName, setNewFirstName] = useState<string>('');
  const [newLastName, setNewLastName] = useState<string>('');
  const [newDob, setNewDob] = useState<string>('');
  const [newDiagnosis, setNewDiagnosis] = useState<string>('');
  const [newGender, setNewGender] = useState<string>('Female');
  const [creationSuccess, setCreationSuccess] = useState<string | null>(null);

  const allUsers = StorageService.getUsers();
  const patients = allUsers.filter((u) => u.role === 'PATIENT');
  const alerts = StorageService.getClinicalAlerts();
  const unreviewedAlerts = alerts.filter((a) => a.status === 'NEW' || a.status === 'ACKNOWLEDGED');

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const selectedPatientEntries = selectedPatient
    ? StorageService.getPatientPainEntries(selectedPatient.id)
    : [];

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirstName || !newLastName) return;

    const newId = `usr-patient-${Date.now()}`;
    const newUsername = `pat_${newFirstName.toLowerCase()}${Math.floor(100 + Math.random() * 900)}`;

    const newUser: User = {
      id: newId,
      username: newUsername,
      role: 'PATIENT',
      isActive: true,
      createdAt: new Date().toISOString(),
      profile: {
        firstName: newFirstName,
        lastName: newLastName,
        dateOfBirth: newDob || '1369/01/01',
        gender: newGender,
        phone: '۰۹۱۲۰۰۰۰۰۰۰',
        bloodType: 'O+',
        primaryDiagnosis: newDiagnosis || 'ارزیابی دردهای مزمن',
        assignedDoctorId: 'usr-doctor-1',
        assignedDoctorName: 'دکتر رضا مرادی',
        emergencyContactName: 'بستگان درجه یک',
        emergencyContactPhone: '۰۹۱۲۱۱۱۱۱۱۱',
        emergencyContactRelation: 'همسر',
      },
    };

    StorageService.saveUser(newUser);
    StorageService.logAudit({
      userId: currentUser?.id || 'usr-operator-1',
      userName: `${(currentUser?.profile as any)?.firstName || 'سارا'} ${(currentUser?.profile as any)?.lastName || 'رحیمی'}`,
      userRole: 'OPERATOR',
      action: 'CREATE_PATIENT',
      entityType: 'User',
      entityId: newId,
      description: `اپراتور پذیرش بیمار جدید ${newFirstName} ${newLastName} (نام کاربری: ${newUsername}) را ثبت نمود`,
    });

    setCreationSuccess(`بیمار ${newFirstName} ${newLastName} با موفقیت در سامانه پذیرش شد!`);
    setSelectedPatientId(newId);
    setNewFirstName('');
    setNewLastName('');
    setNewDiagnosis('');
    setTimeout(() => {
      setCreationSuccess(null);
      setActiveTab('INTAKE');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      {/* Operator Header Banner */}
      <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-900 text-indigo-200 border border-indigo-700 flex items-center gap-1">
              <ClipboardCheck className="w-3 h-3" />
              میز کار اپراتور پذیرش و تله‌مدیسین
            </span>
            <span className="text-xs text-slate-400">مرکز تریاژ بالینی و پشتیبانی تلفنی</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1.5 tracking-tight">
            ثبت نیابتی گزارش درد و هدایت هشدارهای تریاژ
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl font-medium">
            ثبت سریع حملات درد به نیابت از تماس‌گیرندگان تلفنی، پذیرش سریع بیماران و ارجاع هشدارهای اورژانسی به پزشکان کشیک
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <PhoneCall className="w-4 h-4" />
          <span>فرم پذیرش تلفنی جدید</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="بیماران فعال در سامانه"
          value={patients.length}
          subtext="پرونده‌های فعال کلینیک"
          icon={Users}
          variant="default"
        />
        <StatsCard
          title="هشدارهای در انتظار ارجاع"
          value={unreviewedAlerts.length}
          subtext="نیازمند دیسپچ بالینی"
          icon={AlertTriangle}
          variant={unreviewedAlerts.length > 0 ? 'red' : 'emerald'}
        />
        <StatsCard
          title="پذیرش‌های ثبت‌شده امروز"
          value="۱۴"
          subtext="تماس تلفنی و حضوری"
          icon={Activity}
          variant="teal"
        />
        <StatsCard
          title="میانگین زمان ثبت گزارش"
          value="۴۸ ثانیه"
          subtext="روند ثبت سریع زیر ۱ دقیقه"
          icon={Clock}
          variant="emerald"
        />
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl px-4 shadow-xs gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('INTAKE')}
          className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'INTAKE'
              ? 'border-indigo-700 text-indigo-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>کنسول ثبت نیابتی درد</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('TRIAGE_DISPATCH')}
          className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'TRIAGE_DISPATCH'
              ? 'border-indigo-700 text-indigo-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <span>هدایت و ارجاع هشدارها ({unreviewedAlerts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('NEW_PATIENT')}
          className={`py-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'NEW_PATIENT'
              ? 'border-indigo-700 text-indigo-950'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4 text-teal-700" />
          <span>پذیرش سریع بیمار جدید</span>
        </button>
      </div>

      {/* TAB 1: INTAKE CONSOLE */}
      {activeTab === 'INTAKE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
          {/* Right/Left: Patient Selector */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                ۱. انتخاب بیمار جهت ثبت گزارش تلفنی
              </h3>
              <p className="text-xs text-slate-500">برای باز شدن فرم ثبت گزارش، بیمار را از لیست انتخاب کنید</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام بیمار یا نام کاربری..."
                className="w-full pr-9 pl-3 py-1.5 text-xs rounded-xl border-slate-200 shadow-xs text-right"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pl-1">
              {patients
                .filter((p) => {
                  const name = `${(p.profile as any).firstName} ${(p.profile as any).lastName}`.toLowerCase();
                  return name.includes(searchQuery.toLowerCase()) || p.username.toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map((pat) => {
                  const prof = pat.profile as any;
                  const isSelected = pat.id === selectedPatient?.id;
                  return (
                    <div
                      key={pat.id}
                      onClick={() => setSelectedPatientId(pat.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between ${
                        isSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {prof.firstName} {prof.lastName}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {pat.username} • تشخیص: {prof.primaryDiagnosis || 'درد مزمن'}
                        </div>
                      </div>
                      {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600"></span>}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Left/Right: Selected Patient Intake Workspace */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-5">
            {selectedPatient ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">پرونده بیمار منتخب</span>
                    <h2 className="text-lg font-black text-slate-900">
                      {(selectedPatient.profile as any).firstName} {(selectedPatient.profile as any).lastName}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      پزشک معالج: {(selectedPatient.profile as any).assignedDoctorName || 'دکتر رضا مرادی'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLogModal(true)}
                    className="bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ثبت حمله درد جدید</span>
                  </button>
                </div>

                {/* Recent Logs Preview */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    سوابق نوبت‌های ثبت‌شده اخیر ({selectedPatientEntries.length})
                  </h4>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {selectedPatientEntries.map((entry) => (
                      <div key={entry.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-900">
                            {entry.locations.map((l) => l.zoneName).join('، ')}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {format(parseISO(entry.recordedAt), 'd MMM - ساعت HH:mm', { locale: faIR })}
                          </div>
                        </div>
                        <PainLevelBadge level={entry.painLevel} size="sm" />
                      </div>
                    ))}
                    {selectedPatientEntries.length === 0 && (
                      <div className="p-4 text-center text-slate-400 text-xs">هنوز سابقه‌ای برای این بیمار ثبت نشده است</div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-400">یک بیمار را از لیست سمت راست انتخاب کنید</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRIAGE DISPATCH */}
      {activeTab === 'TRIAGE_DISPATCH' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
              تریاژ هشدارهای بالینی و ارسال اعلان به پزشک کشیک
            </h3>
            <span className="text-xs font-mono text-slate-500">{alerts.length} مورد کل</span>
          </div>

          <div className="space-y-3">
            {alerts.map((alt) => (
              <div
                key={alt.id}
                className="border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertBadge severity={alt.severity} />
                    <span className="font-bold text-slate-900">{alt.title}</span>
                    <span className="text-slate-500">({alt.patientName})</span>
                  </div>
                  <p className="text-slate-600 text-xs">{alt.message}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <AlertBadge status={alt.status} />
                  <button
                    type="button"
                    onClick={() => {
                      StorageService.updateAlertStatus(alt.id, 'ACKNOWLEDGED', 'سارا رحیمی (اپراتور تریاژ)');
                      alert(`هشدار بالینی تایید شد و به پزشک کشیک ارجاع داده شد.`);
                    }}
                    className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>ارجاع فوری به پزشک</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REGISTER NEW PATIENT */}
      {activeTab === 'NEW_PATIENT' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-5 animate-in fade-in duration-150 text-right">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">پذیرش و تشکیل پرونده بیمار جدید</h3>
            <p className="text-xs text-slate-500 mt-0.5">ثبت مشخصات اولیه بیمار در سامانه پرونده الکترونیک درمانگاه</p>
          </div>

          {creationSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{creationSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreatePatient} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نام بیمار *</label>
                <input
                  type="text"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 focus:border-indigo-700"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">نام خانوادگی *</label>
                <input
                  type="text"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 focus:border-indigo-700"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">تاریخ تولد</label>
                <input
                  type="date"
                  value={newDob}
                  onChange={(e) => setNewDob(e.target.value)}
                  className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">جنسیت</label>
                <select
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                  className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 bg-white"
                >
                  <option value="Female">زن</option>
                  <option value="Male">مرد</option>
                  <option value="Other">سایر</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">تشخیص اولیه / شکایت اصلی بیمار</label>
              <input
                type="text"
                value={newDiagnosis}
                onChange={(e) => setNewDiagnosis(e.target.value)}
                placeholder="مثال: میگرن مزمن همراه با دردهای گردنی"
                className="w-full text-xs rounded-xl border-slate-300 py-2 px-3"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              ثبت پرونده و شروع پذیرش
            </button>
          </form>
        </div>
      )}

      {/* Rapid Pain Entry Modal */}
      <AddPainEntryModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSuccess={() => {
          alert('گزارش درد بیمار با موفقیت در پرونده ثبت شد.');
        }}
      />
    </div>
  );
};
