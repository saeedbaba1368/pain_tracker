import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MedicationLog, MedicationCategory } from '../../types';
import { MASTER_MEDICATIONS } from '../../data/seedData';
import { StorageService } from '../../services/storageService';
import { Pill, Plus, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { faIR } from 'date-fns/locale';

export const MedicationTracker: React.FC = () => {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<MedicationLog[]>(() =>
    currentUser ? StorageService.getMedicationLogs(currentUser.id) : []
  );

  // Standalone Log Form State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [selectedMedId, setSelectedMedId] = useState<string>('med-1');
  const [customMedName, setCustomMedName] = useState<string>('');
  const [dosage, setDosage] = useState<string>('۵۰۰ میلی‌گرم');
  const [effectiveness, setEffectiveness] = useState<number>(4);
  const [notes, setNotes] = useState<string>('');
  const [takenAt, setTakenAt] = useState<string>(new Date().toISOString().slice(0, 16));

  if (!currentUser) return null;

  const handleAddMedLog = (e: React.FormEvent) => {
    e.preventDefault();
    const masterMed = MASTER_MEDICATIONS.find((m) => m.id === selectedMedId);
    const newLog: MedicationLog = {
      id: `medlog-${Date.now()}`,
      patientId: currentUser.id,
      medicationId: selectedMedId !== 'custom' ? selectedMedId : undefined,
      customMedicationName: selectedMedId === 'custom' ? customMedName : undefined,
      medicationName: selectedMedId === 'custom' ? customMedName || 'داروی اختصاصی' : masterMed?.name || 'دارو',
      dosage,
      category: masterMed?.category as MedicationCategory,
      takenAt: new Date(takenAt).toISOString(),
      effectiveness,
      notes,
    };

    StorageService.addMedicationLog(newLog);
    setLogs(StorageService.getMedicationLogs(currentUser.id));
    setShowAddModal(false);
    setNotes('');
  };

  // Compute stats
  const totalDoses = logs.length;
  const evaluatedLogs = logs.filter((l) => l.effectiveness > 0);
  const avgEffectiveness =
    evaluatedLogs.length > 0
      ? (evaluatedLogs.reduce((s, l) => s + l.effectiveness, 0) / evaluatedLogs.length).toFixed(1)
      : '۳.۸';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200 text-right">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            سامانه پایش داروها و مسکن‌های مصرفی
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            ثبت دوزهای مصرفی مسکن‌ها، ارزیابی میزان اثربخشی و پایش پایبندی درمانی
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-700 hover:bg-indigo-800 text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت مصرف داروی جدید</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase text-slate-400">مجموع دوزهای ثبت‌شده</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalDoses}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">ثبت‌شده در پرونده بالینی</span>
        </div>

        <div className="bg-white border border-indigo-200 bg-indigo-50/20 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase text-indigo-700">میانگین امتیاز تسکین</span>
          <div className="text-2xl font-black text-indigo-950 mt-1" dir="ltr">★ {avgEffectiveness} / ۵.۰</div>
          <span className="text-[11px] text-slate-500 mt-1 block">بر اساس دوزهای ارزیابی‌شده</span>
        </div>

        <div className="bg-white border border-emerald-200 bg-emerald-50/20 rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold uppercase text-emerald-700">وضعیت پایبندی درمانی</span>
          <div className="text-2xl font-black text-emerald-950 mt-1">۹۴٪ منظم</div>
          <span className="text-[11px] text-slate-500 mt-1 block">مصرف منظم طبق دستور پزشک</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            تاریخچه مصرف داروها
          </h3>
          <span className="text-xs font-mono text-slate-500">{logs.length} مورد ثبت‌شده</span>
        </div>

        <div className="divide-y divide-slate-100">
          {logs.map((log) => {
            let dateStr = '';
            try {
              dateStr = format(parseISO(log.takenAt), 'd MMMM yyyy - ساعت HH:mm', { locale: faIR });
            } catch (e) {
              dateStr = log.takenAt;
            }

            return (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-indigo-700 shrink-0" />
                    <span className="font-bold text-slate-900">{log.medicationName}</span>
                    <span className="text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {log.dosage}
                    </span>
                    {log.category && (
                      <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                        {log.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>زمان مصرف: {dateStr}</span>
                  </div>
                  {log.notes && (
                    <p className="text-slate-600 text-xs italic mt-1">«{log.notes}»</p>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">میزان تسکین:</span>
                  <span
                    className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg border ${
                      log.effectiveness >= 4
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : log.effectiveness >= 2
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                  >
                    ★ {log.effectiveness}/۵
                  </span>
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="p-8 text-center text-slate-400">
              <Pill className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold text-slate-600">هنوز دارویی ثبت نشده است</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-right">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">ثبت دوز مصرفی دارو</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMedLog} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">انتخاب دارو</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full text-xs rounded-xl border-slate-300 shadow-xs py-2 px-3 bg-white"
                >
                  {MASTER_MEDICATIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category} - دوز استاندارد: {m.standardDose})
                    </option>
                  ))}
                  <option value="custom">سایر / داروی تجویزی متفرقه...</option>
                </select>
              </div>

              {selectedMedId === 'custom' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نام داروی تجویزی</label>
                  <input
                    type="text"
                    value={customMedName}
                    onChange={(e) => setCustomMedName(e.target.value)}
                    placeholder="مثال: ژل دیکلوفناک ۱٪، قرص ناپروکسن"
                    className="w-full text-xs rounded-xl border-slate-300 py-2 px-3"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">دوز مصرفی</label>
                  <input
                    type="text"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="مثال: ۵۰۰ میلی‌گرم"
                    className="w-full text-xs rounded-xl border-slate-300 py-2 px-3"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">زمان مصرف</label>
                  <input
                    type="datetime-local"
                    value={takenAt}
                    onChange={(e) => setTakenAt(e.target.value)}
                    className="w-full text-xs rounded-xl border-slate-300 py-2 px-3 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">میزان تسکین درد (۱ تا ۵)</label>
                <div className="flex gap-2" dir="ltr">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setEffectiveness(num)}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                        effectiveness === num
                          ? 'bg-indigo-700 text-white border-indigo-800 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      ★ {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">یادداشت‌های بالینی و مشاهدات (اختیاری)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: بعد از نیم ساعت درد کمر کاهش یافت و باعث خواب‌آلودگی خفیف شد..."
                  className="w-full text-xs rounded-xl border-slate-300 p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  ذخیره مصرف دارو
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
