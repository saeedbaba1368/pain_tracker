import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/common/Header';
import { PatientDashboard } from './components/patient/PatientDashboard';
import { PainHistoryView } from './components/patient/PainHistoryView';
import { MedicationTracker } from './components/patient/MedicationTracker';
import { PatientReports } from './components/patient/PatientReports';
import { PatientProfileView } from './components/patient/PatientProfileView';
import { DoctorPortal } from './components/doctor/DoctorPortal';
import { OperatorPortal } from './components/operator/OperatorPortal';
import { AdminPortal } from './components/admin/AdminPortal';
import { AddPainEntryModal } from './components/patient/AddPainEntryModal';
import { ClinicalAlert } from './types';
import {
  LayoutDashboard,
  Clock,
  Pill,
  FileText,
  User,
  AlertTriangle,
  X,
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentRole, refreshUserData } = useAuth();
  const [activePatientTab, setActivePatientTab] = useState<
    'dashboard' | 'history' | 'medications' | 'reports' | 'profile' | 'alerts' | 'doctor-notes'
  >('dashboard');
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [alertToast, setAlertToast] = useState<ClinicalAlert | null>(null);

  const handleEntrySuccess = (triggeredAlerts: ClinicalAlert[]) => {
    refreshUserData();
    if (triggeredAlerts.length > 0) {
      setAlertToast(triggeredAlerts[0]);
      setTimeout(() => setAlertToast(null), 8000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-900 font-sans antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* Primary Sticky Header with Role Portal Switcher & Live Notifications */}
      <Header
        onOpenNewEntryModal={() => setIsLogModalOpen(true)}
        onNavigateToView={(viewId) => {
          if (currentRole === 'PATIENT') {
            setActivePatientTab(viewId as any);
          }
        }}
      />

      {/* Patient Sub-Navigation Bar (Only shown when viewing as Patient) */}
      {currentRole === 'PATIENT' && (
        <div className="bg-white border-b border-slate-200 shadow-2xs sticky top-16 z-30">
          <div className="max-w-7xl mx-auto px-3 sm:px-6">
            <nav className="flex space-x-reverse space-x-1 sm:space-x-4 overflow-x-auto py-2 no-scrollbar">
              {[
                { id: 'dashboard', label: 'داشبورد کلی', icon: LayoutDashboard },
                { id: 'history', label: 'دفترچه ثبت درد', icon: Clock },
                { id: 'medications', label: 'مدیریت داروها', icon: Pill },
                { id: 'reports', label: 'گزارش‌های بالینی', icon: FileText },
                { id: 'profile', label: 'پرونده بیمار', icon: User },
              ].map((tab) => {
                const isActive = activePatientTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActivePatientTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 border border-teal-200 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main View Body */}
      <main className="flex-1 p-3 sm:p-6 max-w-7xl w-full mx-auto">
        {currentRole === 'PATIENT' && (
          <>
            {activePatientTab === 'dashboard' && (
              <PatientDashboard
                onOpenLogModal={() => setIsLogModalOpen(true)}
                onNavigateToView={(v) => setActivePatientTab(v as any)}
              />
            )}
            {activePatientTab === 'history' && (
              <PainHistoryView onOpenLogModal={() => setIsLogModalOpen(true)} />
            )}
            {activePatientTab === 'medications' && <MedicationTracker />}
            {activePatientTab === 'reports' && <PatientReports />}
            {activePatientTab === 'profile' && <PatientProfileView />}
          </>
        )}

        {currentRole === 'DOCTOR' && <DoctorPortal />}

        {currentRole === 'OPERATOR' && <OperatorPortal />}

        {currentRole === 'ADMIN' && <AdminPortal />}
      </main>

      {/* Floating Clinical Alert Toast */}
      {alertToast && (
        <div className="fixed bottom-6 left-6 z-50 max-w-md bg-red-950 border border-red-500/50 text-white rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-200 flex items-start gap-3 text-right">
          <div className="p-2 rounded-xl bg-red-600/30 text-red-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="font-extrabold uppercase tracking-wider text-red-300 text-[10px]">
                هشدار ایمنی بالینی ({alertToast.severity === 'CRITICAL' ? 'اورژانسی' : 'فوری'})
              </span>
              <button
                type="button"
                onClick={() => setAlertToast(null)}
                className="text-red-400 hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="font-bold text-white mt-0.5">{alertToast.title}</h4>
            <p className="text-red-200/90 mt-1 leading-relaxed">{alertToast.message}</p>
          </div>
        </div>
      )}

      {/* Global Rapid Pain Entry Modal */}
      <AddPainEntryModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        onSuccess={handleEntrySuccess}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
